import { Operator } from './system';
import { RLConfiguration, CVUVerification, CalibrationResult } from './hardware';
import { WaveformCapture } from './waveform';

export type MCBPoleConfig = 'SP' | 'SPN' | 'DP' | 'TP' | 'FP';
export type MCBTrippingCurve = 'B' | 'C' | 'D';
export type TestType = 'Icn' | 'Ics' | 'Routine Breaking Capacity' | 'Verification of Short-Circuit Capability';
export type ShotCycle = 'O' | 'CO' | 'O - t - CO' | 'O - t - CO - t - CO';

export interface MCBSpecification {
  manufacturer: string;
  modelNumber: string;
  serialNumber: string;
  poles: MCBPoleConfig;
  ratedCurrentA: number;
  ratedVoltageV: number;
  trippingCurve: MCBTrippingCurve;
  instantaneousTrippingRange: string;
  ratedBreakingCapacityA: number; // e.g., 6000 or 10000
  standardsComplied: string; // "IEC 60898-1:2015"
  productionBatch: string;
}

export interface TestConfiguration {
  testType: TestType;
  prospectiveCurrentA: number;
  targetPowerFactor: number;
  systemVoltageV: number;
  systemFrequencyHz: number;
  shotCycle: ShotCycle;
  openCloseIntervalSec: number;
  breakArcInceptionAngleDeg: number;
  arcChamberPressureMonitoring: boolean;
  ambientTemperatureC: number;
  relativeHumidityPct: number;
}

export type TestExecutionStage = 
  | 'PENDING'
  | 'PRE_CHECK'
  | 'RL_CONFIG'
  | 'CVU_VERIFY'
  | 'CALIBRATION'
  | 'CLAMP_ARMED'
  | 'PRE_TRIGGER'
  | 'HIGH_CURRENT_PULSE'
  | 'MCB_INTERRUPTING'
  | 'WAVEFORM_PROCESSING'
  | 'ANALYZING'
  | 'COMPLETED'
  | 'ABORTED'
  | 'EMERGENCY_STOPPED';

export interface TestCriterionResult {
  parameter: string;
  description: string;
  measured: number;
  unit: string;
  limitMin?: number;
  limitMax?: number;
  pass: boolean;
  standardReference: string;
}

export interface TestResult {
  overallResult: 'PASS' | 'FAIL' | 'INCONCLUSIVE';
  peakCurrentA: number;
  jouleIntegralA2s: number; // I²t
  interruptionTimeMs: number;
  arcDurationMs: number;
  recoveryVoltageV: number;
  powerFactor: number;
  dielectricPostCheck: 'PASSED' | 'FAILED' | 'NOT_TESTED';
  arcChamberIntegrity: 'INTACT' | 'BREACHED' | 'DISCOLORATION';
  contactWeldingDetected: boolean;
  criteria: TestCriterionResult[];
  complianceVerdict: string;
  evaluatedAt: string;
  evaluatorNotes: string;
}

export interface TestRecord {
  id: string; // TEST-YYYY-MMDD-XXX
  createdAt: string;
  completedAt?: string;
  operator: Operator;
  mcb: MCBSpecification;
  configuration: TestConfiguration;
  rlConfig: RLConfiguration;
  cvuVerification: CVUVerification;
  calibration: CalibrationResult;
  waveform?: WaveformCapture;
  result?: TestResult;
  status: 'COMPLETED' | 'FAILED' | 'ABORTED';
  notes?: string;
}
