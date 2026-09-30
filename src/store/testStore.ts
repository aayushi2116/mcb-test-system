import { create } from 'zustand';
import { MCBSpecification, TestConfiguration, TestExecutionStage, TestResult, TestRecord } from '../types/test';
import { RLConfiguration, CVUVerification, CalibrationResult } from '../types/hardware';
import { WaveformCapture } from '../types/waveform';
import { autoSelectOptimalRLBanks } from '../utils/electricalCalculations';
import { evaluateTestResult } from '../utils/resultEvaluator';
import { hardwareService } from '../services/hardware/hardwareService';
import { storageService } from '../services/storage/storageService';
import { useAuthStore } from './authStore';

interface TestState {
  // Active test parameters
  mcb: MCBSpecification;
  configuration: TestConfiguration;
  rlConfig: RLConfiguration;
  cvuVerification: CVUVerification;
  calibration: CalibrationResult;

  // Active execution state
  activeStage: TestExecutionStage;
  stageProgressPct: number;
  stageStatusMessage: string;
  isExecuting: boolean;

  // Captured output
  activeWaveform: WaveformCapture | null;
  activeResult: TestResult | null;
  savedRecordId: string | null;

  // Actions
  setMCB: (updates: Partial<MCBSpecification>) => void;
  setConfiguration: (updates: Partial<TestConfiguration>) => void;
  setRLConfig: (rl: RLConfiguration) => void;
  runAutoRLConfig: () => void;
  runCVUVerification: () => Promise<boolean>;
  runCalibration: () => Promise<boolean>;
  armTest: () => Promise<boolean>;
  startLiveTest: () => Promise<WaveformCapture>;
  abortActiveTest: () => void;
  setActiveWaveform: (waveform: WaveformCapture | null) => void;
  saveActiveTestToHistory: (notes?: string) => TestRecord;
  loadHistoricalTest: (test: TestRecord) => void;
  resetToNewTest: () => void;
}

const defaultMCB: MCBSpecification = {
  manufacturer: 'Schneider Electric',
  modelNumber: 'Acti9 iC60N',
  serialNumber: `SE-${Math.floor(100000 + Math.random() * 900000)}`,
  poles: 'SP',
  ratedCurrentA: 16,
  ratedVoltageV: 240,
  trippingCurve: 'C',
  instantaneousTrippingRange: '5 In – 10 In',
  ratedBreakingCapacityA: 6000,
  standardsComplied: 'IEC 60898-1:2015',
  productionBatch: 'B26-09-FR-04',
};

const defaultConfig: TestConfiguration = {
  testType: 'Icn',
  prospectiveCurrentA: 6000,
  targetPowerFactor: 0.48,
  systemVoltageV: 240,
  systemFrequencyHz: 50,
  shotCycle: 'O - t - CO',
  openCloseIntervalSec: 180,
  breakArcInceptionAngleDeg: 45,
  arcChamberPressureMonitoring: true,
  ambientTemperatureC: 24.2,
  relativeHumidityPct: 46,
};

const initialRL = autoSelectOptimalRLBanks(
  defaultConfig.systemVoltageV,
  defaultConfig.prospectiveCurrentA,
  defaultConfig.targetPowerFactor,
  defaultConfig.systemFrequencyHz,
  defaultConfig.breakArcInceptionAngleDeg
);

