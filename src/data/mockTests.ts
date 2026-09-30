import { TestRecord } from '../types/test';
import { MOCK_OPERATORS } from './mockOperators';
import { autoSelectOptimalRLBanks } from '../utils/electricalCalculations';
import { generateRealisticMCBWaveform } from '../utils/waveformGenerator';
import { evaluateTestResult } from '../utils/resultEvaluator';

export function createSeededTests(): TestRecord[] {
  const op1 = MOCK_OPERATORS[0]; // Dr. Marcus Vance
  const op2 = MOCK_OPERATORS[1]; // Elena Rostova

  const defaultCVU = {
    status: 'VERIFIED' as const,
    connected: true,
    port: 'COM4 (USB-RS485-ISO)',
    firmwareVersion: 'ESP32-CVU-v2.4.18-PROD',
    diagnosticPingMs: 5,
    galvanicIsolationVerified: true,
    channels: [
      { id: 'ch1', name: 'Phase Input (L1 Line)', channelNumber: 1, expectedMin: 228, expectedMax: 242, measuredValue: 240.2, unit: 'V RMS', deviationPct: 0.08, status: 'PASS' as const },
      { id: 'ch2', name: 'Neutral Input (N Reference)', channelNumber: 2, expectedMin: 0, expectedMax: 2.5, measuredValue: 0.3, unit: 'V RMS', deviationPct: 0, status: 'PASS' as const },
      { id: 'ch3', name: 'MCB Terminal Input (Line Side)', channelNumber: 3, expectedMin: 228, expectedMax: 242, measuredValue: 239.9, unit: 'V RMS', deviationPct: 0.04, status: 'PASS' as const },
      { id: 'ch4', name: 'MCB Terminal Output (Load Side)', channelNumber: 4, expectedMin: 0, expectedMax: 2, measuredValue: 0.1, unit: 'V RMS', deviationPct: 0, status: 'PASS' as const },
      { id: 'ch5', name: 'Earth Continuity (PE Safety Bond)', channelNumber: 5, expectedMin: 0.001, expectedMax: 0.05, measuredValue: 0.011, unit: 'Ω', deviationPct: 0.2, status: 'PASS' as const },
      { id: 'ch6', name: 'Shunt / Rogowski Zero', channelNumber: 6, expectedMin: -0.5, expectedMax: 0.5, measuredValue: 0.02, unit: 'mV', deviationPct: 0.01, status: 'PASS' as const },
    ],
    verifiedAt: '2026-09-29T10:15:00.000Z',
  };

  const defaultCalibration = {
    status: 'PASSED' as const,
    targetCurrentA: 6000,
    measuredCurrentA: 5994,
    currentTolerancePct: 0.1,
    targetPowerFactor: 0.48,
    measuredPowerFactor: 0.481,
    powerFactorTolerancePct: 0.2,
    targetFrequencyHz: 50.0,
    measuredFrequencyHz: 50.01,
    shuntVoltageMv: 59.94,
    transformerTempC: 34.2,
    referenceMeterModel: 'Yokogawa WT3000E Precision Power Analyzer',
    calibratedAt: '2026-09-29T10:20:00.000Z',
    certificateId: 'CAL-CERT-994102',
    progressPct: 100,
  };

  // Test 1: Schneider C16 at 6000A - PASS
  const mcb1 = {
    manufacturer: 'Schneider Electric',
    modelNumber: 'Acti9 iC60N',
    serialNumber: 'SE-2026-881923',
    poles: 'SP' as const,
    ratedCurrentA: 16,
    ratedVoltageV: 240,
    trippingCurve: 'C' as const,
    instantaneousTrippingRange: '5 In – 10 In',
    ratedBreakingCapacityA: 6000,
    standardsComplied: 'IEC 60898-1:2015',
    productionBatch: 'B26-09-FR-04',
  };
  const cfg1 = {
    testType: 'Icn' as const,
    prospectiveCurrentA: 6000,
    targetPowerFactor: 0.48,
    systemVoltageV: 240,
    systemFrequencyHz: 50,
    shotCycle: 'O - t - CO' as const,
    openCloseIntervalSec: 180,
    breakArcInceptionAngleDeg: 45,
    arcChamberPressureMonitoring: true,
    ambientTemperatureC: 24.1,
    relativeHumidityPct: 46,
  };
  const rl1 = autoSelectOptimalRLBanks(cfg1.systemVoltageV, cfg1.prospectiveCurrentA, cfg1.targetPowerFactor, cfg1.systemFrequencyHz, cfg1.breakArcInceptionAngleDeg);
  const wf1 = generateRealisticMCBWaveform({
    prospectiveCurrentA: cfg1.prospectiveCurrentA,
    systemVoltageV: cfg1.systemVoltageV,
    powerFactor: cfg1.targetPowerFactor,
    tripCurve: mcb1.trippingCurve,
    ratedCurrentA: mcb1.ratedCurrentA,
    simulateFailure: 'NONE',
  });
  const res1 = evaluateTestResult(mcb1, cfg1, wf1, false);

  // Test 2: ABB D32 at 10000A - PASS
  const mcb2 = {
    manufacturer: 'ABB',
    modelNumber: 'S200M-D32',
    serialNumber: 'ABB-2026-441029',
    poles: 'DP' as const,
    ratedCurrentA: 32,
    ratedVoltageV: 400,
    trippingCurve: 'D' as const,
    instantaneousTrippingRange: '10 In – 20 In',
    ratedBreakingCapacityA: 10000,
    standardsComplied: 'IEC 60898-1:2015',
    productionBatch: 'ABB-DE-2026-11',
  };
  const cfg2 = {
    testType: 'Icn' as const,
    prospectiveCurrentA: 10000,
    targetPowerFactor: 0.38,
    systemVoltageV: 240,
    systemFrequencyHz: 50,
    shotCycle: 'O - t - CO' as const,
    openCloseIntervalSec: 180,
    breakArcInceptionAngleDeg: 45,
    arcChamberPressureMonitoring: true,
    ambientTemperatureC: 23.9,
    relativeHumidityPct: 44,
  };
  const rl2 = autoSelectOptimalRLBanks(cfg2.systemVoltageV, cfg2.prospectiveCurrentA, cfg2.targetPowerFactor, cfg2.systemFrequencyHz, cfg2.breakArcInceptionAngleDeg);
  const wf2 = generateRealisticMCBWaveform({
    prospectiveCurrentA: cfg2.prospectiveCurrentA,
    systemVoltageV: cfg2.systemVoltageV,
    powerFactor: cfg2.targetPowerFactor,
    tripCurve: mcb2.trippingCurve,
    ratedCurrentA: mcb2.ratedCurrentA,
    simulateFailure: 'NONE',
  });
  const res2 = evaluateTestResult(mcb2, cfg2, wf2, false);

  // Test 3: Siemens B10 at 4500A - PASS
  const mcb3 = {
    manufacturer: 'Siemens',
    modelNumber: '5SL6110-6',
    serialNumber: 'SIE-2026-102941',
    poles: 'SPN' as const,
    ratedCurrentA: 10,
    ratedVoltageV: 240,
    trippingCurve: 'B' as const,
    instantaneousTrippingRange: '3 In – 5 In',
    ratedBreakingCapacityA: 4500,
    standardsComplied: 'IEC 60898-1:2015',
    productionBatch: 'SIE-CZ-881',
  };
  const cfg3 = {
    testType: 'Routine Breaking Capacity' as const,
    prospectiveCurrentA: 4500,
    targetPowerFactor: 0.75,
    systemVoltageV: 240,
    systemFrequencyHz: 50,
    shotCycle: 'O' as const,
    openCloseIntervalSec: 120,
    breakArcInceptionAngleDeg: 60,
    arcChamberPressureMonitoring: false,
    ambientTemperatureC: 24.8,
    relativeHumidityPct: 49,
  };
  const rl3 = autoSelectOptimalRLBanks(cfg3.systemVoltageV, cfg3.prospectiveCurrentA, cfg3.targetPowerFactor, cfg3.systemFrequencyHz, cfg3.breakArcInceptionAngleDeg);
  const wf3 = generateRealisticMCBWaveform({
    prospectiveCurrentA: cfg3.prospectiveCurrentA,
    systemVoltageV: cfg3.systemVoltageV,
    powerFactor: cfg3.targetPowerFactor,
    tripCurve: mcb3.trippingCurve,
    ratedCurrentA: mcb3.ratedCurrentA,
    simulateFailure: 'NONE',
  });
  const res3 = evaluateTestResult(mcb3, cfg3, wf3, false);

  // Test 4: Eaton C25 at 6000A - Simulated FAIL (High I²t let-through failure)
  const mcb4 = {
    manufacturer: 'Eaton',
    modelNumber: 'FAZ-C25/1-PROTO',
    serialNumber: 'ETN-2026-990142',
    poles: 'SP' as const,
    ratedCurrentA: 25,
    ratedVoltageV: 240,
    trippingCurve: 'C' as const,
    instantaneousTrippingRange: '5 In – 10 In',
    ratedBreakingCapacityA: 6000,
    standardsComplied: 'IEC 60898-1:2015',
    productionBatch: 'ETN-R&D-PROTO-03',
  };
  const cfg4 = {
    testType: 'Icn' as const,
    prospectiveCurrentA: 6000,
    targetPowerFactor: 0.48,
    systemVoltageV: 240,
    systemFrequencyHz: 50,
    shotCycle: 'O - t - CO' as const,
    openCloseIntervalSec: 180,
    breakArcInceptionAngleDeg: 45,
    arcChamberPressureMonitoring: true,
    ambientTemperatureC: 25.4,
    relativeHumidityPct: 52,
  };
  const rl4 = autoSelectOptimalRLBanks(cfg4.systemVoltageV, cfg4.prospectiveCurrentA, cfg4.targetPowerFactor, cfg4.systemFrequencyHz, cfg4.breakArcInceptionAngleDeg);
  const wf4 = generateRealisticMCBWaveform({
    prospectiveCurrentA: cfg4.prospectiveCurrentA,
    systemVoltageV: cfg4.systemVoltageV,
    powerFactor: cfg4.targetPowerFactor,
    tripCurve: mcb4.trippingCurve,
    ratedCurrentA: mcb4.ratedCurrentA,
    simulateFailure: 'HIGH_I2T',
  });
  const res4 = evaluateTestResult(mcb4, cfg4, wf4, true);

  // Test 5: Legrand C32 at 6000A - PASS
  const mcb5 = {
    manufacturer: 'Legrand',
    modelNumber: 'TX3-403548',
    serialNumber: 'LEG-2026-663819',
    poles: 'TP' as const,
    ratedCurrentA: 32,
    ratedVoltageV: 400,
    trippingCurve: 'C' as const,
    instantaneousTrippingRange: '5 In – 10 In',
    ratedBreakingCapacityA: 6000,
    standardsComplied: 'IEC 60898-1:2015',
    productionBatch: 'LEG-FR-2026-07',
  };
  const cfg5 = {
    testType: 'Ics' as const,
    prospectiveCurrentA: 6000,
    targetPowerFactor: 0.48,
    systemVoltageV: 240,
    systemFrequencyHz: 50,
    shotCycle: 'O - t - CO' as const,
    openCloseIntervalSec: 180,
    breakArcInceptionAngleDeg: 45,
    arcChamberPressureMonitoring: true,
    ambientTemperatureC: 24.0,
    relativeHumidityPct: 45,
  };
  const rl5 = autoSelectOptimalRLBanks(cfg5.systemVoltageV, cfg5.prospectiveCurrentA, cfg5.targetPowerFactor, cfg5.systemFrequencyHz, cfg5.breakArcInceptionAngleDeg);
  const wf5 = generateRealisticMCBWaveform({
    prospectiveCurrentA: cfg5.prospectiveCurrentA,
    systemVoltageV: cfg5.systemVoltageV,
    powerFactor: cfg5.targetPowerFactor,
    tripCurve: mcb5.trippingCurve,
    ratedCurrentA: mcb5.ratedCurrentA,
    simulateFailure: 'NONE',
  });
  const res5 = evaluateTestResult(mcb5, cfg5, wf5, false);

  // Test 6: Schneider B6 at 3000A - PASS
  const mcb6 = {
    manufacturer: 'Schneider Electric',
    modelNumber: 'Acti9 iC60N-B6',
    serialNumber: 'SE-2026-118274',
    poles: 'SP' as const,
    ratedCurrentA: 6,
    ratedVoltageV: 240,
    trippingCurve: 'B' as const,
    instantaneousTrippingRange: '3 In – 5 In',
    ratedBreakingCapacityA: 6000,
    standardsComplied: 'IEC 60898-1:2015',
    productionBatch: 'B26-09-FR-02',
  };
  const cfg6 = {
    testType: 'Routine Breaking Capacity' as const,
    prospectiveCurrentA: 3000,
    targetPowerFactor: 0.88,
    systemVoltageV: 240,
    systemFrequencyHz: 50,
    shotCycle: 'O' as const,
    openCloseIntervalSec: 120,
    breakArcInceptionAngleDeg: 45,
    arcChamberPressureMonitoring: false,
    ambientTemperatureC: 24.2,
    relativeHumidityPct: 47,
  };
  const rl6 = autoSelectOptimalRLBanks(cfg6.systemVoltageV, cfg6.prospectiveCurrentA, cfg6.targetPowerFactor, cfg6.systemFrequencyHz, cfg6.breakArcInceptionAngleDeg);
  const wf6 = generateRealisticMCBWaveform({
    prospectiveCurrentA: cfg6.prospectiveCurrentA,
    systemVoltageV: cfg6.systemVoltageV,
    powerFactor: cfg6.targetPowerFactor,
    tripCurve: mcb6.trippingCurve,
    ratedCurrentA: mcb6.ratedCurrentA,
    simulateFailure: 'NONE',
  });
  const res6 = evaluateTestResult(mcb6, cfg6, wf6, false);

  return [
    {
      id: 'TEST-2026-0930-001',
      createdAt: '2026-09-30T09:42:15.000Z',
      completedAt: '2026-09-30T09:45:30.000Z',
      operator: op1,
      mcb: mcb1,
      configuration: cfg1,
      rlConfig: rl1,
      cvuVerification: defaultCVU,
      calibration: defaultCalibration,
      waveform: wf1,
      result: res1,
      status: 'COMPLETED',
      notes: 'Clean interruption test under prospective 6000A. Nominal arc voltage and zero contact damage.',
    },
    {
      id: 'TEST-2026-0930-002',
      createdAt: '2026-09-30T08:15:20.000Z',
      completedAt: '2026-09-30T08:18:45.000Z',
      operator: op1,
      mcb: mcb2,
      configuration: cfg2,
      rlConfig: rl2,
      cvuVerification: defaultCVU,
      calibration: defaultCalibration,
      waveform: wf2,
      result: res2,
      status: 'COMPLETED',
      notes: '10kA high current test on industrial 2-pole unit. Contact separation within 3.2ms.',
    },
    {
      id: 'TEST-2026-0929-003',
      createdAt: '2026-09-29T15:20:00.000Z',
      completedAt: '2026-09-29T15:23:10.000Z',
      operator: op2,
      mcb: mcb3,
      configuration: cfg3,
      rlConfig: rl3,
      cvuVerification: defaultCVU,
      calibration: defaultCalibration,
      waveform: wf3,
      result: res3,
      status: 'COMPLETED',
      notes: 'Routine QC batch verification for residential 10A B-curve.',
    },
    {
      id: 'TEST-2026-0929-002',
      createdAt: '2026-09-29T14:05:00.000Z',
      completedAt: '2026-09-29T14:08:20.000Z',
      operator: op1,
      mcb: mcb4,
      configuration: cfg4,
      rlConfig: rl4,
      cvuVerification: defaultCVU,
      calibration: defaultCalibration,
      waveform: wf4,
      result: res4,
      status: 'FAILED',
      notes: 'FAIL: Prototype sample exhibited excessive arc retention and breached Class 3 Joule integral threshold.',
    },
    {
      id: 'TEST-2026-0928-005',
      createdAt: '2026-09-28T16:30:00.000Z',
      completedAt: '2026-09-28T16:33:40.000Z',
      operator: op2,
      mcb: mcb5,
      configuration: cfg5,
      rlConfig: rl5,
      cvuVerification: defaultCVU,
      calibration: defaultCalibration,
      waveform: wf5,
      result: res5,
      status: 'COMPLETED',
      notes: 'Three-phase commercial rated unit tested under single-pole short-circuit condition.',
    },
    {
      id: 'TEST-2026-0928-001',
      createdAt: '2026-09-28T10:10:00.000Z',
      completedAt: '2026-09-28T10:13:15.000Z',
      operator: op1,
      mcb: mcb6,
      configuration: cfg6,
      rlConfig: rl6,
      cvuVerification: defaultCVU,
      calibration: defaultCalibration,
      waveform: wf6,
      result: res6,
      status: 'COMPLETED',
      notes: 'Rapid interruption for sensitive 6A B-curve device.',
    },
  ];
}
