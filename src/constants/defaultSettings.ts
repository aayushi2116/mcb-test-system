import { SystemSettings } from '../types/system';

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  labName: 'Central High-Power Electrical Certification Laboratory',
  stationId: 'TEST-BENCH-HP-04',
  accreditedStandard: 'IEC 60898-1:2015 / ISO/IEC 17025',
  defaultSystemVoltageV: 240,
  defaultFrequencyHz: 50,
  daqSampleRateKhz: 100,
  waveformDurationMs: 40,
  autoSaveTests: true,
  audioBuzzerEnabled: true,
  strictInterlockEnforced: true,
  simulationDelayFactor: 1.0,
  pdfReportHeader: 'CERTIFICATE OF SHORT-CIRCUIT PERFORMANCE EVALUATION',
  inspectorName: 'Dr. Aris Thorne, Lead Certification Physicist',
};
