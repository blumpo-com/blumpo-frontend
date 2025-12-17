'use client';

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import styles from './creating-process.module.css';

// Icon component that renders the appropriate SVG based on step index
interface StepIconProps {
  index: number;
  isActive: boolean;
}

function StepIcon({ index, isActive }: StepIconProps) {
  const iconColor = isActive ? 'white' : '#B0B7C2';
  const strokeColor = isActive ? 'white' : '#B0B7C2';
  
  // Box icon (for steps 0 and 4)
  if (index === 0 || index === 4) {
    return (
      <svg width="20" height="20" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.stepIconSvg}>
        <path d="M6.84693 13.5263C7.03618 13.6356 7.25086 13.6931 7.46939 13.6931C7.68793 13.6931 7.90261 13.6356 8.09186 13.5263L12.4491 11.0365C12.6382 10.9273 12.7952 10.7704 12.9045 10.5813C13.0137 10.3923 13.0714 10.1779 13.0716 9.95961V4.97987C13.0714 4.76155 13.0137 4.54713 12.9045 4.35812C12.7952 4.16911 12.6382 4.01215 12.4491 3.903L8.09186 1.41313C7.90261 1.30386 7.68793 1.24634 7.46939 1.24634C7.25086 1.24634 7.03618 1.30386 6.84693 1.41313L2.48965 3.903C2.30059 4.01215 2.14355 4.16911 2.0343 4.35812C1.92504 4.54713 1.86741 4.76155 1.86719 4.97987V9.95961C1.86741 10.1779 1.92504 10.3923 2.0343 10.5813C2.14355 10.7704 2.30059 10.9273 2.48965 11.0365L6.84693 13.5263Z" stroke={strokeColor} strokeWidth="1.24493" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7.46875 13.6944V7.46973" stroke={strokeColor} strokeWidth="1.24493" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2.04883 4.35718L7.47052 7.46951L12.8922 4.35718" stroke={strokeColor} strokeWidth="1.24493" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M4.66797 2.65796L10.2702 5.86367" stroke={strokeColor} strokeWidth="1.24493" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  
  // Paint icon (for step 1)
  if (index === 1) {
    return (
      <svg width="20" height="20" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.stepIconSvg}>
        <path opacity="0.3" d="M3.70703 2.47119H9.88454V3.70669H3.70703V2.47119Z" fill={iconColor}/>
        <path d="M10.5015 1.23535H3.08845C2.74869 1.23535 2.4707 1.51334 2.4707 1.8531V4.32411C2.4707 4.66387 2.74869 4.94186 3.08845 4.94186H10.5015C10.8412 4.94186 11.1192 4.66387 11.1192 4.32411V3.70636H11.737V6.17736H5.55946V12.9726C5.55946 13.3124 5.83745 13.5904 6.17721 13.5904H7.41271C7.75247 13.5904 8.03046 13.3124 8.03046 12.9726V7.41286H12.9725V2.47085H11.1192V1.8531C11.1192 1.51334 10.8412 1.23535 10.5015 1.23535ZM9.88371 3.70636H3.7062V2.47085H9.88371V3.70636Z" fill={iconColor}/>
      </svg>
    );
  }
  
  // Search icon (for step 2)
  if (index === 2) {
    return (
      <svg width="20" height="20" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.stepIconSvg}>
        <g clipPath="url(#clip0_search)">
          <path d="M10.1768 9.80029L13.5176 13.1499L13.1504 13.5171L9.80078 10.1753V9.80029H10.1768ZM5.71289 1.18799C8.21145 1.18825 10.2363 3.21378 10.2363 5.7124C10.2362 6.83236 9.82615 7.86173 9.14355 8.65576L8.91797 8.91748L8.65625 9.14307C7.86222 9.82566 6.83285 10.2357 5.71289 10.2358C3.21427 10.2358 1.18874 8.21096 1.18848 5.7124C1.18848 3.21362 3.21411 1.18799 5.71289 1.18799ZM5.71289 1.62354C3.45116 1.62354 1.62402 3.45068 1.62402 5.7124C1.62429 7.9739 3.45133 9.80029 5.71289 9.80029C7.97423 9.80003 9.80052 7.97374 9.80078 5.7124C9.80078 3.45084 7.97439 1.6238 5.71289 1.62354Z" fill={iconColor} stroke={strokeColor} strokeWidth="1.13025"/>
        </g>
        <defs>
          <clipPath id="clip0_search">
            <rect width="14.9392" height="14.9392" fill="white"/>
          </clipPath>
        </defs>
      </svg>
    );
  }
  
  // Chart icon (for step 3)
  return (
    <svg width="20" height="20" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.stepIconSvg}>
      <path d="M7.46875 1.69434C10.6566 1.69434 13.2441 4.28186 13.2441 7.46973C13.2441 10.6576 10.6566 13.2451 7.46875 13.2451C4.28089 13.2451 1.69336 10.6576 1.69336 7.46973C1.69339 4.28189 4.28091 1.69437 7.46875 1.69434ZM6.79102 2.08789C4.11664 2.42049 2.04007 4.70653 2.04004 7.46973C2.04004 10.2329 4.11662 12.519 6.79102 12.8516L7.2959 12.915V2.02539L6.79102 2.08789ZM7.6416 12.915L8.14648 12.8516C10.5977 12.546 12.545 10.5986 12.8506 8.14746L12.9141 7.64258H7.6416V12.915ZM7.6416 7.29688H12.9141L12.8506 6.79199C12.545 4.34082 10.5977 2.39344 8.14648 2.08789L7.6416 2.02441V7.29688Z" fill={iconColor} stroke={strokeColor} strokeWidth="0.898551"/>
    </svg>
  );
}

