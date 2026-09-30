import React from 'react';
import { RLConfigStep } from '../NewTest/steps/RLConfigStep';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { PlaySquare } from 'lucide-react';

export const RLConfigPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Switched R-L Matrix Configuration
          </h1>
          <p className="text-xs text-slate-500">
            Dedicated laboratory interface for switched resistor and inductor bank actuation.
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

      <RLConfigStep />
    </div>
  );
};
