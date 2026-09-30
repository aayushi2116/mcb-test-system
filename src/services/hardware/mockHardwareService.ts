import { IHardwareController, TelemetryListener, StageChangeListener } from './hardwareInterface';
import {
  HardwareStatus,
  LiveTelemetry,
  CVUVerification,
  CVUChannel,
  RLConfiguration,
  CalibrationResult,
  WaveformCapture,
  MCBSpecification,
  TestConfiguration,
  TestExecutionStage,
} from '../../types';
import { generateRealisticMCBWaveform } from '../../utils/waveformGenerator';

export class MockHardwareController implements IHardwareController {
  private status: HardwareStatus = {
    plcConnected: true,
    plcLatencyMs: 4,
    daqConnected: true,
    daqSampleRateKhz: 100,
    cvuConnected: true,
    cvuPort: 'COM4 (USB-RS485-ISO)',
    interlockClosed: true,
    safetyDoorLocked: true,
    emergencyStopActive: false,
    clampEngaged: true,
    arcShieldClosed: true,
    sourceTransformerReady: true,
    sourceBusVoltageV: 241.4,
    temperatureAmbientC: 24.5,
    systemMode: 'IDLE',
    simulationMode: true,
  };

  private cvuVerification: CVUVerification = {
    status: 'IDLE',
    connected: true,
    port: 'COM4 (USB-RS485-ISO)',
    firmwareVersion: 'ESP32-CVU-v2.4.18-PROD',
    diagnosticPingMs: 6,
    galvanicIsolationVerified: true,
    channels: this.getDefaultCVUChannels(),
    verifiedAt: null,
  };

  private calibrationResult: CalibrationResult = {
    status: 'IDLE',
    targetCurrentA: 6000,
    measuredCurrentA: 5988,
    currentTolerancePct: 0.2,
    targetPowerFactor: 0.48,
    measuredPowerFactor: 0.482,
    powerFactorTolerancePct: 0.4,
    targetFrequencyHz: 50.0,
    measuredFrequencyHz: 50.02,
    shuntVoltageMv: 59.88,
    transformerTempC: 38.4,
    referenceMeterModel: 'Yokogawa WT3000E Precision Power Analyzer',
    calibratedAt: null,
    certificateId: 'CAL-REF-2026-0814',
    progressPct: 0,
  };

  private currentRLConfig: RLConfiguration | null = null;
  private lastCapturedWaveform: WaveformCapture | null = null;

  private telemetryListeners = new Set<TelemetryListener>();
  private statusListeners = new Set<(status: HardwareStatus) => void>();
  private telemetryIntervalTimer: ReturnType<typeof setInterval> | null = null;
  private activeTestAborted = false;

  constructor() {
    this.startBackgroundTelemetry();
  }

  private getDefaultCVUChannels(): CVUChannel[] {
    return [
      {
        id: 'cvu_ch1',
        name: 'Phase Input (L1 Line)',
        channelNumber: 1,
        expectedMin: 228.0,
        expectedMax: 242.0,
        measuredValue: 239.8,
        unit: 'V RMS',
        deviationPct: 0.1,
        status: 'PASS',
      },
      {
        id: 'cvu_ch2',
        name: 'Neutral Input (N Reference)',
        channelNumber: 2,
        expectedMin: 0.0,
        expectedMax: 2.5,
        measuredValue: 0.4,
        unit: 'V RMS',
        deviationPct: 0.0,
        status: 'PASS',
      },
      {
        id: 'cvu_ch3',
        name: 'MCB Terminal Input (Line Side)',
        channelNumber: 3,
        expectedMin: 228.0,
        expectedMax: 242.0,
        measuredValue: 239.6,
        unit: 'V RMS',
        deviationPct: 0.15,
        status: 'PASS',
      },
      {
        id: 'cvu_ch4',
        name: 'MCB Terminal Output (Load Side)',
        channelNumber: 4,
        expectedMin: 0.0,
        expectedMax: 2.0,
        measuredValue: 0.1,
        unit: 'V RMS',
        deviationPct: 0.05,
        status: 'PASS',
      },
      {
        id: 'cvu_ch5',
        name: 'Earth Continuity (PE Safety Bond)',
        channelNumber: 5,
        expectedMin: 0.001,
        expectedMax: 0.050,
        measuredValue: 0.012,
        unit: 'Ω',
        deviationPct: 0.4,
        status: 'PASS',
      },
      {
        id: 'cvu_ch6',
        name: 'Coaxial Shunt / Rogowski Zero Offset',
        channelNumber: 6,
        expectedMin: -0.5,
        expectedMax: 0.5,
        measuredValue: 0.03,
        unit: 'mV',
        deviationPct: 0.02,
        status: 'PASS',
      },
    ];
  }

