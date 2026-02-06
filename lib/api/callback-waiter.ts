// Redis-based callback waiter for serverless environments
// Uses Upstash Redis (HTTP-based, serverless-friendly) to share state across different serverless function instances
// Falls back to in-memory storage for local development when Redis is not available

// Conditional import to avoid build errors if package is not installed
let Redis: any = null;
try {
  const redisModule = require('@upstash/redis');
  Redis = redisModule.Redis;
} catch (e) {
  // Package not installed or not available - will use in-memory fallback
  console.warn('[CALLBACK-WAITER] @upstash/redis not available, using in-memory fallback');
}

const REDIS_KEY_PREFIX = 'callback:';
const INITIAL_POLL_DELAY = 60 * 1000; // Wait 1 minute before first poll
const POLL_INTERVAL = 2 * 1000; // Poll every 2 seconds after initial delay

interface CallbackResult {
  status: string;
  images: any[];
  error?: string;
  error_message?: string;
  error_code?: string;
}

// Initialize Redis client (lazy initialization)
let redisClient: any = null;

// Check if Redis is available and initialize client
const getRedisClient = (): any => {
  // If Redis class is not available, return null
  if (!Redis) {
    return null;
  }
  
  // Check for Upstash Redis environment variables
  // Support both UPSTASH_* and KV_* naming conventions for compatibility
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  
  if (!url || !token) {
    return null;
  }
  
  // Initialize client if not already created
  if (!redisClient) {
    redisClient = new Redis({
      url,
      token,
    });
  }
  
  return redisClient;
};

// Check if Redis is available
const isRedisAvailable = () => {
  return getRedisClient() !== null;
};

// Fallback in-memory store for local development
// Supports multiple concurrent waiters per job (e.g. page reload during generation)
declare global {
  // eslint-disable-next-line no-var
  var __blumpoPendingCallbacks: Map<
    string,
    Array<{
      resolve: (data: any) => void;
      reject: (error: Error) => void;
      timeout: NodeJS.Timeout;
    }>
  > | undefined;
}

const pendingCallbacks =
  globalThis.__blumpoPendingCallbacks ??
  (globalThis.__blumpoPendingCallbacks = new Map<
    string,
    Array<{
      resolve: (data: any) => void;
      reject: (error: Error) => void;
      timeout: NodeJS.Timeout;
    }>
  >());

// Function to wait for callback (called from generate route)
// Uses Redis in production, falls back to in-memory storage for local development
export async function waitForCallback(
  jobId: string,
  maxWaitTime: number = 7 * 60 * 1000
): Promise<{ status: string; images: any[]; error_message?: string; error_code?: string }> {
  console.log('[CALLBACK-WAITER] waitForCallback called for job:', jobId, 'maxWaitTime:', maxWaitTime, 'ms');
  console.log('[CALLBACK-WAITER] Redis available:', isRedisAvailable());
  
  // Use Redis if available (production/Vercel)
  if (isRedisAvailable()) {
    return waitForCallbackRedis(jobId, maxWaitTime);
  }
  
  // Fallback to in-memory storage (local development)
  return waitForCallbackMemory(jobId, maxWaitTime);
}

