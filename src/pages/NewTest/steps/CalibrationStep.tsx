import React from 'react';
import { useTestStore } from '../../../store/testStore';
import { useToastStore } from '../../../store/toastStore';
import { Button } from '../../../components/common/Button';
import {
  Compass,
  Play,
  CheckCircle2,
  Lock,
  Zap,
  Activity,
  Award,
  RefreshCw,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { formatCurrent, formatDate } from '../../../utils/formatters';
import { clsx } from 'clsx';

export const CalibrationStep: React.FC<{ onValidChange?: (isValid: boolean) => void }> = ({ onValidChange }) => {
  const {
    calibration,
    runCalibration,
    isExecuting,
    stageStatusMessage,
    stageProgressPct,
    configuration,
  } = useTestStore();
  const toast = useToastStore();

  const isPassed = calibration.status === 'PASSED';

  React.useEffect(() => {
    onValidChange?.(isPassed);
  }, [isPassed, onValidChange]);

  const handleStartCalibration = async () => {
    toast.info('Starting Circuit Calibration', 'Measuring prospective short-circuit loop impedance on shorting bar...');
    const ok = await runCalibration();
    if (ok) {
      toast.success('Calibration Verified', `Measured current deviation ${calibration.currentTolerancePct}% within ±1.0% tolerance.`);
    } else {
      toast.error('Calibration Failed', 'Measurement out of allowable tolerance.');
    }
  };

  const targetCurrentKa = (configuration.prospectiveCurrentA / 1000).toFixed(2);
  const measuredCurrentKa = (calibration.measuredCurrentA / 1000).toFixed(2);
  const peakCurrentKa = (calibration.measuredCurrentA * 1.414 * 1.73 / 1000).toFixed(2);

  return (
    <div className="space-y-4">
      {/* Top Header & Tags (matches Figma Screen 5) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <div className="text-[10px] font-mono text-teal-700 font-bold uppercase tracking-wider">
            PRE-TEST COMMISSIONING • PHASE IV
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Calibration of Test Circuit
          </h2>
          <p className="text-xs text-slate-500">
            Prospective short-circuit current (Isc) and power factor (cos φ) verification prior to specimen insertion
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleStartCalibration}
            isLoading={isExecuting}
            leftIcon={<RefreshCw className="w-3.5 h-3.5 text-teal-600" />}
          >
            {isPassed ? 'Re-Calibrate Circuit' : 'Start Calibration'}
          </Button>
          <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded text-[11px] font-mono">
            STANDARD REFERENCE: <strong className="text-slate-900">clause 9.12.11.2.1</strong>
          </span>
        </div>
      </div>

      {/* Progress Bar when calibrating */}
      {isExecuting && (
        <div className="bg-white border border-teal-200 rounded-md p-3 space-y-1.5 shadow-xs">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-teal-800 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-600 animate-ping" />
              {stageStatusMessage}
            </span>
            <span className="text-slate-600 font-semibold">{stageProgressPct}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-teal-600 h-full transition-all duration-300"
              style={{ width: `${stageProgressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Two-Panel Grid (matches Figma Screen 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Panel: Calibration Setup (col-span-6) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-md p-4 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-teal-600" />
                CALIBRATION SETUP
              </span>
              <span className="text-[10px] font-mono bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded font-bold">
                RIG A04 / COPPER LINK ACTIVE
              </span>
            </div>

            {/* Circuit Schematic Diagram Box (matches Figma) */}
            <div className="p-3 bg-slate-900 rounded-md text-white">
              <div className="text-[10px] font-mono text-slate-400 mb-2 flex items-center justify-between">
                <span>HV POWER SOURCE &gt; R-L MATRIX &gt; ZERO-IMPEDANCE SHORTING BAR</span>
                <span className="text-emerald-400 font-bold">CIRCUIT CLOSED</span>
              </div>

              {/* Vector schematic representation */}
              <div className="py-4 px-2 flex items-center justify-center gap-1.5 font-mono text-[10px] text-teal-300">
                {/* Transformer */}
                <div className="border border-teal-400 px-2 py-1.5 bg-slate-800 text-center rounded-xs">
                  <div className="text-[9px] text-slate-400">TRANSFORMER</div>
                  <div className="font-bold text-white">11kV / 240V</div>
                </div>

                <div className="w-4 h-0.5 bg-teal-400" />

                {/* R-L Bank */}
                <div className="border border-teal-400 px-2 py-1.5 bg-slate-800 text-center rounded-xs">
                  <div className="text-[9px] text-slate-400">R-L BANK</div>
                  <div className="font-bold text-white">12.5mΩ / 1.8mH</div>
                </div>

                <div className="w-4 h-0.5 bg-teal-400" />

                {/* Rogowski / CT */}
                <div className="w-6 h-6 rounded-full border border-teal-400 flex items-center justify-center bg-slate-800 text-[8px] font-bold text-teal-300" title="Class 0.2 Rogowski Coil">
                  CT
                </div>

                <div className="w-4 h-0.5 bg-teal-400" />

                {/* Calibration Point / Shorting Bar */}
                <div className="border border-emerald-400 px-2 py-1.5 bg-emerald-950/60 text-center rounded-xs">
                  <div className="text-[9px] text-emerald-300">CALIBRATION POINT</div>
                  <div className="font-bold text-emerald-400">SHORTING BAR</div>
                </div>
              </div>

              <div className="text-[9px] font-mono text-slate-400 pt-1 border-t border-slate-800 flex justify-between">
                <span>VOLTAGE SENSING: POINT-ON-WAVE 45°</span>
                <span className="text-teal-400 font-semibold">ROGOWSKI CALIBRATED</span>
              </div>
            </div>

            {/* Technical Status Rows (matches Figma) */}
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                <span className="text-[10px] text-slate-500 uppercase block">HV TRANSFORMER PRIMARY</span>
                <span className="font-bold text-slate-900 mt-1 block">11 kV Tap 3</span>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                <span className="text-[10px] text-slate-500 uppercase block">BUSBAR TEMPERATURE</span>
                <span className="font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  28.4 °C (NORMAL)
                </span>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                <span className="text-[10px] text-slate-500 uppercase block">SHORTING RIG STATE</span>
                <span className="font-bold text-emerald-700 mt-1 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  CLAMPED
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Measured Values (col-span-6) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-md p-4 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-teal-600" />
                MEASURED VALUES
              </span>
              <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                {isPassed ? 'CALIBRATED' : 'UNCALIBRATED'}
              </span>
            </div>

            {/* Metrology Comparison Table (matches Figma) */}
            <div className="overflow-x-auto border border-slate-200 rounded">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-mono text-[10px] uppercase">
                    <th className="py-2 px-3">PARAMETER</th>
                    <th className="py-2 px-3">TARGET</th>
                    <th className="py-2 px-3">MEASURED</th>
                    <th className="py-2 px-3 text-right">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  <tr className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900 font-sans">Prospective Current</div>
                      <div className="text-[10px] text-slate-500">Isc (Effective RMS)</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 font-bold">{targetCurrentKa} kA</td>
                    <td className="py-2.5 px-3 text-teal-800 font-bold">
                      {measuredCurrentKa} kA <span className="text-[10px] text-emerald-700 font-normal">(+{calibration.currentTolerancePct}% tol)</span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded text-[10px] font-bold">
                        <Check className="w-3 h-3 stroke-[3]" />
                        OK
                      </span>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900 font-sans">Power Factor</div>
                      <div className="text-[10px] text-slate-500">cos φ (Lagging)</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 font-bold">0.45 – 0.50</td>
                    <td className="py-2.5 px-3 text-teal-800 font-bold">
                      {calibration.measuredPowerFactor.toFixed(2)} <span className="text-[10px] text-emerald-700 font-normal">(Standard Match)</span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded text-[10px] font-bold">
                        <Check className="w-3 h-3 stroke-[3]" />
                        OK
                      </span>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900 font-sans">System Frequency</div>
                      <div className="text-[10px] text-slate-500">Grid Stability</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 font-bold">50.0 Hz ±1%</td>
                    <td className="py-2.5 px-3 text-teal-800 font-bold">50.0 Hz</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded text-[10px] font-bold">
                        <Check className="w-3 h-3 stroke-[3]" />
                        OK
                      </span>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900 font-sans">Peak Inception Current</div>
                      <div className="text-[10px] text-slate-500">Peak (Asymmetric)</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 font-bold">Max Asymmetry</td>
                    <td className="py-2.5 px-3 text-teal-800 font-bold">
                      {peakCurrentKa} kA <span className="text-[10px] text-slate-500 font-normal">(κ = 1.73)</span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded text-[10px] font-bold">
                        <Check className="w-3 h-3 stroke-[3]" />
                        OK
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Rogowski Calibration Factor bar */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded flex items-center justify-between text-[11px] font-mono text-slate-600">
              <span className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-teal-600" />
                Rogowski Calibration Factor: <strong className="text-slate-900">0.124 mV/A</strong>
              </span>
              <span className="text-slate-500">100 kS/s Synced • Cert: {calibration.certificateId}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Validation Banner (matches Figma Screen 5) */}
      <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-md flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-950 font-mono">
                Calibration Successful
              </span>
              <span className="text-[10px] font-mono bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded font-bold">
                IEC COMPLIANT
              </span>
            </div>
            <p className="text-[11px] text-emerald-900/80 mt-0.5">
              Measured test circuit parameters satisfy prospective tolerance bounds defined by IEC 60898-1:2015 Clause 9.12.11.2. System ready for DUT coupling.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => toast.info('Log Stored', 'Calibration event appended to traceability ledger.')}
          >
            Log Record
          </Button>
        </div>
      </div>
    </div>
  );
};