  private startBackgroundTelemetry() {
    if (this.telemetryIntervalTimer) return;
    this.telemetryIntervalTimer = setInterval(() => {
      const isTesting = this.status.systemMode === 'TESTING';
      const isArmed = this.status.systemMode === 'ARMED';

      const jitter = (Math.random() - 0.5) * 0.4;
      const vRms = this.status.interlockClosed ? 240.0 + jitter : 0;
      const currentRms = isTesting ? 4500 + Math.random() * 500 : 0;
      const currentInstant = isTesting ? (Math.random() - 0.5) * 8000 : 0;
      const voltageInstant = (Math.random() - 0.5) * 340;

      const telemetry: LiveTelemetry = {
        timestamp: Date.now(),
        currentRmsA: Number(currentRms.toFixed(1)),
        voltageRmsV: Number(vRms.toFixed(1)),
        instantaneousCurrentA: Number(currentInstant.toFixed(1)),
        instantaneousVoltageV: Number(voltageInstant.toFixed(1)),
        powerFactor: isTesting ? 0.48 + (Math.random() - 0.5) * 0.02 : 1.0,
        frequencyHz: Number((50.0 + (Math.random() - 0.5) * 0.04).toFixed(2)),
        temperatureTransformerC: Number((32.0 + Math.sin(Date.now() / 60000) * 3).toFixed(1)),
        temperatureArcChuteC: Number((26.5 + (isTesting ? 25 : 0)).toFixed(1)),
        arcPressureBar: isTesting ? Number((1.8 + Math.random() * 0.8).toFixed(2)) : 0.01,
        pneumaticClampPressureBar: this.status.clampEngaged ? 6.2 : 0.0,
        mcbContactState: isTesting ? 'TRIPPED' : isArmed ? 'CLOSED' : 'OPEN',
        isArcing: isTesting,
        busCharged: this.status.interlockClosed && !this.status.emergencyStopActive,
      };

      this.telemetryListeners.forEach(listener => {
        try {
          listener(telemetry);
        } catch (e) {
          console.error('Error in telemetry listener:', e);
        }
      });
    }, 400);
  }

  async connect(): Promise<boolean> {
    await new Promise(r => setTimeout(r, 600));
    this.status.plcConnected = true;
    this.status.daqConnected = true;
    this.status.cvuConnected = true;
    this.startBackgroundTelemetry();
    this.notifyStatus();
    return true;
  }

  async disconnect(): Promise<void> {
    await new Promise(r => setTimeout(r, 400));
    if (this.telemetryIntervalTimer) {
      clearInterval(this.telemetryIntervalTimer);
      this.telemetryIntervalTimer = null;
    }
    this.status.plcConnected = false;
    this.status.daqConnected = false;
    this.status.cvuConnected = false;
    this.notifyStatus();
  }

  getStatus(): HardwareStatus {
    return { ...this.status };
  }

  setInterlockDoor(closed: boolean): void {
    this.status.interlockClosed = closed;
    this.status.safetyDoorLocked = closed;
    this.status.arcShieldClosed = closed;
    this.notifyStatus();
  }

  async setPneumaticClamp(engaged: boolean): Promise<boolean> {
    await new Promise(r => setTimeout(r, 500));
    this.status.clampEngaged = engaged;
    this.notifyStatus();
    return true;
  }

  emergencyStop(): void {
    this.activeTestAborted = true;
    this.status.emergencyStopActive = true;
    this.status.systemMode = 'EMERGENCY_STOP';
    this.status.sourceTransformerReady = false;
    this.notifyStatus();
  }

  resetEmergencyStop(): boolean {
    this.status.emergencyStopActive = false;
    this.status.systemMode = 'IDLE';
    this.status.sourceTransformerReady = true;
    this.notifyStatus();
    return true;
  }

  private notifyStatus() {
    this.statusListeners.forEach(l => l({ ...this.status }));
  }