// Redis-based implementation
async function waitForCallbackRedis(
  jobId: string,
  maxWaitTime: number
): Promise<{ status: string; images: any[]; error_message?: string; error_code?: string }> {
  const redis = getRedisClient();
  if (!redis) {
    throw new Error('Redis client not available');
  }
  
  const redisKey = `${REDIS_KEY_PREFIX}${jobId}`;
  const startTime = Date.now();
  
  return new Promise((resolve, reject) => {
    // Set timeout for maximum wait time
    const timeout = setTimeout(() => {
      console.error('[CALLBACK-WAITER] Timeout fired for job:', jobId, 'after', maxWaitTime, 'ms');
      // Clean up Redis key on timeout
      redis.del(redisKey).catch((err: unknown) => {
        console.warn('[CALLBACK-WAITER] Error cleaning up Redis key on timeout:', err);
      });
      reject(new Error('Callback timeout - exceeded maximum wait time'));
    }, maxWaitTime);

    // Poll Redis for callback result
    const poll = async () => {
      try {
        const resultStr = await redis.get(redisKey) as string | null;
        
        if (resultStr) {
          // Parse JSON string to CallbackResult
          let result: CallbackResult;
          try {
            result = typeof resultStr === 'string' ? JSON.parse(resultStr) : resultStr;
          } catch (parseError) {
            console.error('[CALLBACK-WAITER] Error parsing Redis result for job:', jobId, parseError);
            clearTimeout(timeout);
            reject(new Error('Failed to parse callback result'));
            return;
          }
          
          // Callback result found!
          clearTimeout(timeout);
          const waitDuration = Date.now() - startTime;
          console.log('[CALLBACK-WAITER] Callback result found in Redis after', waitDuration, 'ms for job:', jobId);
          
          // Do NOT delete the key here - multiple concurrent waiters may be polling for the same job
          // (e.g. page reload while generation in progress). TTL will clean up the key automatically.
          
          if (result.error) {
            reject(new Error(result.error));
          } else {
            resolve({
              status: result.status,
              images: result.images || [],
              error_message: result.error_message,
              error_code: result.error_code,
            });
          }
          return;
        }
        
        // No result yet, continue polling
        const elapsed = Date.now() - startTime;
        if (elapsed < maxWaitTime) {
          setTimeout(poll, POLL_INTERVAL);
        }
      } catch (error) {
        console.error('[CALLBACK-WAITER] Error polling Redis for job:', jobId, error);
        clearTimeout(timeout);
        reject(new Error(`Failed to poll for callback: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };

    // Start polling after initial delay (1 minute)
    console.log('[CALLBACK-WAITER] Starting to poll after', INITIAL_POLL_DELAY, 'ms (1 minute) for job:', jobId);
    setTimeout(poll, INITIAL_POLL_DELAY);
  });
}

// In-memory implementation (for local development)
function waitForCallbackMemory(
  jobId: string,
  maxWaitTime: number
): Promise<{ status: string; images: any[]; error_message?: string; error_code?: string }> {
  return new Promise((resolve, reject) => {
    console.log('[CALLBACK-WAITER] Creating timeout for job:', jobId);
    const timeout = setTimeout(() => {
      const handlers = pendingCallbacks.get(jobId);
      if (handlers) {
        const idx = handlers.findIndex((h) => h.timeout === timeout);
        if (idx >= 0) {
          handlers.splice(idx, 1);
          if (handlers.length === 0) pendingCallbacks.delete(jobId);
          console.error('[CALLBACK-WAITER] Timeout fired for job:', jobId, 'after', maxWaitTime, 'ms');
          reject(new Error('Callback timeout - exceeded maximum wait time'));
        }
      }
    }, maxWaitTime);

    const callbackHandlers = {
      resolve: (data: any) => {
        clearTimeout(timeout);
        resolve(data);
      },
      reject: (error: Error) => {
        clearTimeout(timeout);
        reject(error);
      },
      timeout,
    };

    const existing = pendingCallbacks.get(jobId);
    if (existing) {
      existing.push(callbackHandlers);
    } else {
      pendingCallbacks.set(jobId, [callbackHandlers]);
    }
    console.log('[CALLBACK-WAITER] Stored pending callback for job:', jobId, 'waiters:', pendingCallbacks.get(jobId)?.length ?? 0);
  });
}

// Function to resolve callback (called from callback route)
// Uses Redis in production, falls back to in-memory storage for local development
export async function resolveCallback(jobId: string, data: { status: string; images: any[]; error_message?: string; error_code?: string }) {
  console.log('[CALLBACK-WAITER] resolveCallback called for job:', jobId);
  console.log('[CALLBACK-WAITER] Redis available:', isRedisAvailable());
  
  if (isRedisAvailable()) {
    await resolveCallbackRedis(jobId, data);
  } else {
    resolveCallbackMemory(jobId, data);
  }
}

// Redis-based implementation
async function resolveCallbackRedis(jobId: string, data: { status: string; images: any[]; error_message?: string; error_code?: string }) {
  const redis = getRedisClient();
  if (!redis) {
    throw new Error('Redis client not available');
  }
  
  const redisKey = `${REDIS_KEY_PREFIX}${jobId}`;
  
  try {
    // Store result in Redis with TTL (max wait time + buffer)
    // TTL ensures the key is cleaned up even if the waiting function times out
    const ttl = 7 * 60 + 60; // 8 minutes (7 min max wait + 1 min buffer)
    
    // Upstash Redis uses setex or set with ex option for TTL
    await redis.set(redisKey, JSON.stringify({
      status: data.status,
      images: data.images || [],
      error_message: data.error_message,
      error_code: data.error_code,
    }), {
      ex: ttl, // Expire after TTL seconds
    });
    
    console.log('[CALLBACK-WAITER] Stored callback result in Redis for job:', jobId, 'with TTL:', ttl, 'seconds');
  } catch (error) {
    console.error('[CALLBACK-WAITER] Error storing callback result in Redis for job:', jobId, error);
    throw error;
  }
}

// In-memory implementation (for local development)
function resolveCallbackMemory(jobId: string, data: { status: string; images: any[]; error_message?: string; error_code?: string }) {
  const handlers = pendingCallbacks.get(jobId);
  if (handlers && handlers.length > 0) {
    pendingCallbacks.delete(jobId);
    console.log('[CALLBACK-WAITER] Resolving', handlers.length, 'waiter(s) for job:', jobId);
    for (const h of handlers) {
      try {
        clearTimeout(h.timeout);
        h.resolve(data);
      } catch (error) {
        console.error('[CALLBACK-WAITER] Error calling resolve handler:', error);
      }
    }
  } else {
    console.warn('[CALLBACK-WAITER] No pending callback found for job:', jobId);
  }
}

// Function to reject callback (called from callback route on error)
// Uses Redis in production, falls back to in-memory storage for local development
export async function rejectCallback(jobId: string, error: Error) {
  console.log('[CALLBACK-WAITER] rejectCallback called for job:', jobId);
  console.log('[CALLBACK-WAITER] Redis available:', isRedisAvailable());
  
  if (isRedisAvailable()) {
    await rejectCallbackRedis(jobId, error);
  } else {
    rejectCallbackMemory(jobId, error);
  }
}

// Redis-based implementation
async function rejectCallbackRedis(jobId: string, error: Error) {
  const redis = getRedisClient();
  if (!redis) {
    throw new Error('Redis client not available');
  }
  
  const redisKey = `${REDIS_KEY_PREFIX}${jobId}`;
  
  try {
    const ttl = 7 * 60 + 60; // 8 minutes
    
    await redis.set(redisKey, JSON.stringify({
      status: 'FAILED',
      images: [],
      error: error.message,
    }), {
      ex: ttl,
    });
    
    console.log('[CALLBACK-WAITER] Stored error in Redis for job:', jobId);
  } catch (err) {
    console.error('[CALLBACK-WAITER] Error storing error in Redis for job:', jobId, err);
    throw err;
  }
}

// In-memory implementation (for local development)
function rejectCallbackMemory(jobId: string, error: Error) {
  const handlers = pendingCallbacks.get(jobId);
  if (handlers && handlers.length > 0) {
    pendingCallbacks.delete(jobId);
    for (const h of handlers) {
      try {
        clearTimeout(h.timeout);
        h.reject(error);
      } catch (_) {
        /* ignore */
      }
    }
  } else {
    console.warn('[CALLBACK-WAITER] No pending callback found to reject for job:', jobId);
  }
}
