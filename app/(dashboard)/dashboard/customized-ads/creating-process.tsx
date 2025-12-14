'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Box } from 'lucide-react';
import styles from './creating-process.module.css';

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
  }, [isRunning, isControlled]);

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
      
      // Mark current step as done
      setSteps(prev => prev.map((step, index) => {
        if (index === currentStepIndex) {
          const updated = { ...step, status: 'done' as StepStatus, progress: 100 };
          onStepUpdate?.(step.id, 'done', 100);
          return updated;
        }
        return step;
      }));

      // Trigger connector line animation for the line below this step
      if (currentStepIndex < defaultSteps.length - 1) {
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
      } else {
        // Last step completed
        setIsRunning(false);
        onComplete?.();
      }
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
        <div className={`${styles.iconCircle} ${
          isActive ? styles.iconCircleActive : styles.iconCirclePending
        } ${isInProgress ? styles.iconCircleInProgress : ''}`}>
          <Box 
            className={`${styles.iconBox} ${isActive ? styles.iconBoxActive : styles.iconBoxPending}`}
            size={20}
            strokeWidth={2}
          />
        </div>
        
        {/* Connector Line */}
        {!isLast && (
          <div 
            className={`${styles.connectorLine} ${
              showConnectorAnimation
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