  // CVU Verification simulation
  async verifyCVU(onProgress?: (progressPct: number, stepName: string) => void): Promise<CVUVerification> {
    this.cvuVerification.status = 'SCANNING';
    onProgress?.(15, 'Scanning RS485 bus on COM4...');
    await new Promise(r => setTimeout(r, 500));

    onProgress?.(35, 'Handshaking with ESP32-CVU controller (v2.4.18)...');
    await new Promise(r => setTimeout(r, 500));

    onProgress?.(60, 'Checking galvanic isolation & ADC reference voltage...');
    await new Promise(r => setTimeout(r, 600));

    onProgress?.(85, 'Acquiring 6-channel analog diagnostic readings...');
    await new Promise(r => setTimeout(r, 600));

    // Generate realistic channel values
    const channels = this.getDefaultCVUChannels().map(ch => {
      const nominal = (ch.expectedMin + ch.expectedMax) / 2;
      const noise = (Math.random() - 0.5) * (ch.expectedMax - ch.expectedMin) * 0.1;
      const measured = Number((nominal + noise).toFixed(ch.unit === 'Ω' ? 3 : 2));
      const dev = Math.abs(measured - nominal) / (nominal || 1) * 100;
      return {
        ...ch,
        measuredValue: measured,
        deviationPct: Number(dev.toFixed(2)),
        status: 'PASS' as const,
      };
    });

    this.cvuVerification = {
      status: 'VERIFIED',
      connected: true,
      port: 'COM4 (USB-RS485-ISO)',
      firmwareVersion: 'ESP32-CVU-v2.4.18-PROD',
      diagnosticPingMs: 5,
      galvanicIsolationVerified: true,
      channels,
      verifiedAt: new Date().toISOString(),
    };

    onProgress?.(100, 'CVU Verification Completed — All Channels Verified');
    return { ...this.cvuVerification };
  }

  getCVUStatus(): CVUVerification {
    return { ...this.cvuVerification };
  }

  async configureRL(config: RLConfiguration): Promise<boolean> {
    this.status.systemMode = 'CALIBRATION';
    this.notifyStatus();
    // Simulate relay contactor energisation time
    await new Promise(r => setTimeout(r, 800));
    this.currentRLConfig = { ...config, isConfigured: true };
    this.status.systemMode = 'IDLE';
    this.notifyStatus();
    return true;
  }

  getRLStatus(): RLConfiguration | null {
    return this.currentRLConfig ? { ...this.currentRLConfig } : null;
  }

  async startCalibration(
    targetCurrentA: number,
    targetPowerFactor: number,
    onProgress?: (result: CalibrationResult) => void
  ): Promise<CalibrationResult> {
    this.status.systemMode = 'CALIBRATION';
    this.notifyStatus();

    const cal: CalibrationResult = {
      status: 'INITIALIZING',
      targetCurrentA,
      measuredCurrentA: 0,
      currentTolerancePct: 0,
      targetPowerFactor,
      measuredPowerFactor: 0,
      powerFactorTolerancePct: 0,
      targetFrequencyHz: 50.0,
      measuredFrequencyHz: 50.0,
      shuntVoltageMv: 0,
      transformerTempC: 32.5,
      referenceMeterModel: 'Yokogawa WT3000E Precision Power Analyzer',
      calibratedAt: null,
      certificateId: `CAL-CERT-${Date.now().toString().slice(-6)}`,
      progressPct: 10,
    };
    onProgress?.({ ...cal });
    await new Promise(r => setTimeout(r, 600));

    cal.status = 'APPLYING_TEST_CONDITION';
    cal.progressPct = 40;
    onProgress?.({ ...cal });
    await new Promise(r => setTimeout(r, 800));

    cal.status = 'MEASURING';
    cal.progressPct = 75;
    // Generate realistic measurement very close to target (within 0.5%)
    const curDev = (Math.random() - 0.45) * 0.008; // -0.3% to +0.4%
    cal.measuredCurrentA = Number((targetCurrentA * (1 + curDev)).toFixed(1));
    cal.currentTolerancePct = Number((Math.abs(curDev) * 100).toFixed(2));

    const pfDev = (Math.random() - 0.5) * 0.006;
    cal.measuredPowerFactor = Number((targetPowerFactor + pfDev).toFixed(3));
    cal.powerFactorTolerancePct = Number((Math.abs(pfDev) * 100).toFixed(2));

    cal.measuredFrequencyHz = Number((50.01 + (Math.random() - 0.5) * 0.02).toFixed(2));
    cal.shuntVoltageMv = Number(((cal.measuredCurrentA / 1000) * 10).toFixed(2));
    cal.transformerTempC = 35.8;
    onProgress?.({ ...cal });
    await new Promise(r => setTimeout(r, 800));

    cal.status = 'PASSED';
    cal.progressPct = 100;
    cal.calibratedAt = new Date().toISOString();
    this.calibrationResult = { ...cal };
    this.status.systemMode = 'IDLE';
    this.notifyStatus();
    onProgress?.({ ...cal });

    return { ...cal };
  }

  stopCalibration(): void {
    this.status.systemMode = 'IDLE';
    this.notifyStatus();
  }

  getCalibrationStatus(): CalibrationResult {
    return { ...this.calibrationResult };
  }

