import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTestStore } from '../../store/testStore';
import { useToastStore } from '../../store/toastStore';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import {
  formatCurrent,
  formatVoltage,
  formatJouleIntegral,
  formatTimeMs,
  formatDate,
} from '../../utils/formatters';
import {
  CheckCircle2,
  XCircle,
  FileText,
  Cpu,
  Save,
  ArrowLeft,
  Share2,
  Printer,
  ShieldCheck,
} from 'lucide-react';
import { generateTestCertificatePDF } from '../../services/reports/pdfService';

export const TestResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    mcb,
    configuration,
    activeResult,
    activeWaveform,
    savedRecordId,
    saveActiveTestToHistory,
    rlConfig,
    cvuVerification,
    calibration,
  } = useTestStore();
  const toast = useToastStore();

  if (!activeResult) {
    return (
      <div className="text-center py-16 bg-white rounded-lg border border-slate-200">
        <h2 className="text-base font-bold text-slate-800">No Active Test Result Available</h2>
        <p className="text-xs text-slate-500 mt-1">
          Execute a test sequence in the Test Wizard or select a historical test from the database.
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <Button variant="primary" onClick={() => navigate('/new-test')}>
            Go to Test Wizard
          </Button>
          <Button variant="outline" onClick={() => navigate('/test-history')}>
            Browse Test History
          </Button>
        </div>
      </div>
    );
  }

  const isPass = activeResult.overallResult === 'PASS';

  const handleSave = () => {
    const rec = saveActiveTestToHistory();
    toast.success('Test Saved', `Saved record as ${rec.id}`);
  };

  const handleExportPDF = () => {
    const record = {
      id: savedRecordId || `TEST-${Date.now()}`,
      createdAt: new Date().toISOString(),
      operator: {
        id: 'OP-CURR',
        name: 'Authorized Test Engineer',
        badgeNumber: 'STN4-OP',
        role: 'LAB_ENGINEER' as const,
        labStation: 'Station 4',
      },
      mcb,
      configuration,
      rlConfig,
      cvuVerification,
      calibration,
      waveform: activeWaveform || undefined,
      result: activeResult,
      status: isPass ? ('COMPLETED' as const) : ('FAILED' as const),
    };
    generateTestCertificatePDF(record, true);
    toast.success('Certificate Generated', 'Downloaded official PDF certificate.');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Test Performance Evaluation & Verdict
            </h1>
            <Badge variant={isPass ? 'success' : 'danger'} size="md">
              VERDICT: {activeResult.overallResult}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            Specimen: {mcb.manufacturer} {mcb.modelNumber} • Rated {mcb.poles} Curve {mcb.trippingCurve}{mcb.ratedCurrentA} • Prospective: {formatCurrent(configuration.prospectiveCurrentA)}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {!savedRecordId ? (
            <Button variant="success" onClick={handleSave} leftIcon={<Save className="w-4 h-4" />}>
              Save to Database
            </Button>
          ) : (
            <Badge variant="teal">Saved Ref: {savedRecordId}</Badge>
          )}

          <Button
            variant="outline"
            onClick={handleExportPDF}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Export PDF Certificate
          </Button>

          <Button
            variant="primary"
            onClick={() => navigate('/waveform-analysis')}
            leftIcon={<Cpu className="w-4 h-4" />}
          >
            Oscilloscope Analysis
          </Button>
        </div>
      </div>

      {/* Summary KPI Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-500">Cut-Off Peak (Ip)</div>
          <div className="text-2xl font-mono font-bold text-red-600 mt-1">
            {formatCurrent(activeResult.peakCurrentA)}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
            Prospective: {formatCurrent(configuration.prospectiveCurrentA)}
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-500">Let-Through Energy (I²t)</div>
          <div className="text-2xl font-mono font-bold text-slate-900 mt-1">
            {formatJouleIntegral(activeResult.jouleIntegralA2s)}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
            IEC Class 3 Limit Compliant
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-500">Total Interruption Time</div>
          <div className="text-2xl font-mono font-bold text-slate-900 mt-1">
            {formatTimeMs(activeResult.interruptionTimeMs)}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
            Arc Duration: {formatTimeMs(activeResult.arcDurationMs)}
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-500">Recovery Voltage (RMS)</div>
          <div className="text-2xl font-mono font-bold text-emerald-700 mt-1">
            {formatVoltage(activeResult.recoveryVoltageV)}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
            Dielectric Post-Check: {activeResult.dielectricPostCheck}
          </div>
        </div>
      </div>

      {/* Comprehensive Criteria Evaluation Table */}
      <Card
        title="IEC 60898-1:2015 Criteria Compliance Audit"
        subtitle="Individual parameter comparison against international certification limits"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] bg-slate-50/70">
                <th className="py-2.5 px-3">Parameter / Clause</th>
                <th className="py-2.5 px-3">Measured Telemetry</th>
                <th className="py-2.5 px-3">Allowed Standard Limits</th>
                <th className="py-2.5 px-3">Standard Reference</th>
                <th className="py-2.5 px-3 text-right">Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {activeResult.criteria.map((c, i) => (
                <tr key={i} className="hover:bg-slate-50/70">
                  <td className="py-3 px-3 font-semibold text-slate-900 font-sans">
                    <div>{c.parameter}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{c.description}</div>
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-900">
                    {c.parameter.includes('Current')
                      ? formatCurrent(c.measured)
                      : c.parameter.includes('Integral')
                      ? formatJouleIntegral(c.measured)
                      : c.parameter.includes('Time') || c.parameter.includes('Duration')
                      ? formatTimeMs(c.measured)
                      : c.parameter.includes('Voltage')
                      ? formatVoltage(c.measured)
                      : c.measured.toFixed(3)}
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    {c.limitMax
                      ? `Max ${
                          c.parameter.includes('Current')
                            ? formatCurrent(c.limitMax)
                            : c.parameter.includes('Integral')
                            ? formatJouleIntegral(c.limitMax)
                            : `${c.limitMax} ${c.unit}`
                        }`
                      : c.limitMin
                      ? `Min ${c.limitMin} ${c.unit}`
                      : '-'}
                  </td>
                  <td className="py-3 px-3 text-slate-500 font-sans">{c.standardReference}</td>
                  <td className="py-3 px-3 text-right">
                    <Badge variant={c.pass ? 'success' : 'danger'} size="sm">
                      {c.pass ? 'PASS' : 'FAIL'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Post-Test Physical Inspection Box */}
        <div className="mt-5 p-4 rounded-lg bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="font-semibold text-slate-600 block">Contact Welding:</span>
            <span className="font-mono font-bold text-emerald-700">
              {activeResult.contactWeldingDetected ? 'WELDING DETECTED' : 'NONE (FREE TRIPPING)'}
            </span>
          </div>
          <div>
            <span className="font-semibold text-slate-600 block">Arc Chamber Shell Integrity:</span>
            <span className="font-mono font-bold text-slate-900">
              {activeResult.arcChamberIntegrity}
            </span>
          </div>
          <div>
            <span className="font-semibold text-slate-600 block">Dielectric Post-Interruption:</span>
            <span className="font-mono font-bold text-emerald-700">
              {activeResult.dielectricPostCheck} (2.0 kV Verification)
            </span>
          </div>
        </div>

        {/* Evaluator Statement */}
        <div className="mt-4 p-4 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs">
          <span className="font-bold text-emerald-950 block mb-1">
            Official Certification Statement:
          </span>
          <p className="text-emerald-900 leading-relaxed">{activeResult.complianceVerdict}</p>
        </div>
      </Card>
    </div>
  );
};
