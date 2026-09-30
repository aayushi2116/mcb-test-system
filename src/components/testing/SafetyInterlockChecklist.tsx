import React from 'react';
import { useSystemStore } from '../../store/systemStore';
import { useTestStore } from '../../store/testStore';
import { CheckCircle2, XCircle, AlertCircle, ShieldAlert } from 'lucide-react';
import { Button } from '../common/Button';

interface SafetyChecklistProps {
  onAllPassed?: (passed: boolean) => void;
}

export const SafetyInterlockChecklist: React.FC<SafetyChecklistProps> = ({ onAllPassed }) => {
  const { hardwareStatus, setInterlockDoor, setPneumaticClamp } = useSystemStore();
  const { rlConfig, cvuVerification, calibration } = useTestStore();

  const checks = [
    {
      id: 'rl',
      name: 'R-L Matrix Switched Configuration',
      desc: `Bank impedance: ${rlConfig.actualResistanceOhms} Ω, ${rlConfig.actualInductanceMh} mH`,
      passed: rlConfig.isConfigured && rlConfig.compatibilityStatus !== 'UNSUPPORTED',
      remedyText: 'Configure R-L',
    },
    {
      id: 'cvu',
      name: 'ESP32 CVU Channel Diagnostic Verification',
      desc: cvuVerification.status === 'VERIFIED' ? 'All 6 channels within tolerance' : 'Pending verification',
      passed: cvuVerification.status === 'VERIFIED',
      remedyText: 'Scan CVU',
    },
    {
      id: 'cal',
      name: 'Metrology Circuit Calibration',
      desc: calibration.status === 'PASSED' ? `Current error: ${calibration.currentTolerancePct}% (Cert: ${calibration.certificateId})` : 'Pending calibration',
      passed: calibration.status === 'PASSED',
      remedyText: 'Calibrate',
    },
    {
      id: 'clamp',
      name: 'Pneumatic MCB Specimen Clamp (6.0 bar)',
      desc: hardwareStatus.clampEngaged ? 'Jaws pressurized & locked securely' : 'Clamp jaws released',
      passed: hardwareStatus.clampEngaged,
      remedy: () => setPneumaticClamp(true),
      remedyText: 'Clamp MCB',
    },
    {
      id: 'door',
      name: 'Enclosure Safety Door & Arc Deflector Shield',
      desc: hardwareStatus.interlockClosed ? 'Enclosure interlocks closed & electromagnetic bolt engaged' : 'Safety shield open!',
      passed: hardwareStatus.interlockClosed,
      remedy: () => setInterlockDoor(true),
      remedyText: 'Close Door',
    },
    {
      id: 'estop',
      name: 'Emergency Stop Circuit Ready',
      desc: !hardwareStatus.emergencyStopActive ? 'Safety circuit continuous, high-current transformer unblocked' : 'E-Stop is depressed!',
      passed: !hardwareStatus.emergencyStopActive,
    },
  ];

  const allPassed = checks.every((c) => c.passed);

  React.useEffect(() => {
    onAllPassed?.(allPassed);
  }, [allPassed, onAllPassed]);

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-teal-600" />
          <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
            High-Current Test Safety Prerequisites (IEC 60898-1)
          </h4>
        </div>
        <span
          className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
            allPassed
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}
        >
          {allPassed ? 'ALL PREREQUISITES VERIFIED' : 'ACTION REQUIRED'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {checks.map((check) => (
          <div
            key={check.id}
            className={`p-2.5 rounded-md border flex items-start justify-between gap-3 text-xs ${
              check.passed ? 'bg-slate-50/70 border-slate-200' : 'bg-red-50/40 border-red-200'
            }`}
          >
            <div className="flex items-start gap-2 min-w-0">
              {check.passed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              )}
              <div className="min-w-0">
                <span className="font-semibold text-slate-800 block truncate">{check.name}</span>
                <span className="text-slate-500 text-[11px] block mt-0.5 font-mono">{check.desc}</span>
              </div>
            </div>

            {!check.passed && check.remedy && (
              <Button size="sm" variant="outline" onClick={check.remedy}>
                {check.remedyText}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
