export type UserRole = 'OPERATOR' | 'LAB_ENGINEER' | 'ADMIN' | 'QUALITY_AUDITOR';

export interface Operator {
  id: string;
  name: string;
  badgeNumber: string;
  role: UserRole;
  labStation: string;
  avatarUrl?: string;
  lastLogin?: string;
}

export type SystemOperationalMode = 'IDLE' | 'ARMED' | 'TESTING' | 'CALIBRATION' | 'EMERGENCY_STOP' | 'ERROR';

export interface HardwareStatus {
  plcConnected: boolean;
  plcLatencyMs: number;
  daqConnected: boolean;
  daqSampleRateKhz: number;
  cvuConnected: boolean;
  cvuPort: string;
  interlockClosed: boolean;
  safetyDoorLocked: boolean;
  emergencyStopActive: boolean;
  clampEngaged: boolean;
  arcShieldClosed: boolean;
  sourceTransformerReady: boolean;
  sourceBusVoltageV: number;
  temperatureAmbientC: number;
  systemMode: SystemOperationalMode;
  simulationMode: boolean; // Explicit flag showing hardware is simulated
}

export interface SystemSettings {
  labName: string;
  stationId: string;
  accreditedStandard: string;
  defaultSystemVoltageV: number;
  defaultFrequencyHz: number;
  daqSampleRateKhz: number;
  waveformDurationMs: number;
  autoSaveTests: boolean;
  audioBuzzerEnabled: boolean;
  strictInterlockEnforced: boolean;
  simulationDelayFactor: number; // 1.0 = normal, 0.5 = faster
  pdfReportHeader: string;
  inspectorName: string;
}
