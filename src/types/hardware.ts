export interface CVUChannel {
  id: string;
  name: string;
  channelNumber: number;
  expectedMin: number;
  expectedMax: number;
  measuredValue: number;
  unit: string;
  deviationPct: number;
  status: 'PENDING' | 'PASS' | 'WARNING' | 'FAIL';
  impedanceOhms?: number;
}

export type CVUStatus = 'IDLE' | 'SCANNING' | 'CONNECTING' | 'VERIFIED' | 'FAILED';

export interface CVUVerification {
  status: CVUStatus;
  connected: boolean;
  port: string;
  firmwareVersion: string;
  diagnosticPingMs: number;
  galvanicIsolationVerified: boolean;
  channels: CVUChannel[];
  verifiedAt: string | null;
  errorMessage?: string;
}

export interface SwitchedResistorBank {
  id: string;
  label: string;
  resistanceOhms: number;
  powerRatingKw: number;
  status: 'IDLE' | 'ENGAGED' | 'DISENGAGED' | 'OVERHEAT';
}

export interface SwitchedInductorBank {
  id: string;
  label: string;
  inductanceMh: number;
  reactanceOhms: number; // at nominal frequency
  currentRatingA: number;
  status: 'IDLE' | 'ENGAGED' | 'DISENGAGED';
}

export type RLCompatibilityStatus = 'OPTIMAL' | 'ACCEPTABLE' | 'DEVIATION_HIGH' | 'UNSUPPORTED';

export interface RLConfiguration {
  targetCurrentA: number;
  targetPowerFactor: number;
  systemVoltageV: number;
  systemFrequencyHz: number;
  prospectivePowerKva: number;
  breakArcInceptionAngleDeg: number;
  
  // Target electrical calculated parameters
  targetResistanceOhms: number;
  targetInductanceMh: number;
  targetReactanceOhms: number;
  targetImpedanceOhms: number;

  // Selected physical hardware banks
  selectedResistorBankIds: string[];
  selectedInductorBankIds: string[];
  actualResistanceOhms: number;
  actualInductanceMh: number;
  actualReactanceOhms: number;
  actualImpedanceOhms: number;
  calculatedCurrentA: number;
  calculatedPowerFactor: number;
  currentErrorPct: number;
  powerFactorErrorPct: number;
  
  activeRelays: string[];
  isConfigured: boolean;
  compatibilityStatus: RLCompatibilityStatus;
}

export type CalibrationStatus = 'IDLE' | 'INITIALIZING' | 'APPLYING_TEST_CONDITION' | 'MEASURING' | 'PASSED' | 'FAILED';

export interface CalibrationResult {
  status: CalibrationStatus;
  targetCurrentA: number;
  measuredCurrentA: number;
  currentTolerancePct: number;
  targetPowerFactor: number;
  measuredPowerFactor: number;
  powerFactorTolerancePct: number;
  targetFrequencyHz: number;
  measuredFrequencyHz: number;
  shuntVoltageMv: number;
  transformerTempC: number;
  referenceMeterModel: string;
  calibratedAt: string | null;
  certificateId: string;
  progressPct: number;
  errorMessage?: string;
}

export interface LiveTelemetry {
  timestamp: number;
  currentRmsA: number;
  voltageRmsV: number;
  instantaneousCurrentA: number;
  instantaneousVoltageV: number;
  powerFactor: number;
  frequencyHz: number;
  temperatureTransformerC: number;
  temperatureArcChuteC: number;
  arcPressureBar: number;
  pneumaticClampPressureBar: number;
  mcbContactState: 'CLOSED' | 'OPEN' | 'PARTIAL_TRIP' | 'TRIPPED';
  isArcing: boolean;
  busCharged: boolean;
}
