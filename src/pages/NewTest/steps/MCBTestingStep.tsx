import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTestStore } from '../../../store/testStore';
import { useSystemStore } from '../../../store/systemStore';
import { useToastStore } from '../../../store/toastStore';
import { Button } from '../../../components/common/Button';
import { SafetyInterlockChecklist } from '../../../components/testing/SafetyInterlockChecklist';
import { LiveWaveformChart } from '../../../components/charts/LiveWaveformChart';
import {
  Play,
  AlertOctagon,
  Shield,
  Activity,
  CheckCircle2,
  XCircle,
  Cpu,
  FileText,
  Save,
  Zap,
  Lock,
  Unlock,
  Radio,
  Sliders,
} from 'lucide-react';
import { formatCurrent, formatVoltage, formatJouleIntegral, formatTimeMs } from '../../../utils/formatters';
import { clsx } from 'clsx';

export const MCBTestingStep: React.FC = () => {
  const navigate = useNavigate();
  const {
    mcb,
    configuration,
    activeStage,
    stageProgressPct,
    stageStatusMessage,
    isExecuting,
    activeWaveform,
    activeResult,
    armTest,
    startLiveTest,
    abortActiveTest,
    saveActiveTestToHistory,
    savedRecordId,
  } = useTestStore();

  const { hardwareStatus, triggerEmergencyStop } = useSystemStore();
  const toast = useToastStore();

  const [allPrerequisitesMet, setAllPrerequisitesMet] = useState(false);
  const [isArming, setIsArming] = useState(false);

  const handleArmSequence = async () => {
    setIsArming(true);
    toast.info('Arming Test Bench', 'Energizing primary contactors & charging pulse bank...');
    const ok = await armTest();
    setIsArming(false);
    if (ok) {
      toast.warning('SYSTEM ARMED', 'High-current source ready. Ensure all personnel remain clear of the enclosure.');
    } else {
      toast.error('Arming Failed', 'Verify safety interlocks.');
    }
  };

  const handleStartTest = async () => {
    try {
      toast.warning('HIGH CURRENT PULSE TRIGGERED', `Executing ${configuration.prospectiveCurrentA} A test shot...`);
      const wf = await startLiveTest();
      toast.success('Test Interruption Completed', `Peak Ip = ${formatCurrent(wf.peakCurrentA)} captured.`);
    } catch (err: any) {
      toast.error('Test Aborted', err.message || 'Execution failed.');
    }
  };

  const handleEmergencyStop = () => {
    abortActiveTest();
    triggerEmergencyStop();
    toast.error('EMERGENCY STOP ENGAGED', 'Capacitor bank grounded. Contactor open.');
  };

  const handleSave = () => {
    const record = saveActiveTestToHistory();
    toast.success('Test Record Saved', `Saved as ${record.id} in test database.`);
  };

  const isTestCompleted = activeStage === 'COMPLETED' && activeResult !== null;
  const isArmed = activeStage === 'CLAMP_ARMED';

  return (
    <div className="space-y-4">
      {/* Top Header & Console Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <div className="text-[10px] font-mono text-teal-700 font-bold uppercase tracking-wider">
            STAGE 05 • SHORT-CIRCUIT TEST CONTROL CONSOLE
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Live MCB Short-Circuit Testing
          </h2>
          <p className="text-xs text-slate-500">
            Specimen: <strong className="text-slate-800">{mcb.manufacturer} {mcb.modelNumber}</strong> ({mcb.poles} Curve {mcb.trippingCurve}{mcb.ratedCurrentA}) • Target: {formatCurrent(configuration.prospectiveCurrentA)} at {configuration.systemVoltageV}V (cos φ {configuration.targetPowerFactor}).
          </p>
        </div>

        {/* Emergency Stop Button Always Accessible */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="danger"
            onClick={handleEmergencyStop}
            leftIcon={<AlertOctagon className="w-4 h-4" />}
          >
            EMERGENCY STOP
          </Button>
        </div>
      </div>

      {/* Test Control Console Action Card */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-2xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Status info */}
          <div className="md:col-span-7 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500 uppercase">SYSTEM STATE:</span>
              {isTestCompleted ? (
                <span className="px-2 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded font-mono text-xs font-bold">
                  TEST SHOT COMPLETED
                </span>
              ) : isArmed ? (
                <span className="px-2 py-0.5 bg-amber-100 border border-amber-300 text-amber-900 rounded font-mono text-xs font-bold animate-pulse">
                  SYSTEM ARMED • READY TO FIRE
                </span>
              ) : isExecuting ? (
                <span className="px-2 py-0.5 bg-red-100 border border-red-300 text-red-800 rounded font-mono text-xs font-bold animate-pulse">
                  DISCHARGING FAULT CURRENT
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-slate-100 border border-slate-300 text-slate-700 rounded font-mono text-xs font-bold">
                  DISARMED • PRE-CHECK
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600">
              {!allPrerequisitesMet && !isTestCompleted
                ? 'Complete all safety interlock prerequisites below to enable high-current arming.'
                : !isArmed && !isTestCompleted
                ? 'All 5 safety interlocks secured. System is ready to arm and energize primary source.'
                : isArmed
                ? 'Source transformer energized. Ensure observation area is clear, then trigger the synchronous point-on-wave shot.'
                : 'Shot finished. Verify measured peak cut-off Ip and Joule integral let-through.'}
            </p>
          </div>

          {/* Action Trigger Controls */}
          <div className="md:col-span-5 flex items-center justify-end gap-2.5">
            {!isArmed && !isTestCompleted && (
              <button
                type="button"
                onClick={handleArmSequence}
                disabled={!allPrerequisitesMet || isExecuting}
                className={clsx(
                  'px-4 py-2.5 rounded font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-xs',
                  allPrerequisitesMet && !isExecuting
                    ? 'bg-amber-600 hover:bg-amber-700 text-white ring-2 ring-amber-300'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                )}
              >
                <Shield className="w-4 h-4" />
                <span>{isArming ? 'ARMING...' : 'ARM SYSTEM'}</span>
              </button>
            )}

            {isArmed && (
              <button
                type="button"
                onClick={handleStartTest}
                disabled={isExecuting}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-mono font-bold text-xs uppercase tracking-wider rounded transition-all shadow-md active:scale-98 flex items-center gap-2 cursor-pointer ring-2 ring-red-400 animate-pulse"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>TRIGGER SHOT SEQUENCE</span>
              </button>
            )}

            {isTestCompleted && (
              <div className="flex items-center gap-2">
                {!savedRecordId ? (
                  <Button size="sm" variant="success" onClick={handleSave} leftIcon={<Save className="w-3.5 h-3.5" />}>
                    Save Test
                  </Button>
                ) : (
                  <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 font-bold">
                    Saved: {savedRecordId}
                  </span>
                )}
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => navigate('/new-test/results')}
                  leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                >
                  View Criteria Results
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Safety Interlock Prerequisites Checklist */}
      {!isTestCompleted && (
        <SafetyInterlockChecklist onAllPassed={setAllPrerequisitesMet} />
      )}

      {/* High-Speed Oscilloscope Display */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div>
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-teal-600" />
              High-Speed Digital Storage Oscilloscope (DSO)
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              100 kS/s ROGOWSKI CURRENT TRANSDUCER & HIGH-VOLTAGE DIFFERENTIAL PROBE
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
            <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded">
              TIMEBASE: 2 ms / div
            </span>
            <span className="px-2 py-0.5 bg-teal-50 border border-teal-200 text-teal-800 rounded font-bold">
              TRIGGER: POW 45°
            </span>
          </div>
        </div>

        {/* Live / Captured Oscilloscope Chart */}
        <LiveWaveformChart
          waveform={activeWaveform}
          isStreaming={isExecuting}
          height={380}
        />

        {/* Captured Measurement Readouts Strip (when completed) */}
        {activeWaveform && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-slate-200 text-xs font-mono">
            <div className="p-2 bg-slate-50 border border-slate-200 rounded">
              <span className="text-[10px] text-slate-500 uppercase block">PEAK CURRENT (IP)</span>
              <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                {formatCurrent(activeWaveform.peakCurrentA)}
              </span>
            </div>

            <div className="p-2 bg-slate-50 border border-slate-200 rounded">
              <span className="text-[10px] text-slate-500 uppercase block">JOULE INTEGRAL (I²T)</span>
              <span className="text-sm font-bold text-teal-700 mt-0.5 block">
                {formatJouleIntegral(activeWaveform.jouleIntegralA2s)}
              </span>
            </div>

            <div className="p-2 bg-slate-50 border border-slate-200 rounded">
              <span className="text-[10px] text-slate-500 uppercase block">INTERRUPTION TIME</span>
              <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                {formatTimeMs(activeWaveform.totalInterruptionTimeMs)}
              </span>
            </div>

            <div className="p-2 bg-slate-50 border border-slate-200 rounded">
              <span className="text-[10px] text-slate-500 uppercase block">ARC DURATION</span>
              <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                {formatTimeMs(activeWaveform.arcDurationMs)}
              </span>
            </div>

            <div className="p-2 bg-slate-50 border border-slate-200 rounded">
              <span className="text-[10px] text-slate-500 uppercase block">RECOVERY VOLTAGE</span>
              <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                {formatVoltage(activeWaveform.recoveryVoltageV)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
