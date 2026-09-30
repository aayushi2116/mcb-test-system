export interface WaveformPoint {
  timeMs: number;
  currentA: number;
  voltageV: number;
  arcVoltageV?: number;
  arcPowerKw?: number;
  contactLiftSignal?: number; // 0 or 1
  tripRelaySignal?: number;   // 0 or 1
}

export interface WaveformMarker {
  id: string;
  timeMs: number;
  label: string;
  value: number;
  unit: string;
  type: 'TRIGGER' | 'CONTACT_SEPARATION' | 'PEAK_CURRENT' | 'ARC_EXTINCTION' | 'RECOVERY_VOLTAGE';
  color: string;
}

export interface WaveformCapture {
  sampleRateKhz: number;
  totalDurationMs: number;
  preTriggerDurationMs: number;
  points: WaveformPoint[];
  markers: WaveformMarker[];
  
  // Key physical quantities extracted per IEC 60898-1
  triggerTimeMs: number;
  contactSeparationTimeMs: number;
  peakCurrentA: number;
  peakCurrentTimeMs: number;
  arcInceptionTimeMs: number;
  arcExtinctionTimeMs: number;
  arcDurationMs: number;
  totalInterruptionTimeMs: number;
  recoveryVoltageV: number;
  prospectiveCurrentA: number;
  jouleIntegralA2s: number; // I²t
  arcEnergyJ: number;
  averagePowerFactor: number;
}
