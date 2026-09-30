import React from 'react';
import { CVUVerificationStep } from '../NewTest/steps/CVUVerificationStep';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { PlaySquare } from 'lucide-react';

export const CVUVerificationPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4 w-full min-w-0">
      {/* Clean Header Hierarchy: Eyebrow + Main Title + Supporting Description + Contextual Badge + Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono text-teal-700 font-bold uppercase tracking-wider">
              PRE-TEST DIAGNOSTIC STAGE • PROTOCOL IEC-60898-1 CL.9.12
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-600 font-semibold">
              CVU ESP32 Diagnostic Verification
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            CVU Verification (Pre-Test Connection Check)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Microcontroller-based multi-point physical terminal connection, impedance integrity, and galvanic continuity diagnostics.
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

      <CVUVerificationStep hideHeader />
    </div>
  );
};
