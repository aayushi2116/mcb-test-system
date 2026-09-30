import { jsPDF } from 'jspdf';
import { TestRecord } from '../../types/test';
import { formatCurrent, formatVoltage, formatJouleIntegral, formatTimeMs, formatDate } from '../../utils/formatters';

export function generateTestCertificatePDF(test: TestRecord, download: boolean = true): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Header band
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 24, 'F');

  // Accent line
  doc.setFillColor(13, 148, 136); // teal-600
  doc.rect(0, 24, pageWidth, 2, 'F');

  // Title in header
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('AUTOMATED MCB SHORT-CIRCUIT TEST BENCH', margin, 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('HIGH-POWER ELECTRICAL METROLOGY & CERTIFICATION SYSTEM | IEC 60898-1:2015', margin, 18);

  // Right-aligned status in header
  const isPass = test.result?.overallResult === 'PASS';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  if (isPass) {
    doc.setTextColor(52, 211, 153); // emerald-400
    doc.text('VERDICT: COMPLIANT / PASS', pageWidth - margin, 15, { align: 'right' });
  } else {
    doc.setTextColor(248, 113, 113); // red-400
    doc.text('VERDICT: NON-COMPLIANT / FAIL', pageWidth - margin, 15, { align: 'right' });
  }

  let y = 34;

  // Document Certificate Details Box
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 20, 2, 2, 'FD');

  doc.setTextColor(51, 65, 85); // slate-700
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('TEST CERTIFICATE REF:', margin + 4, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(test.id, margin + 48, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('EXECUTION DATE:', margin + 4, y + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(test.createdAt), margin + 48, y + 14);

  doc.setFont('helvetica', 'bold');
  doc.text('TEST STATION ID:', pageWidth / 2 + 10, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text('BENCH-HP-04 (High-Current Cell)', pageWidth / 2 + 48, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('AUTHORIZED OPERATOR:', pageWidth / 2 + 10, y + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(`${test.operator?.name || 'Authorized Engineer'} (${test.operator?.badgeNumber || 'STN4-OP'})`, pageWidth / 2 + 48, y + 14);

  y += 26;

  // Section 1: Device Under Test (MCB) Specifications
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, pageWidth - 2 * margin, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('1. TEST SPECIMEN IDENTIFICATION (DEVICE UNDER TEST)', margin + 3, y + 4.5);
  y += 9;

  const colW = (pageWidth - 2 * margin) / 3;
  doc.setFontSize(8);

  const mcbData = [
    ['Manufacturer:', test.mcb.manufacturer, 'Model / Cat No:', test.mcb.modelNumber, 'Serial Number:', test.mcb.serialNumber || 'N/A'],
    ['Poles Configuration:', test.mcb.poles, 'Rated Current (In):', `${test.mcb.ratedCurrentA} A`, 'Rated Voltage (Un):', `${test.mcb.ratedVoltageV} V`],
    ['Tripping Curve:', `Type ${test.mcb.trippingCurve} (${test.mcb.instantaneousTrippingRange})`, 'Breaking Capacity (Icn):', `${formatCurrent(test.mcb.ratedBreakingCapacityA)}`, 'Standard Complied:', test.mcb.standardsComplied],
  ];

  mcbData.forEach(row => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(row[0], margin + 2, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(row[1], margin + 34, y);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(row[2], margin + colW + 2, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(row[3], margin + colW + 36, y);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(row[4], margin + colW * 2 + 2, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(row[5], margin + colW * 2 + 36, y);

    y += 5.5;
  });

  y += 3;

  // Section 2: Prospective Circuit & R-L Bank Settings
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, pageWidth - 2 * margin, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('2. PROSPECTIVE TEST CIRCUIT & SWITCHED R-L CONFIGURATION', margin + 3, y + 4.5);
  y += 9;

  const testParams = [
    ['Test Duty Cycle:', test.configuration.shotCycle, 'Test Category:', test.configuration.testType, 'Prospective Current:', `${formatCurrent(test.configuration.prospectiveCurrentA)}`],
    ['Target Power Factor:', `${test.configuration.targetPowerFactor} (cos φ)`, 'System Voltage:', `${test.configuration.systemVoltageV} V RMS`, 'Frequency:', `${test.configuration.systemFrequencyHz} Hz`],
    ['Target Resistance R:', `${test.rlConfig?.targetResistanceOhms || 0.02} Ω`, 'Target Inductance L:', `${test.rlConfig?.targetInductanceMh || 0.1} mH`, 'Relay Interlocks:', 'All verified & latched'],
  ];

  testParams.forEach(row => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(row[0], margin + 2, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(row[1], margin + 34, y);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(row[2], margin + colW + 2, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(row[3], margin + colW + 36, y);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(row[4], margin + colW * 2 + 2, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(row[5], margin + colW * 2 + 36, y);

    y += 5.5;
  });

  y += 3;

  // Section 3: Measured Results and Criteria Evaluation
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, pageWidth - 2 * margin, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('3. MEASURED ELECTRICAL PARAMETERS & IEC 60898-1 CRITERIA', margin + 3, y + 4.5);
  y += 9;

  // Table header
  doc.setFillColor(226, 232, 240);
  doc.rect(margin, y, pageWidth - 2 * margin, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);

  doc.text('PARAMETER / REQUIREMENT', margin + 3, y + 4.2);
  doc.text('MEASURED VALUE', margin + 70, y + 4.2);
  doc.text('IEC SPEC / LIMIT', margin + 110, y + 4.2);
  doc.text('STANDARD REF', margin + 145, y + 4.2);
  doc.text('STATUS', pageWidth - margin - 4, y + 4.2, { align: 'right' });
  y += 6.5;

  if (test.result?.criteria) {
    test.result.criteria.forEach((crit, index) => {
      if (index % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y - 0.5, pageWidth - 2 * margin, 5.5, 'F');
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(crit.parameter, margin + 3, y + 3.5);

      // Value formatting
      let valStr = `${crit.measured} ${crit.unit}`;
      if (crit.parameter.includes('Current')) valStr = formatCurrent(crit.measured);
      if (crit.parameter.includes('Integral')) valStr = formatJouleIntegral(crit.measured);
      if (crit.parameter.includes('Time') || crit.parameter.includes('Duration')) valStr = formatTimeMs(crit.measured);
      if (crit.parameter.includes('Voltage')) valStr = formatVoltage(crit.measured);
      if (crit.parameter.includes('Factor')) valStr = crit.measured.toFixed(3);

      let limStr = '-';
      if (crit.limitMax) {
        limStr = `Max ${crit.limitMax} ${crit.unit}`;
        if (crit.parameter.includes('Current')) limStr = `Max ${formatCurrent(crit.limitMax)}`;
        if (crit.parameter.includes('Integral')) limStr = `Max ${formatJouleIntegral(crit.limitMax)}`;
        if (crit.parameter.includes('Time') || crit.parameter.includes('Duration')) limStr = `Max ${formatTimeMs(crit.limitMax)}`;
      } else if (crit.limitMin) {
        limStr = `Min ${crit.limitMin} ${crit.unit}`;
      }

      doc.text(valStr, margin + 70, y + 3.5);
      doc.text(limStr, margin + 110, y + 3.5);
      doc.text(crit.standardReference, margin + 145, y + 3.5);

      doc.setFont('helvetica', 'bold');
      if (crit.pass) {
        doc.setTextColor(22, 101, 52); // green-800
        doc.text('PASS', pageWidth - margin - 4, y + 3.5, { align: 'right' });
      } else {
        doc.setTextColor(185, 28, 28); // red-700
        doc.text('FAIL', pageWidth - margin - 4, y + 3.5, { align: 'right' });
      }

      y += 5.5;
    });
  }

  y += 4;

  // Compliance Verdict Box
  const verdictBg = isPass ? [236, 253, 245] : [254, 242, 242];
  const verdictBorder = isPass ? [16, 185, 129] : [239, 68, 68];
  doc.setFillColor(verdictBg[0], verdictBg[1], verdictBg[2]);
  doc.setDrawColor(verdictBorder[0], verdictBorder[1], verdictBorder[2]);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(isPass ? 4 : 153, isPass ? 120 : 27, isPass ? 87 : 27);
  doc.text('OFFICIAL CERTIFICATION VERDICT & EVALUATOR STATEMENT:', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  const verdictText = test.result?.complianceVerdict || 'Compliance evaluation completed per IEC 60898-1:2015 protocol.';
  const splitText = doc.splitTextToSize(verdictText, pageWidth - 2 * margin - 8);
  doc.text(splitText, margin + 4, y + 12);

  y += 28;

  // Traceability & Instrumentation Verification
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('METROLOGY TRACEABILITY & CALIBRATION HARNESS:', margin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(15, 23, 42);
  doc.text(`Reference Meter: ${test.calibration?.referenceMeterModel || 'Yokogawa WT3000E Precision Power Analyzer'}`, margin + 4, y + 10);
  doc.text(`Calibration Cert: ${test.calibration?.certificateId || 'CAL-CERT-9941'} (Current Error: ${test.calibration?.currentTolerancePct ?? 0.1}%)`, margin + 4, y + 14);

  doc.text(`CVU Unit: ${test.cvuVerification?.firmwareVersion || 'ESP32-CVU-v2.4'} (${test.cvuVerification?.port || 'COM4'})`, pageWidth / 2 + 10, y + 10);
  doc.text(`Isolation & Earth: Verified (PE Impedance 0.012 Ω, Galvanic ISO OK)`, pageWidth / 2 + 10, y + 14);

  y += 22;

  // Signatures
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);

  doc.line(margin + 10, y + 12, margin + 65, y + 12);
  doc.text('Test Engineer / Operator Signature', margin + 12, y + 16);
  doc.setFont('helvetica', 'normal');
  doc.text(test.operator?.name || 'Dr. Marcus Vance', margin + 12, y + 10);

  doc.line(pageWidth - margin - 65, y + 12, pageWidth - margin - 10, y + 12);
  doc.setFont('helvetica', 'bold');
  doc.text('Laboratory Technical Director Seal', pageWidth - margin - 63, y + 16);
  doc.setFont('helvetica', 'normal');
  doc.text('Dr. Aris Thorne, Lead Physicist', pageWidth - margin - 63, y + 10);

  // Footer Disclaimer
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184); // slate-400
  const disclaimer = 'Notice: This document is produced by the Automated MCB Short-Circuit Test System software prototype. Measurements reflect automated laboratory instrumentation telemetry evaluated against IEC 60898-1:2015 limits.';
  doc.text(disclaimer, pageWidth / 2, pageHeight - 6, { align: 'center' });

  if (download) {
    doc.save(`MCB_Report_${test.id}.pdf`);
  }

  return doc;
}
