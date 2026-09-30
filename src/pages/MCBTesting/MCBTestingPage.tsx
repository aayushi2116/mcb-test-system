import React from 'react';
import { MCBTestingStep } from '../NewTest/steps/MCBTestingStep';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { PlaySquare } from 'lucide-react';

export const MCBTestingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Live MCB Short-Circuit Testing
          </h1>
          <p className="text-xs text-slate-500">
            Dedicated high-energy execution cell interface with oscilloscope telemetry.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/new-test')}
          leftIcon={<PlaySquare className="w-4 h-4" />}
        >
          Open in New Test Wizard
        </Button>
      </div>

      <MCBTestingStep />
    </div>
  );
};