export const useTestStore = create<TestState>((set, get) => ({
  mcb: defaultMCB,
  configuration: defaultConfig,
  rlConfig: initialRL,
  cvuVerification: hardwareService.getCVUStatus(),
  calibration: hardwareService.getCalibrationStatus(),

  activeStage: 'PENDING',
  stageProgressPct: 0,
  stageStatusMessage: 'System ready for test initialization.',
  isExecuting: false,

  activeWaveform: null,
  activeResult: null,
  savedRecordId: null,

  setMCB: (updates) => {
    const updatedMCB = { ...get().mcb, ...updates };
    set({ mcb: updatedMCB });
  },

  setConfiguration: (updates) => {
    const updatedConfig = { ...get().configuration, ...updates };
    // Recalculate R-L banks automatically when current, voltage, or power factor changes
    const updatedRL = autoSelectOptimalRLBanks(
      updatedConfig.systemVoltageV,
      updatedConfig.prospectiveCurrentA,
      updatedConfig.targetPowerFactor,
      updatedConfig.systemFrequencyHz,
      updatedConfig.breakArcInceptionAngleDeg
    );
    set({ configuration: updatedConfig, rlConfig: updatedRL });
  },

  setRLConfig: (rl) => {
    set({ rlConfig: rl });
    hardwareService.configureRL(rl);
  },

  runAutoRLConfig: () => {
    const { configuration } = get();
    const optimal = autoSelectOptimalRLBanks(
      configuration.systemVoltageV,
      configuration.prospectiveCurrentA,
      configuration.targetPowerFactor,
      configuration.systemFrequencyHz,
      configuration.breakArcInceptionAngleDeg
    );
    hardwareService.configureRL(optimal);
    set({ rlConfig: optimal });
  },

  runCVUVerification: async () => {
    set({ isExecuting: true, stageStatusMessage: 'Initializing CVU Channel Scan...' });
    try {
      const res = await hardwareService.verifyCVU((pct, msg) => {
        set({ stageProgressPct: pct, stageStatusMessage: msg });
      });
      set({ cvuVerification: res, isExecuting: false });
      return res.status === 'VERIFIED';
    } catch (err: any) {
      set({ isExecuting: false, stageStatusMessage: err.message || 'CVU scan error' });
      return false;
    }
  },

  runCalibration: async () => {
    set({ isExecuting: true, stageStatusMessage: 'Starting circuit calibration sequence...' });
    const { configuration } = get();
    try {
      const res = await hardwareService.startCalibration(
        configuration.prospectiveCurrentA,
        configuration.targetPowerFactor,
        (cal) => {
          set({
            calibration: cal,
            stageProgressPct: cal.progressPct,
            stageStatusMessage: `Calibration: ${cal.status.replace(/_/g, ' ')} (${cal.progressPct}%)`,
          });
        }
      );
      set({ calibration: res, isExecuting: false });
      return res.status === 'PASSED';
    } catch (err: any) {
      set({ isExecuting: false, stageStatusMessage: err.message || 'Calibration aborted' });
      return false;
    }
  },

  armTest: async () => {
    const { mcb, configuration } = get();
    try {
      await hardwareService.armTestSequence(mcb, configuration);
      set({ activeStage: 'CLAMP_ARMED', stageStatusMessage: 'System armed and ready for trigger.' });
      return true;
    } catch (err: any) {
      set({ stageStatusMessage: err.message || 'Failed to arm test.' });
      return false;
    }
  },

  startLiveTest: async () => {
    const { mcb, configuration } = get();
    set({ isExecuting: true, activeStage: 'PRE_CHECK', stageProgressPct: 0 });

    try {
      const waveform = await hardwareService.startTest(
        mcb,
        configuration,
        (stage, pct, msg) => {
          set({
            activeStage: stage,
            stageProgressPct: pct,
            stageStatusMessage: msg,
          });
        }
      );

      const result = evaluateTestResult(mcb, configuration, waveform, false);
      set({
        activeWaveform: waveform,
        activeResult: result,
        activeStage: 'COMPLETED',
        isExecuting: false,
        stageProgressPct: 100,
        stageStatusMessage: `Test sequence completed. Verdict: ${result.overallResult}`,
      });

      return waveform;
    } catch (err: any) {
      set({
        isExecuting: false,
        activeStage: 'ABORTED',
        stageStatusMessage: err.message || 'Test sequence failed or aborted.',
      });
      throw err;
    }
  },

  abortActiveTest: () => {
    hardwareService.abortTest();
    set({
      isExecuting: false,
      activeStage: 'ABORTED',
      stageStatusMessage: 'Test aborted by operator.',
    });
  },

  setActiveWaveform: (waveform: WaveformCapture | null) => {
    set({ activeWaveform: waveform });
  },

  saveActiveTestToHistory: (notes = '') => {
    const { mcb, configuration, rlConfig, cvuVerification, calibration, activeWaveform, activeResult } = get();
    const operator = useAuthStore.getState().currentOperator || {
      id: 'OP-DEFAULT',
      name: 'Default Operator',
      badgeNumber: 'STN4-DEFAULT',
      role: 'OPERATOR',
      labStation: 'Station 4',
    };

    const newRecord: TestRecord = {
      id: `TEST-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      operator,
      mcb,
      configuration,
      rlConfig,
      cvuVerification,
      calibration,
      waveform: activeWaveform || undefined,
      result: activeResult || undefined,
      status: activeResult?.overallResult === 'PASS' ? 'COMPLETED' : 'FAILED',
      notes: notes || 'Automated short-circuit test record saved.',
    };

    storageService.saveTest(newRecord);
    set({ savedRecordId: newRecord.id });
    return newRecord;
  },

  loadHistoricalTest: (record: TestRecord) => {
    set({
      mcb: record.mcb,
      configuration: record.configuration,
      rlConfig: record.rlConfig,
      cvuVerification: record.cvuVerification,
      calibration: record.calibration,
      activeWaveform: record.waveform || null,
      activeResult: record.result || null,
      activeStage: 'COMPLETED',
      savedRecordId: record.id,
      stageStatusMessage: `Loaded historical test ${record.id}`,
    });
  },

  resetToNewTest: () => {
    const newSerial = `SE-${Math.floor(100000 + Math.random() * 900000)}`;
    const freshMCB = { ...defaultMCB, serialNumber: newSerial };
    const freshRL = autoSelectOptimalRLBanks(
      defaultConfig.systemVoltageV,
      defaultConfig.prospectiveCurrentA,
      defaultConfig.targetPowerFactor
    );
    set({
      mcb: freshMCB,
      configuration: defaultConfig,
      rlConfig: freshRL,
      activeStage: 'PENDING',
      stageProgressPct: 0,
      stageStatusMessage: 'Ready for new test configuration.',
      activeWaveform: null,
      activeResult: null,
      savedRecordId: null,
      isExecuting: false,
    });
  },
}));
