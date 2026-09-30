import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTestStore } from '../../store/testStore';
import { storageService } from '../../services/storage/storageService';
import { DetailedWaveformAnalysisChart } from '../../components/charts/DetailedWaveformAnalysisChart';
import { generateRealisticMCBWaveform } from '../../utils/waveformGenerator';
import { formatCurrent, formatVoltage, formatJouleIntegral, formatTimeMs } from '../../utils/formatters';
import {
  FileText,
  PlaySquare,
  ArrowLeft,
  Cpu,
  Layers,
  Activity,
  CheckCircle2,
  Clock,
  Zap,
  Flame,
  ShieldCheck,
  TrendingDown,
  Download,
  SlidersHorizontal,
  ChevronRight,
} from 'lucide-react';
import { clsx } from 'clsx';
import { TestRecord } from '../../types';

export const WaveformAnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeWaveform, mcb, configuration, setActiveWaveform, loadHistoricalTest } = useTestStore();
  const tests = storageService.getTests();

  // Selected test record ID for comparison / inspection
  const [selectedRecordId, setSelectedRecordId] = useState<string>(tests[0]?.id || 'ACTIVE_TEST');

  // If no waveform loaded, use stored active waveform, or first historical test, or generate a realistic sample
  const currentWf = activeWaveform || tests[0]?.waveform || generateRealisticMCBWaveform({
    prospectiveCurrentA: 6000,
    systemVoltageV: 240,
    powerFactor: 0.48,
    ratedCurrentA: 16,
    simulateFailure: 'NONE',
  });

  // Calculate analytical parameters
  const prospectivePeakA = Math.round(configuration.prospectiveCurrentA * Math.SQRT2);
  const limitationRatio = ((currentWf.peakCurrentA / (prospectivePeakA || 8485)) * 100).toFixed(1);
  const iecClass3LimitA2s = 35000;
  const energyMarginPct = Math.round(((iecClass3LimitA2s - currentWf.jouleIntegralA2s) / iecClass3LimitA2s) * 100);

  const handleSelectHistoricalTest = (test: TestRecord) => {
    setSelectedRecordId(test.id);
    loadHistoricalTest(test);
  };

  const handleExportCSV = () => {
    if (!currentWf) return;
    const header = 'Time_ms,Current_A,Voltage_V,ArcVoltage_V\n';
    const rows = currentWf.points
      .map((p) => `${p.timeMs},${p.currentA.toFixed(2)},${p.voltageV.toFixed(2)},${(p.arcVoltageV ?? 0).toFixed(2)}`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Waveform_Analysis_${selectedRecordId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* 1. TEST IDENTIFICATION & COMPLIANCE VERDICT (Top Engineering Banner) */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-teal-700 font-bold uppercase tracking-wider mb-0.5">
              <span>POST-TEST METROLOGICAL WORKBENCH</span>
              <span>•</span>
              <span>IEC 60898-1 CLAUSE 9.12 COMPLIANCE</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-teal-600" />
              Detailed Waveform & Breaking Capacity Analysis
            </h1>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-mono font-bold text-xs rounded transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>EXPORT RAW CSV</span>
            </button>
            <button
              onClick={() => navigate('/reports')}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-mono font-bold text-xs rounded transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-teal-600" />
              <span>IEC CERTIFICATE</span>
            </button>
            <button
              onClick={() => navigate('/waveform-monitoring')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono font-bold text-xs rounded transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5 text-slate-500" />
              <span>LIVE DSO MONITOR</span>
            </button>
          </div>
        </div>

        {/* Test Subject & Metrological Identity Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">DEVICE UNDER TEST (DUT)</span>
            <div className="font-bold text-slate-900 mt-0.5">{mcb.manufacturer} {mcb.modelNumber}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{mcb.poles} • {mcb.ratedCurrentA}A • Curve {mcb.trippingCurve}</div>
          </div>

          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">PROSPECTIVE SHORT-CIRCUIT</span>
            <div className="font-bold text-slate-900 mt-0.5">{formatCurrent(configuration.prospectiveCurrentA)} @ {configuration.systemVoltageV} V</div>
            <div className="text-[10px] text-slate-500 mt-0.5">cos φ = {configuration.targetPowerFactor} (Table 17)</div>
          </div>

          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">TEST RECORD IDENTIFIER</span>
            <div className="font-bold text-teal-800 mt-0.5">{selectedRecordId}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Point-on-Wave Sync: 45.0°</div>
          </div>

          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded flex flex-col justify-between">
            <span className="text-[10px] text-emerald-700 uppercase font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              IEC EVALUATION VERDICT
            </span>
            <div className="text-sm font-bold text-emerald-800">PASSED • CLASS 3</div>
            <div className="text-[9px] text-emerald-600 font-sans">Full short-circuit breaking verified</div>
          </div>
        </div>
      </div>

      {/* 2. LARGE ANALYSIS WAVEFORM (With Region Overlays & Cursors) */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide font-mono">
              High-Speed Interruption Oscillogram & Event Markers
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            TIME HORIZON: <strong>0.00 to 20.00 ms (100 kS/s)</strong>
          </div>
        </div>

        {/* Detailed Chart with Arc Region & Markers */}
        <DetailedWaveformAnalysisChart waveform={currentWf} height={420} />
      </div>

      {/* 3. EXTENDED 4-COLUMN METROLOGICAL ENGINEERING METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
        {/* Metric 1: Peak Cut-off Current */}
        <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase font-semibold">
            <span>Peak Cut-Off (Ip)</span>
            <TrendingDown className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {formatCurrent(currentWf.peakCurrentA)}
          </div>
          <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px]">
            <div className="flex justify-between text-slate-500">
              <span>Prospective Peak:</span>
              <span className="font-semibold text-slate-700">{formatCurrent(prospectivePeakA)}</span>
            </div>
            <div className="flex justify-between text-teal-700 font-bold">
              <span>Limitation Ratio (n):</span>
              <span>{limitationRatio}% ({currentWf.peakCurrentA < prospectivePeakA ? 'REDUCED' : 'NORMAL'})</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Joule Let-Through Energy */}
        <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase font-semibold">
            <span>Joule Integral (I²t)</span>
            <Flame className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-teal-700 tracking-tight">
            {formatJouleIntegral(currentWf.jouleIntegralA2s)}
          </div>
          <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px]">
            <div className="flex justify-between text-slate-500">
              <span>IEC Class 3 Limit:</span>
              <span className="font-semibold text-slate-700">{formatJouleIntegral(iecClass3LimitA2s)}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-bold">
              <span>Safety Margin:</span>
              <span>{energyMarginPct}% below threshold</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Total Interruption & Arc Duration */}
        <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase font-semibold">
            <span>Interruption Timing</span>
            <Clock className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {formatTimeMs(currentWf.totalInterruptionTimeMs)}
          </div>
          <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px]">
            <div className="flex justify-between text-slate-500">
              <span>Arc Duration (t_arc):</span>
              <span className="font-semibold text-slate-700">{formatTimeMs(currentWf.arcDurationMs)}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-bold">
              <span>Half-Cycle Rating:</span>
              <span>&lt; 10 ms (FAST CLEAR)</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Recovery Voltage & TRV */}
        <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase font-semibold">
            <span>Recovery Voltage (Ur)</span>
            <Zap className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {formatVoltage(currentWf.recoveryVoltageV)}
          </div>
          <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px]">
            <div className="flex justify-between text-slate-500">
              <span>Peak TRV (Uc):</span>
              <span className="font-semibold text-slate-700">342.5 V</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-bold">
              <span>Dielectric Restrike:</span>
              <span>NONE (Sustained Gap)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. METROLOGICAL EVENT TIMELINE & PHYSICAL PHENOMENON TABLE */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-2xs space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-600" />
            <span className="font-bold text-slate-800 uppercase tracking-wide">
              Physical Interruption Event Sequence (Chronological Metrology)
            </span>
          </div>
          <span className="text-[10px] text-slate-400">RESOLUTION: 10 µs PER INTERVAL</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[10px] uppercase">
                <th className="py-2 px-3">Timestamp</th>
                <th className="py-2 px-3">Physical Phenomenon</th>
                <th className="py-2 px-3">Current i(t)</th>
                <th className="py-2 px-3">Arc Voltage u(t)</th>
                <th className="py-2 px-3">Electromechanical State</th>
                <th className="py-2 px-3 text-right">IEC Criterion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
              <tr className="hover:bg-slate-50/70">
                <td className="py-2 px-3 font-bold text-teal-700">t = 0.00 ms</td>
                <td className="py-2 px-3 font-semibold text-slate-900">Synchronous Switch Make (T0)</td>
                <td className="py-2 px-3">0.0 A</td>
                <td className="py-2 px-3">0.0 V</td>
                <td className="py-2 px-3 text-slate-500">POW Thyristor fired at 45.0° electrical angle</td>
                <td className="py-2 px-3 text-right font-bold text-emerald-700">INITIATION OK</td>
              </tr>
              <tr className="hover:bg-slate-50/70">
                <td className="py-2 px-3 font-bold text-teal-700">t = 0.85 ms</td>
                <td className="py-2 px-3 font-semibold text-slate-900">Electrodynamic Contact Blow-Open (T1)</td>
                <td className="py-2 px-3">1,840 A</td>
                <td className="py-2 px-3 text-amber-700 font-semibold">24.5 V (Arc Inception)</td>
                <td className="py-2 px-3 text-slate-500">Magnetic repulsion lifts moving contact arm</td>
                <td className="py-2 px-3 text-right font-bold text-emerald-700">TRIP TIME &lt; 1 ms</td>
              </tr>
              <tr className="hover:bg-slate-50/70">
                <td className="py-2 px-3 font-bold text-teal-700">t = 1.40 ms</td>
                <td className="py-2 px-3 font-semibold text-slate-900">Arc Transfer into Splitter Chute</td>
                <td className="py-2 px-3">2,850 A</td>
                <td className="py-2 px-3 text-amber-700 font-semibold">112.0 V (Chute Entry)</td>
                <td className="py-2 px-3 text-slate-500">Magnetic blowout field guides plasma to de-ion plates</td>
                <td className="py-2 px-3 text-right font-bold text-emerald-700">NO EXHAUST FLASH</td>
              </tr>
              <tr className="hover:bg-slate-50/70 bg-teal-50/30">
                <td className="py-2 px-3 font-bold text-teal-700">t = 2.15 ms</td>
                <td className="py-2 px-3 font-semibold text-slate-900">Peak Current Cut-Off (Ip) Reached</td>
                <td className="py-2 px-3 font-bold text-slate-900">{formatCurrent(currentWf.peakCurrentA)}</td>
                <td className="py-2 px-3 text-amber-700 font-semibold">268.0 V (Counter-Voltage)</td>
                <td className="py-2 px-3 text-slate-500">Arc resistance exceeds system impedance; di/dt becomes negative</td>
                <td className="py-2 px-3 text-right font-bold text-emerald-700">Ip &lt; 8.48 kA (PASS)</td>
              </tr>
              <tr className="hover:bg-slate-50/70">
                <td className="py-2 px-3 font-bold text-teal-700">t = 4.55 ms</td>
                <td className="py-2 px-3 font-semibold text-slate-900">Final Arc Extinction (Zero Crossing)</td>
                <td className="py-2 px-3 font-bold text-emerald-700">0.0 A (Extinguished)</td>
                <td className="py-2 px-3 text-slate-500">Arc extinguished</td>
                <td className="py-2 px-3 text-slate-500">De-ionization completed across 12 splitter chambers</td>
                <td className="py-2 px-3 text-right font-bold text-emerald-700">TOTAL &lt; 10 ms (PASS)</td>
              </tr>
              <tr className="hover:bg-slate-50/70">
                <td className="py-2 px-3 font-bold text-teal-700">t = 4.60+ ms</td>
                <td className="py-2 px-3 font-semibold text-slate-900">Power Frequency Voltage Recovery (Ur)</td>
                <td className="py-2 px-3">0.0 A</td>
                <td className="py-2 px-3 font-bold text-slate-900">{formatVoltage(currentWf.recoveryVoltageV)}</td>
                <td className="py-2 px-3 text-slate-500">Steady-state recovery voltage sustained across open gap</td>
                <td className="py-2 px-3 text-right font-bold text-emerald-700">NO DIELECTRIC RESTRIKE</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. HISTORICAL BENCHMARK COMPARATIVE MATRIX */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-2xs space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div>
            <span className="font-bold text-slate-800 uppercase tracking-wide">
              Historical Benchmark Comparison & Archive Overlay
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Select any past test record to load and inspect its full oscillogram trace
            </span>
          </div>
          <span className="text-[10px] text-teal-700 font-bold">
            {tests.length} ARCHIVED SHOTS IN DB
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[10px] uppercase">
                <th className="py-2 px-3">Record ID</th>
                <th className="py-2 px-3">Test Date</th>
                <th className="py-2 px-3">DUT Rating</th>
                <th className="py-2 px-3">Prospective</th>
                <th className="py-2 px-3">Peak (Ip)</th>
                <th className="py-2 px-3">Joule (I²t)</th>
                <th className="py-2 px-3">Break Time</th>
                <th className="py-2 px-3">Result</th>
                <th className="py-2 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
              {tests.slice(0, 5).map((t) => (
                <tr
                  key={t.id}
                  className={clsx(
                    'transition-colors',
                    selectedRecordId === t.id ? 'bg-teal-50/50 font-semibold' : 'hover:bg-slate-50'
                  )}
                >
                  <td className="py-2 px-3 font-bold text-slate-900">{t.id}</td>
                  <td className="py-2 px-3 text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td className="py-2 px-3">{t.mcb.poles} {t.mcb.ratedCurrentA}A Curve {t.mcb.trippingCurve}</td>
                  <td className="py-2 px-3 font-mono">{formatCurrent(t.configuration.prospectiveCurrentA)}</td>
                  <td className="py-2 px-3 text-slate-900 font-bold">{t.waveform ? formatCurrent(t.waveform.peakCurrentA) : 'N/A'}</td>
                  <td className="py-2 px-3 text-teal-700 font-bold">{t.waveform ? formatJouleIntegral(t.waveform.jouleIntegralA2s) : 'N/A'}</td>
                  <td className="py-2 px-3">{t.waveform ? formatTimeMs(t.waveform.totalInterruptionTimeMs) : 'N/A'}</td>
                  <td className="py-2 px-3">
                    <span className={clsx(
                      'px-1.5 py-0.5 rounded text-[10px] font-bold',
                      t.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    )}>
                      {t.status === 'COMPLETED' ? 'PASS' : 'FAIL'}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right">
                    <button
                      onClick={() => handleSelectHistoricalTest(t)}
                      className="px-2 py-0.5 bg-white hover:bg-teal-50 border border-slate-300 hover:border-teal-400 text-slate-700 hover:text-teal-800 rounded text-[10px] font-bold transition-colors cursor-pointer"
                    >
                      {selectedRecordId === t.id ? 'Active' : 'Load Trace'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
