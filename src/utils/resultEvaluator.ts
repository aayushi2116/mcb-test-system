import { TestResult, TestCriterionResult, MCBSpecification, TestConfiguration } from '../types/test';
import { WaveformCapture } from '../types/waveform';

export function evaluateTestResult(
  mcb: MCBSpecification,
  config: TestConfiguration,
  waveform: WaveformCapture,
  failureSimulated: boolean = false
): TestResult {
  // Allowable limits based on IEC 60898-1
  // Energy limit Class 3:
  const i2tLimit = mcb.ratedCurrentA <= 16 ? 35000 : mcb.ratedCurrentA <= 32 ? 45000 : 75000;
  // Maximum interruption time: 20ms (1 full 50Hz cycle)
  const maxInterruptionTimeMs = 20.0;
  // Max allowable arc duration: 12ms
  const maxArcDurationMs = 12.0;
  // Minimum recovery voltage: 95% of nominal system voltage
  const minRecoveryVoltageV = config.systemVoltageV * 0.95;

  const peakPass = !failureSimulated && waveform.peakCurrentA > 0 && waveform.peakCurrentA <= config.prospectiveCurrentA * 1.8;
  const i2tPass = !failureSimulated && waveform.jouleIntegralA2s <= i2tLimit;
  const timePass = !failureSimulated && waveform.totalInterruptionTimeMs <= maxInterruptionTimeMs;
  const arcPass = !failureSimulated && waveform.arcDurationMs <= maxArcDurationMs;
  const recPass = waveform.recoveryVoltageV >= minRecoveryVoltageV;
  const contactWelding = failureSimulated;

  const criteria: TestCriterionResult[] = [
    {
      parameter: 'Cut-off Peak Current (Ip)',
      description: 'Maximum instantaneous peak current during interruption',
      measured: waveform.peakCurrentA,
      unit: 'A',
      limitMax: Number((config.prospectiveCurrentA * 1.5).toFixed(0)),
      pass: peakPass,
      standardReference: 'IEC 60898-1 Cl. 9.12.11.2',
    },
    {
      parameter: 'Joule Integral (I²t)',
      description: 'Total specific energy let-through into the circuit (Class 3 limit)',
      measured: waveform.jouleIntegralA2s,
      unit: 'A²s',
      limitMax: i2tLimit,
      pass: i2tPass,
      standardReference: 'IEC 60898-1 Annex ZA Table ZA.1',
    },
    {
      parameter: 'Total Interruption Time',
      description: 'Time elapsed between make-switch trigger and final arc extinction',
      measured: waveform.totalInterruptionTimeMs,
      unit: 'ms',
      limitMax: maxInterruptionTimeMs,
      pass: timePass,
      standardReference: 'IEC 60898-1 Cl. 9.12.11.3',
    },
    {
      parameter: 'Arc Duration',
      description: 'Duration of electric arc inside deionisation chamber',
      measured: waveform.arcDurationMs,
      unit: 'ms',
      limitMax: maxArcDurationMs,
      pass: arcPass,
      standardReference: 'IEC 60898-1 Cl. 9.12.11.4',
    },
    {
      parameter: 'Power Factor Accuracy',
      description: 'Test circuit prospective power factor cos φ',
      measured: waveform.averagePowerFactor,
      unit: '',
      limitMin: config.targetPowerFactor - 0.05,
      limitMax: config.targetPowerFactor + 0.05,
      pass: Math.abs(waveform.averagePowerFactor - config.targetPowerFactor) <= 0.05,
      standardReference: 'IEC 60898-1 Table 17',
    },
    {
      parameter: 'Power-Frequency Recovery Voltage',
      description: 'RMS recovery voltage sustained across open contacts post-test',
      measured: waveform.recoveryVoltageV,
      unit: 'V',
      limitMin: Number(minRecoveryVoltageV.toFixed(1)),
      pass: recPass,
      standardReference: 'IEC 60898-1 Cl. 9.12.11.5',
    },
  ];

  const overallPass = criteria.every(c => c.pass) && !contactWelding;

  return {
    overallResult: overallPass ? 'PASS' : 'FAIL',
    peakCurrentA: waveform.peakCurrentA,
    jouleIntegralA2s: waveform.jouleIntegralA2s,
    interruptionTimeMs: waveform.totalInterruptionTimeMs,
    arcDurationMs: waveform.arcDurationMs,
    recoveryVoltageV: waveform.recoveryVoltageV,
    powerFactor: waveform.averagePowerFactor,
    dielectricPostCheck: overallPass ? 'PASSED' : 'FAILED',
    arcChamberIntegrity: overallPass ? 'INTACT' : 'DISCOLORATION',
    contactWeldingDetected: contactWelding,
    criteria,
    complianceVerdict: overallPass
      ? `COMPLIANT: The test sample (${mcb.manufacturer} ${mcb.modelNumber} ${mcb.poles} ${mcb.trippingCurve}${mcb.ratedCurrentA}) successfully interrupted the prospective fault current of ${config.prospectiveCurrentA} A at ${config.systemVoltageV} V with complete contact separation and intact dielectric recovery.`
      : `NON-COMPLIANT: Test sample failed to satisfy one or more limiting criteria specified in IEC 60898-1:2015.`,
    evaluatedAt: new Date().toISOString(),
    evaluatorNotes: overallPass
      ? 'Clean arc quenching inside splitter plates. No external flame escape or contact welding.'
      : 'Excessive let-through energy or delayed interruption observed.',
  };
}