  async armTestSequence(mcb: MCBSpecification, config: TestConfiguration): Promise<boolean> {
    if (this.status.emergencyStopActive) throw new Error('Emergency stop is active! Reset before arming.');
    if (!this.status.interlockClosed) throw new Error('Safety interlock is open! Close safety door.');
    if (!this.status.clampEngaged) throw new Error('MCB pneumatic clamp is disengaged! Clamp MCB securely.');

    this.status.systemMode = 'ARMED';
    this.notifyStatus();
    await new Promise(r => setTimeout(r, 500));
    return true;
  }

  async startTest(
    mcb: MCBSpecification,
    config: TestConfiguration,
    onStageChange?: StageChangeListener,
    onTelemetry?: TelemetryListener
  ): Promise<WaveformCapture> {
    this.activeTestAborted = false;

    if (this.status.emergencyStopActive) {
      throw new Error('Emergency stop is active.');
    }
    if (!this.status.interlockClosed) {
      throw new Error('Safety interlock is open.');
    }

    const checkAborted = () => {
      if (this.activeTestAborted) {
        throw new Error('Test sequence aborted by user or emergency stop.');
      }
    };

    try {
      // Stage 1: Safety & pre-check
      this.status.systemMode = 'TESTING';
      this.notifyStatus();
      onStageChange?.('PRE_CHECK', 10, 'Verifying safety interlocks and ground continuity...');
      await new Promise(r => setTimeout(r, 600));
      checkAborted();

      // Stage 2: Switched R-L Matrix Verification
      onStageChange?.('RL_CONFIG', 25, 'Confirming switched R-L contactor positions...');
      await new Promise(r => setTimeout(r, 600));
      checkAborted();

      // Stage 3: Clamp & Chamber Arming
      onStageChange?.('CLAMP_ARMED', 40, 'Pressurizing pneumatic clamps and charging pulse bus...');
      await new Promise(r => setTimeout(r, 700));
      checkAborted();

      // Stage 4: Pre-trigger & Synchronizer
      onStageChange?.('PRE_TRIGGER', 55, 'Point-on-wave synchronizer armed at 45° inception angle...');
      await new Promise(r => setTimeout(r, 600));
      checkAborted();

      // Stage 5: Trigger & High Current Pulse
      onStageChange?.('HIGH_CURRENT_PULSE', 70, `High current pulse fired: ${config.prospectiveCurrentA} A prospective...`);
      await new Promise(r => setTimeout(r, 500));
      checkAborted();

      // Stage 6: MCB Interruption & Arc Quenching
      onStageChange?.('MCB_INTERRUPTING', 85, 'Arc quenched in deionisation plates. Contacts separated.');
      await new Promise(r => setTimeout(r, 600));
      checkAborted();

      // Stage 7: Waveform Processing
      onStageChange?.('WAVEFORM_PROCESSING', 95, 'Acquiring 100 kHz Rogowski & high-voltage probe data...');
      await new Promise(r => setTimeout(r, 600));
      checkAborted();

      // Generate waveform
      const waveform = generateRealisticMCBWaveform({
        prospectiveCurrentA: config.prospectiveCurrentA,
        systemVoltageV: config.systemVoltageV,
        powerFactor: config.targetPowerFactor,
        frequencyHz: config.systemFrequencyHz,
        tripCurve: mcb.trippingCurve,
        ratedCurrentA: mcb.ratedCurrentA,
        simulateFailure: 'NONE',
      });

      this.lastCapturedWaveform = waveform;
      this.status.systemMode = 'IDLE';
      this.notifyStatus();

      onStageChange?.('COMPLETED', 100, 'Test completed successfully. Waveform captured.');
      return waveform;
    } catch (err: any) {
      this.status.systemMode = 'IDLE';
      this.notifyStatus();
      onStageChange?.('ABORTED', 0, err.message || 'Test sequence failed.');
      throw err;
    }
  }

  abortTest(): void {
    this.activeTestAborted = true;
    this.status.systemMode = 'IDLE';
    this.notifyStatus();
  }

  async captureWaveform(): Promise<WaveformCapture> {
    if (this.lastCapturedWaveform) {
      return this.lastCapturedWaveform;
    }
    // Generate default waveform
    const wf = generateRealisticMCBWaveform({
      prospectiveCurrentA: 6000,
      systemVoltageV: 240,
      powerFactor: 0.48,
    });
    this.lastCapturedWaveform = wf;
    return wf;
  }

  subscribeTelemetry(listener: TelemetryListener): () => void {
    this.telemetryListeners.add(listener);
    return () => {
      this.telemetryListeners.delete(listener);
    };
  }

  subscribeHardwareStatus(listener: (status: HardwareStatus) => void): () => void {
    this.statusListeners.add(listener);
    // Initial emit
    listener({ ...this.status });
    return () => {
      this.statusListeners.delete(listener);
    };
  }
}
