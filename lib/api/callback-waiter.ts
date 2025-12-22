// In-memory store for pending callbacks
// Use globalThis to ensure persistence across module reloads and in serverless environments
// Key: job_id, Value: { resolve, reject, timeout }
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

// Cleanup function to remove resolved/rejected callbacks
function cleanupCallback(jobId: string) {
  console.log('[CALLBACK-WAITER] cleanupCallback called for job:', jobId);
  const pending = pendingCallbacks.get(jobId);
  if (pending) {
    console.log('[CALLBACK-WAITER] Cleaning up timeout and removing callback for job:', jobId);
    clearTimeout(pending.timeout);
    pendingCallbacks.delete(jobId);
    console.log('[CALLBACK-WAITER] Cleanup complete, remaining callbacks:', pendingCallbacks.size);
  } else {
    console.warn('[CALLBACK-WAITER] Cleanup called but no pending callback found for job:', jobId);
  }
}

// Function to wait for callback (called from generate route)
export function waitForCallback(
  jobId: string,
  maxWaitTime: number = 7 * 60 * 1000
): Promise<{ status: string; images: any[] }> {
  console.log('[CALLBACK-WAITER] waitForCallback called for job:', jobId, 'maxWaitTime:', maxWaitTime, 'ms');
  console.log('[CALLBACK-WAITER] Process ID:', process.pid);
  console.log('[CALLBACK-WAITER] Using globalThis store:', typeof globalThis.__blumpoPendingCallbacks);
  console.log('[CALLBACK-WAITER] Current pending callbacks:', pendingCallbacks.size);
  
  return new Promise((resolve, reject) => {
    // Check if callback already arrived (race condition protection)
    const existing = pendingCallbacks.get(jobId);
    if (existing) {
      console.warn('[CALLBACK-WAITER] Job ID already exists, cleaning up old entry:', jobId);
      cleanupCallback(jobId);
    }

    console.log('[CALLBACK-WAITER] Creating timeout for job:', jobId);
    // Set timeout
    const timeout = setTimeout(() => {
      const pending = pendingCallbacks.get(jobId);
      console.log('[CALLBACK-WAITER] Timeout fired for job:', jobId, 'pending exists:', !!pending);
      if (pending) {
        console.error('[CALLBACK-WAITER] Timeout fired for job:', jobId, 'after', maxWaitTime, 'ms');
        cleanupCallback(jobId);
        reject(new Error('Callback timeout - exceeded maximum wait time'));
      } else {
        console.warn('[CALLBACK-WAITER] Timeout fired but no pending callback found for job:', jobId);
      }
    }, maxWaitTime);

    // Store the promise handlers
    // IMPORTANT: The resolve/reject handlers are called directly from resolveCallback/rejectCallback
    // They should just resolve/reject the promise without checking the map (which may already be deleted)
    const callbackHandlers = {
      resolve: (data: any) => {
        console.log('[CALLBACK-WAITER] Resolve handler called for job:', jobId);
        // Don't check pending - resolveCallback already verified it exists
        // Just clear the timeout and resolve the promise
        clearTimeout(timeout);
        console.log('[CALLBACK-WAITER] Resolving promise for job:', jobId);
        resolve(data);
      },
      reject: (error: Error) => {
        console.log('[CALLBACK-WAITER] Reject handler called for job:', jobId);
        // Don't check pending - just clear timeout and reject
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
export function resolveCallback(jobId: string, data: { status: string; images: any[] }) {
  console.log('[CALLBACK-WAITER] resolveCallback called for job:', jobId);
  console.log('[CALLBACK-WAITER] Process ID:', process.pid);
  console.log('[CALLBACK-WAITER] Using globalThis store:', typeof globalThis.__blumpoPendingCallbacks);
  console.log('[CALLBACK-WAITER] Total pending callbacks:', pendingCallbacks.size);
  console.log('[CALLBACK-WAITER] Pending job IDs:', Array.from(pendingCallbacks.keys()));
  console.log('[CALLBACK-WAITER] Looking for job ID:', jobId);
  console.log('[CALLBACK-WAITER] Map has job?', pendingCallbacks.has(jobId));
  
  const pending = pendingCallbacks.get(jobId);
  if (pending) {
    console.log('[CALLBACK-WAITER] Found pending callback for job:', jobId);
    // Remove from map BEFORE calling resolve to prevent double resolution
    // The resolve handler will clear the timeout
    pendingCallbacks.delete(jobId);
    console.log('[CALLBACK-WAITER] Removed from map, calling pending.resolve for job:', jobId);
    // Now call resolve - this will trigger the promise resolution
    // The resolve handler will clear the timeout and resolve the promise
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
    console.warn('[CALLBACK-WAITER] This likely means the routes are running in different processes (serverless isolation)');
  }
}

// Function to reject callback (called from callback route on error)
export function rejectCallback(jobId: string, error: Error) {
  const pending = pendingCallbacks.get(jobId);
  if (pending) {
    pending.reject(error);
  }
}

