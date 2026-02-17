'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { X, ArrowRight, Loader2 } from 'lucide-react';

interface GenerationJob {
  id: string;
  status: 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED';
  displayName: string;
  createdAt: string;
  completedAt: string | null;
  viewedAt: string | null;
  isNew: boolean;
  adImageCount: number;
}

interface JobStatusCheck {
  [jobId: string]: {
    status: string;
    images: any[];
    error_message?: string;
    error_code?: string;
  } | null;
}

export function GenerationStatusPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const router = useRouter();

  // Fetch jobs in background (doesn't block UI)
  const fetchJobs = useCallback(async () => {
    try {
      const response = await fetch('/api/generation-jobs');
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      }
    } catch (error) {
      console.error('Error fetching generation jobs:', error);
    }
  }, []);

  // Check Redis for status updates
  const checkJobStatuses = useCallback(async () => {
    // Check only running jobs
    const activeJobIds = jobs
      .filter((job) => job.status === 'RUNNING')
      .map((job) => job.id);

    if (activeJobIds.length === 0) {
      return;
    }

    try {
      const response = await fetch('/api/generation-jobs/status-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobIds: activeJobIds }),
      });

      if (response.ok) {
        const statuses: JobStatusCheck = await response.json();
        
        // Update jobs with new statuses from Redis
        const hasUpdates = Object.values(statuses).some(status => status !== null);
        if (hasUpdates) {
          setJobs((prevJobs) =>
            prevJobs.map((job) => {
              const statusUpdate = statuses[job.id];
              if (statusUpdate) {
                const newStatus = statusUpdate.status as GenerationJob['status'];
                const isCompleted = newStatus === 'SUCCEEDED' || newStatus === 'FAILED' || newStatus === 'CANCELED';
                return {
                  ...job,
                  status: newStatus,
                  isNew: newStatus === 'SUCCEEDED' && !job.viewedAt && isCompleted,
                  completedAt: isCompleted ? new Date().toISOString() : job.completedAt,
                };
              }
              return job;
            })
          );
          
          // Refresh jobs list after status update to get latest from DB
          setTimeout(() => {
            fetchJobs();
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error checking job statuses:', error);
    }
  }, [jobs]);

  // Initial fetch when component mounts (background)
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Refresh when panel opens (background)
  useEffect(() => {
    if (isOpen) {
      fetchJobs();
    }
  }, [isOpen, fetchJobs]);

  // Poll for status updates
  useEffect(() => {
    if (!isOpen) return;

    const runningJobs = jobs.filter(
      (job) => job.status === 'RUNNING'
    );

    if (runningJobs.length === 0) {
      return;
    }

    // Poll every 2-3 seconds when panel is open
    const interval = setInterval(() => {
      checkJobStatuses();
    }, 2500);

    return () => clearInterval(interval);
  }, [isOpen, jobs, checkJobStatuses]);

  // Poll less frequently when panel is closed but icon visible
  useEffect(() => {
    if (isOpen) return;

    const runningJobs = jobs.filter(
      (job) => job.status === 'RUNNING'
    );

    if (runningJobs.length === 0) {
      return;
    }

    // Poll every 10 seconds when panel is closed
    const interval = setInterval(() => {
      checkJobStatuses();
    }, 10000);

    return () => clearInterval(interval);
  }, [isOpen, jobs, checkJobStatuses]);

  const handleJobClick = async (job: GenerationJob) => {
    if (job.status === 'SUCCEEDED') {
      // Close panel and navigate to ad generation page (not ad-review-view)
      setIsOpen(false);
      router.push(`/dashboard/ad-generation?job_id=${job.id}`);
    }
  };

  const getStatusColor = (status: GenerationJob['status']) => {
    switch (status) {
      case 'QUEUED':
      case 'RUNNING':
        return 'bg-gray-100';
      case 'SUCCEEDED':
        return 'bg-green-50';
      case 'FAILED':
      case 'CANCELED':
        return 'bg-red-50';
      default:
        return 'bg-gray-100';
    }
  };

  const getStatusText = (status: GenerationJob['status']) => {
    switch (status) {
      case 'QUEUED':
        return 'queued';
      case 'RUNNING':
        return 'in progress';
      case 'SUCCEEDED':
        return 'done';
      case 'FAILED':
        return 'failed';
      case 'CANCELED':
        return 'failed';
      default:
        return '';
    }
  };

  return (
    <>
      {/* Icon trigger - only visible when panel is closed */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-50 p-3 bg-white rounded-l-2xl shadow-lg hover:bg-gray-50 transition-all duration-300 ease-in-out border border-r-0 border-gray-200 ${
          isOpen
            ? 'opacity-0 pointer-events-none translate-x-4'
            : 'opacity-100 pointer-events-auto translate-x-0'
        }`}
        aria-label="Generation status"
      >
        <Image
          src="/assets/icons/History.svg"
          alt="Generation history"
          width={29}
          height={29}
          className="w-[29px] h-[29px]"
        />
      </button>

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <span className="text-sm font-medium text-gray-700">
              {jobs.length}/10
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              aria-label="Close panel"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Jobs list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {jobs.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No generation jobs yet
              </div>
            ) : (
              jobs.map((job) => {
                const isRunning = job.status === 'RUNNING';
                const isQueued = job.status === 'QUEUED';
                const isClickable = job.status === 'SUCCEEDED';

                return (
                  <button
                    key={job.id}
                    onClick={() => isClickable && handleJobClick(job)}
                    disabled={!isClickable}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      getStatusColor(job.status)
                    } ${
                      isClickable
                        ? 'hover:shadow-md cursor-pointer'
                        : 'cursor-default'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {job.isNew && (
                            <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded">
                              New!
                            </span>
                          )}
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {job.displayName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600">
                            {getStatusText(job.status)}
                          </span>
                          {isRunning && (
                            <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                          )}
                        </div>
                      </div>
                      {isClickable && (
                        <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Overlay when open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
