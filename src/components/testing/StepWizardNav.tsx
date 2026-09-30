import React from 'react';
import { Check } from 'lucide-react';
import { clsx } from 'clsx';

export interface StepDef {
  id: number;
  label: string;
  stepCode: string;
}

export const WIZARD_STEPS: StepDef[] = [
  { id: 1, stepCode: 'STEP 01', label: 'Test Configuration' },
  { id: 2, stepCode: 'STEP 02', label: 'R-L Selection' },
  { id: 3, stepCode: 'STEP 03', label: 'CVU Verification' },
  { id: 4, stepCode: 'STEP 04', label: 'Calibration' },
  { id: 5, stepCode: 'STEP 05', label: 'MCB Testing' },
  { id: 6, stepCode: 'STEP 06', label: 'Results' },
];

interface StepWizardNavProps {
  currentStep: number;
  completedSteps: number[];
  onSelectStep: (stepId: number) => void;
}

export const StepWizardNav: React.FC<StepWizardNavProps> = ({
  currentStep,
  completedSteps,
  onSelectStep,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-md px-4 py-2.5 shadow-2xs mb-5">
      <div className="flex items-center justify-between overflow-x-auto gap-2 md:gap-4 no-scrollbar">
        {WIZARD_STEPS.map((step, index) => {
          const isCurrent = currentStep === step.id;
          const isCompleted = completedSteps.includes(step.id);
          const isClickable = isCompleted || step.id <= Math.max(...completedSteps, 1) + 1;

          return (
            <React.Fragment key={step.id}>
              <button
                type="button"
                onClick={() => isClickable && onSelectStep(step.id)}
                disabled={!isClickable}
                className={clsx(
                  'flex items-center gap-2.5 py-1 px-2 rounded transition-all text-left flex-shrink-0 cursor-pointer',
                  isCurrent
                    ? 'bg-teal-50 border border-teal-200 text-teal-900'
                    : isCompleted
                    ? 'hover:bg-slate-100 text-slate-800'
                    : 'opacity-40 cursor-not-allowed text-slate-400'
                )}
              >
                {/* Step Circle */}
                <div
                  className={clsx(
                    'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold font-mono transition-colors flex-shrink-0',
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-teal-600 text-white ring-2 ring-teal-200'
                      : 'bg-slate-200 text-slate-600'
                  )}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : step.id}
                </div>

                {/* Step Text Header */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-slate-400 font-semibold tracking-wider">
                      {step.stepCode}
                    </span>
                    {isCurrent && (
                      <span className="text-[9px] bg-teal-100 text-teal-800 font-mono font-bold px-1 rounded uppercase">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-semibold leading-tight text-slate-800 truncate">
                    {step.label}
                  </div>
                </div>
              </button>

              {/* Connector line */}
              {index < WIZARD_STEPS.length - 1 && (
                <div className="flex-1 min-w-3 max-w-8 h-px bg-slate-200 hidden sm:block flex-shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
