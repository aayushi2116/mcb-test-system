import {
  HardwareStatus,
  LiveTelemetry,
  CVUVerification,
  RLConfiguration,
  CalibrationResult,
  WaveformCapture,
  MCBSpecification,
  TestConfiguration,
  TestExecutionStage,
} from '../../types';

export type TelemetryListener = (telemetry: LiveTelemetry) => void;
export type StageChangeListener = (stage: TestExecutionStage, progressPct: number, message: string) => void;

export interface IHardwareController {
  // Connection and Health
  connect(): Promise<boolean>;
  disconnect(): Promise<void>;
  getStatus(): HardwareStatus;
  
  // Interlocks & Safety
  setInterlockDoor(closed: boolean): void;
  setPneumaticClamp(engaged: boolean): Promise<boolean>;
  emergencyStop(): void;
  resetEmergencyStop(): boolean;

  // CVU (Conditioning & Verification Unit / ESP32)
  verifyCVU(onProgress?: (progressPct: number, stepName: string) => void): Promise<CVUVerification>;
  getCVUStatus(): CVUVerification;

  // Switched R-L Matrix
  configureRL(config: RLConfiguration): Promise<boolean>;
  getRLStatus(): RLConfiguration | null;

  // Calibration
  startCalibration(
    targetCurrentA: number,
    targetPowerFactor: number,
    onProgress?: (result: CalibrationResult) => void
  ): Promise<CalibrationResult>;
  stopCalibration(): void;
  getCalibrationStatus(): CalibrationResult;

  // MCB Test Execution
  armTestSequence(mcb: MCBSpecification, config: TestConfiguration): Promise<boolean>;
  startTest(
    mcb: MCBSpecification,
    config: TestConfiguration,
    onStageChange?: StageChangeListener,
    onTelemetry?: TelemetryListener
  ): Promise<WaveformCapture>;
  abortTest(): void;

  // Waveform
  captureWaveform(): Promise<WaveformCapture>;

  // Subscriptions
  subscribeTelemetry(listener: TelemetryListener): () => void;
  subscribeHardwareStatus(listener: (status: HardwareStatus) => void): () => void;
}
