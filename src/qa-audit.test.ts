import { calculateTargetRL, autoSelectOptimalRLBanks } from './utils/electricalCalculations';
import { generateRealisticMCBWaveform } from './utils/waveformGenerator';
import { evaluateTestResult } from './utils/resultEvaluator';
import { generateTestCertificatePDF } from './services/reports/pdfService';
import { storageService } from './services/storage/storageService';
import { MockHardwareController } from './services/hardware/mockHardwareService';
import { MOCK_OPERATORS } from './data/mockOperators';

async function runQAAudit() {
  console.log('====================================================');
  console.log('STARTING AUTOMATED QA & INTEGRATION AUDIT SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`[PASS] ${desc}`);
      passed++;
    } else {
      console.error(`[FAIL] ${desc}`);
      failed++;
    }
  }

  // 1. Electrical Calculation Audit
  console.log('--- 1. Testing Electrical Calculations ---');
  const z6k = calculateTargetRL(240, 6000, 0.48, 50);
  assert(Math.abs(z6k.targetImpedanceOhms - 0.04) < 0.001, 'Z = 240V / 6000A = 0.04 Ω');
  assert(Math.abs(z6k.targetResistanceOhms - 0.0192) < 0.001, 'R = 0.04 * 0.48 = 0.0192 Ω');
  assert(z6k.targetInductanceMh > 0.09 && z6k.targetInductanceMh < 0.13, 'L is ~0.11 mH at 50Hz');

  const rlConfig = autoSelectOptimalRLBanks(240, 6000, 0.48, 50, 45);
  assert(rlConfig.isConfigured, 'R-L Matrix successfully auto-synthesizes banks');
  assert(rlConfig.selectedResistorBankIds.length > 0, 'Resistor banks selected');
  assert(rlConfig.selectedInductorBankIds.length > 0, 'Inductor banks selected');
  assert(rlConfig.compatibilityStatus === 'OPTIMAL' || rlConfig.compatibilityStatus === 'ACCEPTABLE', 'Impedance match within allowable deviation');

  // 2. Mock Hardware Controller & CVU Verification Audit
  console.log('\n--- 2. Testing Hardware Controller & CVU Diagnostics ---');
  const hw = new MockHardwareController();
  const initialStatus = hw.getStatus();
  assert(initialStatus.plcConnected && initialStatus.daqConnected, 'Hardware controller initial status connected');

  const cvu = await hw.verifyCVU();
  assert(cvu.status === 'VERIFIED', 'CVU verification completes with VERIFIED status');
  assert(cvu.channels.length === 6, 'CVU acquires all 6 analog channels');
  assert(cvu.channels.every(c => c.status === 'PASS'), 'All 6 channels within permissible deviation limits');

  // 3. Calibration Process Audit
  console.log('\n--- 3. Testing Metrology Calibration Process ---');
  const cal = await hw.startCalibration(6000, 0.48);
  assert(cal.status === 'PASSED', 'Calibration completes with PASSED status');
  assert(cal.currentTolerancePct <= 1.0, `Current error ${cal.currentTolerancePct}% <= 1.0% tolerance`);
  assert(cal.certificateId.startsWith('CAL-CERT-'), 'Valid calibration certificate ID issued');

  // 4. Waveform Physics Simulation Audit
  console.log('\n--- 4. Testing Waveform Physics & Parameter Extraction ---');
  const wf = generateRealisticMCBWaveform({
    prospectiveCurrentA: 6000,
    systemVoltageV: 240,
    powerFactor: 0.48,
    frequencyHz: 50,
    tripCurve: 'C',
    ratedCurrentA: 16,
    simulateFailure: 'NONE',
  });
  assert(wf.points.length > 100, `Waveform generated ${wf.points.length} points`);
  assert(wf.peakCurrentA > 2000 && wf.peakCurrentA <= 9000, `Peak current cut-off Ip is ${wf.peakCurrentA} A`);
  assert(wf.jouleIntegralA2s > 5000 && wf.jouleIntegralA2s < 45000, `Joule integral let-through is ${wf.jouleIntegralA2s} A²s`);
  assert(wf.totalInterruptionTimeMs > 4 && wf.totalInterruptionTimeMs < 20, `Total interruption time is ${wf.totalInterruptionTimeMs} ms (< 20ms full cycle)`);
  assert(wf.recoveryVoltageV > 220, `Recovery voltage sustained at ${wf.recoveryVoltageV} V`);
  assert(wf.markers.length >= 4, 'Oscilloscope markers generated for trigger, contact lift, Ip, and extinction');

  // 5. IEC 60898-1 Criteria Evaluation Audit
  console.log('\n--- 5. Testing IEC 60898-1 Criteria Evaluation ---');
  const mcbSpec = {
    manufacturer: 'Schneider Electric',
    modelNumber: 'Acti9 iC60N',
    serialNumber: 'SE-TEST-001',
    poles: 'SP' as const,
    ratedCurrentA: 16,
    ratedVoltageV: 240,
    trippingCurve: 'C' as const,
    instantaneousTrippingRange: '5 In – 10 In',
    ratedBreakingCapacityA: 6000,
    standardsComplied: 'IEC 60898-1:2015',
    productionBatch: 'B26-09',
  };
  const testCfg = {
    testType: 'Icn' as const,
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

  const passResult = evaluateTestResult(mcbSpec, testCfg, wf, false);
  assert(passResult.overallResult === 'PASS', 'Normal waveform evaluates to overall PASS');
  assert(passResult.criteria.length === 6, 'All 6 IEC limiting criteria evaluated');

  const failWf = generateRealisticMCBWaveform({
    prospectiveCurrentA: 6000,
    systemVoltageV: 240,
    powerFactor: 0.48,
    simulateFailure: 'HIGH_I2T',
  });
  const failResult = evaluateTestResult(mcbSpec, testCfg, failWf, true);
  assert(failResult.overallResult === 'FAIL', 'Simulated failure correctly evaluates to overall FAIL');

  // 6. PDF Certificate Generation Audit
  console.log('\n--- 6. Testing jsPDF Certificate Generation ---');
  const dummyRecord = {
    id: 'TEST-AUDIT-001',
    createdAt: new Date().toISOString(),
    operator: MOCK_OPERATORS[0],
    mcb: mcbSpec,
    configuration: testCfg,
    rlConfig,
    cvuVerification: cvu,
    calibration: cal,
    waveform: wf,
    result: passResult,
    status: 'COMPLETED' as const,
  };
  const doc = generateTestCertificatePDF(dummyRecord, false);
  assert(doc !== null && typeof doc.save === 'function', 'jsPDF successfully generates vector document');
  assert(doc.internal.pages.length >= 1, 'PDF document contains formatted pages');

  // 7. Emergency Stop Audit
  console.log('\n--- 7. Testing Emergency Stop Functionality ---');
  hw.emergencyStop();
  const eStopStatus = hw.getStatus();
  assert(eStopStatus.emergencyStopActive === true, 'Emergency stop flag latched');
  assert(eStopStatus.systemMode === 'EMERGENCY_STOP', 'System mode shifted to EMERGENCY_STOP');
  assert(eStopStatus.sourceTransformerReady === false, 'Transformer source de-energized');

  hw.resetEmergencyStop();
  const resetStatus = hw.getStatus();
  assert(resetStatus.emergencyStopActive === false, 'Emergency stop successfully reset');
  assert(resetStatus.systemMode === 'IDLE', 'System mode restored to IDLE');

  // Disconnect & cleanup
  await hw.disconnect();
  assert(!hw.getStatus().plcConnected, 'Clean disconnect releases hardware resources and timers');

  console.log('\n====================================================');
  console.log(`AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runQAAudit().catch((err) => {
  console.error('Audit exception:', err);
  process.exit(1);
});
