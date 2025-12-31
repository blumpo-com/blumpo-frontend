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
declare global {
  // eslint-disable-next-line no-var
  var __blumpoPendingCallbacks: Map<
    string,
    {
      resolve: (data: any) => void;
      reject: (error: Error) => void;
      timeout: NodeJS.Timeout;
    }
  > | undefined;
}

const pendingCallbacks =
  globalThis.__blumpoPendingCallbacks ??
  (globalThis.__blumpoPendingCallbacks = new Map<
    string,
    {
      resolve: (data: any) => void;
      reject: (error: Error) => void;
      timeout: NodeJS.Timeout;
    }
  >());

// Function to wait for callback (called from generate route)
// Uses Redis in production, falls back to in-memory storage for local development
export async function waitForCallback(
  jobId: string,
  maxWaitTime: number = 7 * 60 * 1000
): Promise<{ status: string; images: any[] }> {
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
): Promise<{ status: string; images: any[] }> {
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
          
          // Clean up Redis key
          await redis.del(redisKey).catch((err: unknown) => {
            console.warn('[CALLBACK-WAITER] Error cleaning up Redis key:', err);
          });
          
          if (result.error) {
            reject(new Error(result.error));
          } else {
            resolve({
              status: result.status,
              images: result.images || [],
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
): Promise<{ status: string; images: any[] }> {
  return new Promise((resolve, reject) => {
    // Check if callback already arrived (race condition protection)
    const existing = pendingCallbacks.get(jobId);
    if (existing) {
      console.warn('[CALLBACK-WAITER] Job ID already exists, cleaning up old entry:', jobId);
      clearTimeout(existing.timeout);
      pendingCallbacks.delete(jobId);
    }

    console.log('[CALLBACK-WAITER] Creating timeout for job:', jobId);
    // Set timeout
    const timeout = setTimeout(() => {
      const pending = pendingCallbacks.get(jobId);
      console.log('[CALLBACK-WAITER] Timeout fired for job:', jobId, 'pending exists:', !!pending);
      if (pending) {
        console.error('[CALLBACK-WAITER] Timeout fired for job:', jobId, 'after', maxWaitTime, 'ms');
        pendingCallbacks.delete(jobId);
        reject(new Error('Callback timeout - exceeded maximum wait time'));
      } else {
        console.warn('[CALLBACK-WAITER] Timeout fired but no pending callback found for job:', jobId);
      }
    }, maxWaitTime);

    // Store the promise handlers
    const callbackHandlers = {
      resolve: (data: any) => {
        console.log('[CALLBACK-WAITER] Resolve handler called for job:', jobId);
        clearTimeout(timeout);
        console.log('[CALLBACK-WAITER] Resolving promise for job:', jobId);
        resolve(data);
      },
      reject: (error: Error) => {
        console.log('[CALLBACK-WAITER] Reject handler called for job:', jobId);
        clearTimeout(timeout);
        console.log('[CALLBACK-WAITER] Rejecting promise for job:', jobId);
        reject(error);
      },
      timeout,
    };
    
    pendingCallbacks.set(jobId, callbackHandlers);
    console.log('[CALLBACK-WAITER] Stored pending callback for job:', jobId, 'total pending:', pendingCallbacks.size);
  });
}

// Function to resolve callback (called from callback route)
// Uses Redis in production, falls back to in-memory storage for local development
export async function resolveCallback(jobId: string, data: { status: string; images: any[] }) {
  console.log('[CALLBACK-WAITER] resolveCallback called for job:', jobId);
  console.log('[CALLBACK-WAITER] Redis available:', isRedisAvailable());
  
  if (isRedisAvailable()) {
    await resolveCallbackRedis(jobId, data);
  } else {
    resolveCallbackMemory(jobId, data);
  }
}

// Redis-based implementation
async function resolveCallbackRedis(jobId: string, data: { status: string; images: any[] }) {
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
function resolveCallbackMemory(jobId: string, data: { status: string; images: any[] }) {
  const pending = pendingCallbacks.get(jobId);
  if (pending) {
    console.log('[CALLBACK-WAITER] Found pending callback for job:', jobId);
    // Remove from map BEFORE calling resolve to prevent double resolution
    pendingCallbacks.delete(jobId);
    console.log('[CALLBACK-WAITER] Removed from map, calling pending.resolve for job:', jobId);
    try {
      pending.resolve(data);
      console.log('[CALLBACK-WAITER] Resolve called successfully, remaining callbacks:', pendingCallbacks.size);
    } catch (error) {
      console.error('[CALLBACK-WAITER] Error calling resolve handler:', error);
      throw error;
    }
  } else {
    console.warn('[CALLBACK-WAITER] No pending callback found for job:', jobId, '- callback arrived after timeout or request was cancelled');
    console.warn('[CALLBACK-WAITER] Available job IDs:', Array.from(pendingCallbacks.keys()));
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
  const pending = pendingCallbacks.get(jobId);
  if (pending) {
    pendingCallbacks.delete(jobId);
    pending.reject(error);
  } else {
    console.warn('[CALLBACK-WAITER] No pending callback found to reject for job:', jobId);
  }
}
