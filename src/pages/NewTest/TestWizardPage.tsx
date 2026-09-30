import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { StepWizardNav } from '../../components/testing/StepWizardNav';
import { TestConfigStep } from './steps/TestConfigStep';
import { RLConfigStep } from './steps/RLConfigStep';
import { CVUVerificationStep } from './steps/CVUVerificationStep';
import { CalibrationStep } from './steps/CalibrationStep';
import { MCBTestingStep } from './steps/MCBTestingStep';
import { TestResultsPage } from '../TestResults/TestResultsPage';
import { Button } from '../../components/common/Button';
import { useTestStore } from '../../store/testStore';
import { useToastStore } from '../../store/toastStore';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';

const STEP_PATHS: Record<number, string> = {
  1: '/new-test',
  2: '/new-test/rl-configuration',
  3: '/new-test/cvu-verification',
  4: '/new-test/calibration',
  5: '/new-test/testing',
  6: '/new-test/results',
};

const PATH_TO_STEP: Record<string, number> = {
  '/new-test': 1,
  '/new-test/': 1,
  '/new-test/rl-configuration': 2,
  '/new-test/cvu-verification': 3,
  '/new-test/calibration': 4,
  '/new-test/testing': 5,
  '/new-test/results': 6,
};

const NEXT_LABELS: Record<number, string> = {
  1: 'Next: R-L Selection →',
  2: 'Next: CVU Verification →',
  3: 'Next: Calibration →',
  4: 'Next: MCB Testing →',
  5: 'Next: View Results →',
  6: 'Finish & Browse History →',
};

const BACK_LABELS: Record<number, string> = {
  2: 'Back to Configuration',
  3: 'Back to R-L Selection',
  4: 'Back to CVU Verification',
  5: 'Back to Calibration',
  6: 'Back to MCB Testing',
};

export const TestWizardPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const currentStep = PATH_TO_STEP[location.pathname] || 1;
  const [completedSteps, setCompletedSteps] = useState<number[]>(() => {
    const step = PATH_TO_STEP[location.pathname] || 1;
    const prevs: number[] = [];
    for (let i = 1; i < step; i++) prevs.push(i);
    return prevs;
  });
  const [isCurrentStepValid, setIsCurrentStepValid] = useState<boolean>(true);

  const { resetToNewTest, isExecuting, cvuVerification, calibration, activeResult } = useTestStore();
  const toast = useToastStore();

  const goToStep = (stepId: number) => {
    // Safety check gates
    if (stepId >= 4 && cvuVerification.status !== 'VERIFIED') {
      toast.warning('CVU Verification Required', 'Complete Step 3 CVU verification before calibration or testing.');
      return;
    }
    if (stepId >= 5 && calibration.status !== 'PASSED') {
      toast.warning('Calibration Required', 'Complete Step 4 metrology calibration before MCB testing.');
      return;
    }
    if (stepId === 6 && !activeResult) {
      toast.warning('Test Shot Required', 'Execute a live MCB test shot before viewing results.');
      return;
    }

    const targetPath = STEP_PATHS[stepId] || '/new-test';
    navigate(targetPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNext = () => {
    if (!isCurrentStepValid) {
      toast.warning('Step Incomplete', 'Please satisfy all requirements on this step before proceeding.');
      return;
    }

    if (currentStep === 3 && cvuVerification.status !== 'VERIFIED') {
      toast.warning('CVU Verification Incomplete', 'Verify CVU analog channels before advancing to calibration.');
      return;
    }

    if (currentStep === 4 && calibration.status !== 'PASSED') {
      toast.warning('Calibration Incomplete', 'Run test circuit calibration before advancing to live MCB testing.');
      return;
    }

    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps((prev) => [...prev, currentStep]);
    }

    if (currentStep < 6) {
      goToStep(currentStep + 1);
    } else {
      navigate('/test-history');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  };

  const handleReset = () => {
    resetToNewTest();
    setCompletedSteps([]);
    goToStep(1);
    toast.info('Workflow Reset', 'All parameters restored for a new test specimen.');
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* 6-Step Wizard Navigation Header (matches Figma) */}
      <StepWizardNav
        currentStep={currentStep}
        completedSteps={completedSteps}
        onSelectStep={(stepId) => goToStep(stepId)}
      />

      {/* Step Content */}
      <div className="min-h-[460px]">
        {currentStep === 1 && <TestConfigStep onValidChange={setIsCurrentStepValid} />}
        {currentStep === 2 && <RLConfigStep onValidChange={setIsCurrentStepValid} />}
        {currentStep === 3 && <CVUVerificationStep onValidChange={setIsCurrentStepValid} />}
        {currentStep === 4 && <CalibrationStep onValidChange={setIsCurrentStepValid} />}
        {currentStep === 5 && <MCBTestingStep />}
        {currentStep === 6 && <TestResultsPage />}
      </div>

      {/* Wizard Footer Navigation Controls (matches Figma Footer) */}
      <div className="bg-white border border-slate-200 rounded-md p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div>
          {currentStep === 1 ? (
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
              disabled={isExecuting}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Reset Defaults
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={handleBack}
              disabled={isExecuting}
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              {BACK_LABELS[currentStep] || 'Previous Step'}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
            PHASE {currentStep} OF 6 • IEC 60898-1:2015 SEQUENCE
          </span>

          <Button
            size="sm"
            variant="primary"
            onClick={handleNext}
            disabled={!isCurrentStepValid || isExecuting}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            {NEXT_LABELS[currentStep] || 'Next Step →'}
          </Button>
        </div>
      </div>
    </div>
  );
};
