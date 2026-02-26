// Redis status checker for generation jobs
// Checks Redis keys directly (no database queries) to determine job completion status
// Uses the same Redis pattern as callback-waiter: callback:{jobId}

// Conditional import to avoid build errors if package is not installed
let Redis: any = null;
try {
  const redisModule = require('@upstash/redis');
  Redis = redisModule.Redis;
} catch (e) {
  // Package not installed or not available
  console.warn('[REDIS-STATUS-CHECKER] @upstash/redis not available');
}

const REDIS_KEY_PREFIX = 'callback:';

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
  if (!Redis) {
    return null;
  }
  
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  
  if (!url || !token) {
    return null;
  }
  
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

/**
 * Check Redis keys for job completion status
 * Returns null for jobs that haven't completed yet (no Redis key exists)
 * Returns callback result for completed jobs
 */
export async function checkJobStatuses(
  jobIds: string[]
): Promise<{ [jobId: string]: { status: string; images: any[]; error_message?: string; error_code?: string } | null }> {
  const results: { [jobId: string]: { status: string; images: any[]; error_message?: string; error_code?: string } | null } = {};
  
  if (!isRedisAvailable()) {
    // If Redis is not available, return null for all jobs (no status updates)
    for (const jobId of jobIds) {
      results[jobId] = null;
    }
    return results;
  }
  
  const redis = getRedisClient();
  if (!redis) {
    for (const jobId of jobIds) {
      results[jobId] = null;
    }
    return results;
  }
  
  // Check Redis keys for each job
  const checkPromises = jobIds.map(async (jobId) => {
    const redisKey = `${REDIS_KEY_PREFIX}${jobId}`;
    try {
      const resultStr = await redis.get(redisKey) as string | null;
      
      if (resultStr) {
        // Parse JSON string to CallbackResult
        let result: CallbackResult;
        try {
          result = typeof resultStr === 'string' ? JSON.parse(resultStr) : resultStr;
        } catch (parseError) {
          console.error('[REDIS-STATUS-CHECKER] Error parsing Redis result for job:', jobId, parseError);
          return { jobId, result: null };
        }
        
        return {
          jobId,
          result: {
            status: result.status,
            images: result.images || [],
            error_message: result.error_message,
            error_code: result.error_code,
          },
        };
      }
      
      return { jobId, result: null };
    } catch (error) {
      console.error('[REDIS-STATUS-CHECKER] Error checking Redis key for job:', jobId, error);
      return { jobId, result: null };
    }
  });
  
  const checkResults = await Promise.all(checkPromises);
  
  for (const { jobId, result } of checkResults) {
    results[jobId] = result;
  }
  
  return results;
}