// Memoized Left Panel component - with header and button
const LeftPanel = memo(function LeftPanel() {
  return (
    <div className={styles.leftPanel}>
      <div className={styles.leftPanelContent}>
        {/* Header Section */}
        <div className={styles.leftPanelHeader}>
          <h1 className={styles.leftPanelTitle}>Creating Ads</h1>
          <p className={styles.leftPanelDescription}>
            We are crafting best ads for you. <br />
            It will take less than 2 minutes.
          </p>
        </div>

        {/* Illustration */}
        <div className={styles.illustrationWrapper}>
          <div className={styles.illustrationCard}>
            <div className={styles.vectorContainer}>
              <div className="flex-none rotate-[151.388deg]">
                <div className="h-[327.266px] relative w-[470.453px]">
                  {/* 
                  <img
                    alt=""
                    className={styles.vectorImage}
                    height={327.266}
                    src={imgVector3}
                    width={470.453}
                    loading="eager"
                    key="vector3"
                  />
                  */}
                </div>
              </div>
            </div>
          </div>
          <div className={styles.rabbitContainer}>
            <div className="absolute flex h-[50.878px] items-center justify-center left-[73.41px] top-[36.15px] w-[27.447px]">
              <div className="flex-none rotate-[180deg] scale-y-[-100%]">
                <div className="h-[50.878px] relative w-[27.447px]">
                  {/*
                  <img alt="" className="block max-w-none size-full" src={imgVector1} loading="eager" key="vector1" />
                  */}
                </div>
              </div>
            </div>
            <div className="absolute flex h-[57.088px] items-center justify-center left-[28.92px] top-[32.37px] w-[43.193px]">
              <div className="flex-none rotate-[159.059deg] scale-y-[-100%]">
                <div className="h-[50.878px] relative w-[26.778px]">
                  {/*
                  <img alt="" className="block max-w-none size-full" src={imgVector2} loading="eager" key="vector2" />
                  */}
                </div>
              </div>
            </div>
            <div className="absolute h-[361.5px] left-[-25px] top-0 w-[241px]">
              {/*
              <img
                alt=""
                className={styles.rabbitImage}
                src={imgChatGptImage3Lis2025232050Photoroom1}
                loading="eager"
                key="rabbit"
              />
              */}
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <button className={styles.playButton}>
          <span>Play with Blumpo</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
});


export type StepStatus = 'done' | 'inProgress' | 'pending';

export interface ProcessStep {
  id: string;
  title: string;
  description: string;
  status: StepStatus;
  progress?: number; // 0-100 for inProgress state
}

interface CreatingProcessProps {
  steps?: ProcessStep[];
  onComplete?: () => void;
  // For future webhook integration
  onStepUpdate?: (stepId: string, status: StepStatus, progress?: number) => void;
}

// Default steps configuration
const defaultSteps: Omit<ProcessStep, 'status' | 'progress'>[] = [
  {
    id: 'analyze-website',
    title: 'Analyzing your website',
    description: 'Understanding your structure, content, and user flow',
  },
  {
    id: 'capture-tone',
    title: 'Capturing your tone, colors, and style',
    description: 'Extracting your brand personality and visual direction',
  },
  {
    id: 'review-social',
    title: 'Reviewing social media and Reddit to discover pain points',
    description: 'Identifying what people actually struggle with',
  },
  {
    id: 'benchmark-competitors',
    title: 'Benchmarking competitors',
    description: 'Studying what others in your space are doing well',
  },
  {
    id: 'craft-cta',
    title: 'Crafting clear and persuasive call-to-action',
    description: 'Shaping the message that motivates users to take action',
  },
];

// Static timing configuration (in milliseconds)
// This will be replaced with webhook data in the future
const STEP_TIMINGS = {
  'analyze-website': 5000,      // 5 seconds
  'capture-tone': 6500,         // 6.5 seconds
  'review-social': 4000,        // 4 seconds (longer, with progress bar)
  'benchmark-competitors': 7000, // 7 seconds
  'craft-cta': 7500,            // 7.5 seconds
};

// Progress update interval for in-progress steps (ms)
const PROGRESS_UPDATE_INTERVAL = 50;

export function CreatingProcess({
  steps: externalSteps,
  onComplete,
  onStepUpdate
}: CreatingProcessProps) {
  const isControlled = !!externalSteps;

  const [steps, setSteps] = useState<ProcessStep[]>(() => {
    if (externalSteps) {
      return externalSteps;
    }
    // Initialize with all steps as pending
    return defaultSteps.map(step => ({
      ...step,
      status: 'pending' as StepStatus,
      progress: 0,
    }));
  });

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [animatingConnectorIndex, setAnimatingConnectorIndex] = useState<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Connector line animation duration (must match CSS)
  const CONNECTOR_ANIMATION_DURATION = 800; // 0.8s in milliseconds

  // Sync with external steps if controlled
  useEffect(() => {
    if (externalSteps) {
      setSteps(externalSteps);
    }
  }, [externalSteps]);

  // Start the process (only for automatic mode)
  const startProcess = useCallback(() => {
    if (isRunning || isControlled) return;

    setIsRunning(true);
    setCurrentStepIndex(0);

    // Initialize first step
    setSteps(prev => prev.map((step, index) =>
      index === 0
        ? { ...step, status: 'inProgress' as StepStatus, progress: 0 }
        : step
    ));
  }, [isControlled]);

  // Update step progress (only for automatic mode)
  useEffect(() => {
    if (isControlled || !isRunning || currentStepIndex < 0) {
      startTimeRef.current = null;
      return;
    }

    // Get step info from defaultSteps to avoid depending on steps state
    const stepInfo = defaultSteps[currentStepIndex];
    if (!stepInfo) return;

    const stepId = stepInfo.id;
    const stepDuration = STEP_TIMINGS[stepId as keyof typeof STEP_TIMINGS] || 3000;

    // Initialize start time only once per step
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
    }

    const progressInterval = setInterval(() => {
      if (startTimeRef.current === null) return;

      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(100, (elapsed / stepDuration) * 100);

      setSteps(prev => {
        const currentStep = prev[currentStepIndex];
        if (currentStep?.status !== 'inProgress') return prev;

        return prev.map((step, index) => {
          if (index === currentStepIndex) {
            const updated = { ...step, progress };
            onStepUpdate?.(step.id, 'inProgress', progress);
            return updated;
          }
          return step;
        });
      });
    }, PROGRESS_UPDATE_INTERVAL);

    // Complete current step and trigger connector line animation
    const completionTimeout = setTimeout(() => {
      clearInterval(progressInterval);
      startTimeRef.current = null;

      // Check if this is the last step
      const isLastStep = currentStepIndex >= defaultSteps.length - 1;

      if (isLastStep) {
        // Last step: keep inProgress state with 100% progress, don't mark as done
        setSteps(prev => prev.map((step, index) => {
          if (index === currentStepIndex) {
            const updated = { ...step, status: 'inProgress' as StepStatus, progress: 100 };
            onStepUpdate?.(step.id, 'inProgress', 100);
            return updated;
          }
          return step;
        }));
        
        // Stop running but keep animation state
        setIsRunning(false);
        onComplete?.();
        return;
      }

      // For non-last steps: mark as done
      setSteps(prev => prev.map((step, index) => {
        if (index === currentStepIndex) {
          const updated = { ...step, status: 'done' as StepStatus, progress: 100 };
          onStepUpdate?.(step.id, 'done', 100);
          return updated;
        }
        return step;
      }));

      // Trigger connector line animation for the line below this step
      setAnimatingConnectorIndex(currentStepIndex);

      // After connector animation completes, start next step
      setTimeout(() => {
        setAnimatingConnectorIndex(null);

        setCurrentStepIndex(prevIndex => {
          const nextIndex = prevIndex + 1;
          if (nextIndex < defaultSteps.length) {
            setSteps(prev => prev.map((step, index) =>
              index === nextIndex
                ? { ...step, status: 'inProgress' as StepStatus, progress: 0 }
                : step
            ));
            return nextIndex;
          } else {
            // All steps completed
            setIsRunning(false);
            onComplete?.();
            return prevIndex;
          }
        });
      }, CONNECTOR_ANIMATION_DURATION);
    }, stepDuration);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(completionTimeout);
    };
  }, [isControlled, isRunning, currentStepIndex, onStepUpdate, onComplete]);

  // Auto-start on mount (only for automatic mode)
  useEffect(() => {
    if (!isControlled) {
      startProcess();
    }
  }, [startProcess, isControlled]);

  return (
    <div className={styles.creatingProcessContainer}>
      <LeftPanel />
      <div className={styles.rightPanel}>
        <div className={styles.rightPanelInner}>
          <div className={styles.contentArea}>
            <div className={styles.container}>
              <ul className={styles.stepsList}>
                {steps.map((step, index) => {
                  // Check if all previous steps are done
                  const allPreviousStepsDone = index === 0 ||
                    steps.slice(0, index).every(prevStep => prevStep.status === 'done');

                  return (
                    <li key={step.id} className={styles.stepItem}>
                      <ProcessStepComponent
                        step={step}
                        index={index}
                        isLast={index === steps.length - 1}
                        previousStepStatus={index > 0 ? steps[index - 1].status : null}
                        isConnectorAnimating={animatingConnectorIndex === index}
                        allPreviousStepsDone={allPreviousStepsDone}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ProcessStepComponentProps {
  step: ProcessStep;
  index: number;
  isLast: boolean;
  previousStepStatus: StepStatus | null;
  isConnectorAnimating?: boolean;
  allPreviousStepsDone?: boolean;
}

function ProcessStepComponent({
  step,
  index,
  isLast,
  previousStepStatus,
  isConnectorAnimating = false,
  allPreviousStepsDone = false
}: ProcessStepComponentProps) {
  const isActive = step.status === 'done' || step.status === 'inProgress';
  const isInProgress = step.status === 'inProgress';
  const isPending = step.status === 'pending';
  const isDone = step.status === 'done';

  // Determine connector line state
  // Connector line should animate when previous step becomes done
  const showConnectorAnimation = isConnectorAnimating;


  return (
    <div className={styles.stepWrapper}>
      {/* Icon Circle */}
      <div className={styles.iconContainer}>
        <div className={`${styles.iconCircle} ${isActive ? styles.iconCircleActive : styles.iconCirclePending
          } ${isInProgress ? styles.iconCircleInProgress : ''}`}>
          <StepIcon index={index} isActive={isActive} />
        </div>

        {/* Connector Line */}
        {!isLast && (
          <div
            className={`${styles.connectorLine} ${showConnectorAnimation
                ? styles.connectorLineAnimating
                : isDone
                  ? styles.connectorLineGradient
                  : styles.connectorLinePending
              }`}
          />
        )}
      </div>

      {/* Content */}
      <div className={styles.stepContent}>
        <h3 className={`${styles.stepTitle} ${isActive ? styles.stepTitleActive : styles.stepTitlePending}`}>
          {step.title}
        </h3>
        <p className={`${styles.stepDescription} ${isActive ? styles.stepDescriptionActive : styles.stepDescriptionPending}`}>
          {step.description}
        </p>

        {/* Status Indicator */}
        {step.status === 'done' && (
          <div className={styles.statusIndicator}>
            <span className={styles.statusDot}>•</span>
            <span className={styles.statusText}>Done</span>
          </div>
        )}

        {/* Progress Bar for in-progress step */}
        {step.status === 'inProgress' && step.progress !== undefined && (
          <div className={styles.progressBarContainer}>
            <div
              className={styles.progressBarFill}
              style={{ width: `${step.progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
