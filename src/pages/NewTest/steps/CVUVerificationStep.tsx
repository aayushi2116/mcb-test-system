import React, { useState } from 'react';
import { useTestStore } from '../../../store/testStore';
import { useToastStore } from '../../../store/toastStore';
import { Button } from '../../../components/common/Button';
import {
  CheckCheck,
  RefreshCw,
  Cpu,
  ShieldCheck,
  Activity,
  CheckCircle2,
  Radio,
  ArrowRight,
  Sliders,
  Check,
} from 'lucide-react';
import { clsx } from 'clsx';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

// Rolling contact resistance stability data
const stabilityChartData = [
  { s: 10, r: 0.285 },
  { s: 20, r: 0.284 },
  { s: 30, r: 0.286 },
  { s: 40, r: 0.283 },
  { s: 50, r: 0.284 },
  { s: 60, r: 0.285 },
  { s: 70, r: 0.284 },
  { s: 80, r: 0.283 },
  { s: 90, r: 0.284 },
  { s: 100, r: 0.284 },
];

export const CVUVerificationStep: React.FC<{
  onValidChange?: (isValid: boolean) => void;
  hideHeader?: boolean;
}> = ({ onValidChange, hideHeader = false }) => {
  const { cvuVerification, runCVUVerification, isExecuting, stageStatusMessage, stageProgressPct } = useTestStore();
  const toast = useToastStore();

  const isVerified = cvuVerification.status === 'VERIFIED';

  React.useEffect(() => {
    onValidChange?.(isVerified);
  }, [isVerified, onValidChange]);

  const handleVerify = async () => {
    toast.info('Starting CVU Channel Diagnostics', 'Sampling high-impedance physical contact continuity...');
    const ok = await runCVUVerification();
    if (ok) {
      toast.success('CVU Verification Complete', 'All physical sensing channels verified successfully.');
    } else {
      toast.error('Verification Failed', 'One or more channels deviated outside limits.');
    }
  };

  return (
    <div className="space-y-4 w-full min-w-0">
      {/* Top Header & Tags (matches Figma Screen 4) - only rendered if not hidden by standalone page */}
      {!hideHeader ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <div className="text-[10px] font-mono text-teal-700 font-bold uppercase tracking-wider">
              PRE-TEST DIAGNOSTIC STAGE • PROTOCOL IEC-60898-1 CL.9.12
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              CVU Verification (Pre-Test Connection Check)
            </h2>
            <p className="text-xs text-slate-500">
              Microcontroller-based multi-point physical terminal connection, impedance integrity, and galvanic continuity diagnostics.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleVerify}
              isLoading={isExecuting}
              leftIcon={<RefreshCw className="w-3.5 h-3.5 text-teal-600" />}
            >
              Re-scan Matrix
            </Button>
            <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded text-[11px] font-mono">
              ADC RESOLUTION: <strong className="text-slate-900">16-BIT 1 MS/s</strong>
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-end gap-2 -mt-1">
          <Button
            size="sm"
            variant="outline"
            onClick={handleVerify}
            isLoading={isExecuting}
            leftIcon={<RefreshCw className="w-3.5 h-3.5 text-teal-600" />}
          >
            Re-scan Matrix
          </Button>
          <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded text-[11px] font-mono">
            ADC RESOLUTION: <strong className="text-slate-900">16-BIT 1 MS/s</strong>
          </span>
        </div>
      )}

      {/* Progress Bar when scanning */}
      {isExecuting && (
        <div className="bg-white border border-teal-200 rounded-md p-3 space-y-1.5 shadow-xs w-full min-w-0">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-teal-800 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-600 animate-ping" />
              {stageStatusMessage}
            </span>
            <span className="text-slate-600 font-semibold">{stageProgressPct}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-teal-600 h-full transition-all duration-300"
              style={{ width: `${stageProgressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Two-Panel Grid (matches Figma Screen 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 w-full min-w-0">
        {/* Left Panel: ESP32 CVU Controller (col-span-4) */}
        <div className="lg:col-span-4 min-w-0 bg-white border border-slate-200 rounded-md p-4 shadow-2xs space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-teal-600" />
                ESP32 CVU Controller
              </span>
              <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                ACTIVE LINK
              </span>
            </div>

            {/* Controller Silhouette / Schematic Box */}
            <div className="p-3 bg-slate-900 rounded-md text-white text-center">
              <div className="text-[10px] font-mono text-slate-400 mb-2 flex items-center justify-between">
                <span>MCU CORE</span>
                <span>COM3 @ 115200</span>
              </div>

              {/* Vector representation of controller board */}
              <div className="w-full h-24 bg-slate-800 border border-slate-700 rounded p-2 flex flex-col justify-between">
                <div className="flex justify-between items-center text-[9px] font-mono text-slate-400">
                  <span>L1  L2  L3  N</span>
                  <span className="text-teal-400 font-bold">ESP32-S3</span>
                  <span>GND  PE</span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-[9px] font-mono my-auto">
                  <div className="p-1 bg-slate-900 rounded border border-slate-700">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 mx-auto mb-1 animate-pulse" />
                    <span>PWR</span>
                  </div>
                  <div className="p-1 bg-slate-900 rounded border border-slate-700">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 mx-auto mb-1" />
                    <span>LINK</span>
                  </div>
                  <div className="p-1 bg-slate-900 rounded border border-slate-700">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 mx-auto mb-1 animate-pulse" />
                    <span>COM</span>
                  </div>
                  <div className="p-1 bg-slate-900 rounded border border-slate-700">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 mx-auto mb-1" />
                    <span>INTRLK</span>
                  </div>
                </div>

                <div className="text-[8px] font-mono text-slate-400 flex justify-between">
                  <span>C1  C2  C3</span>
                  <span className="text-emerald-400 font-semibold">GALVANIC ISOLATED</span>
                  <span>PT  AX</span>
                </div>
              </div>
            </div>

            {/* Hardware Status Rows (matches Figma) */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 uppercase text-[10px]">HARDWARE STATUS</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 uppercase text-[10px]">ASSIGNED PORT</span>
                <span className="font-bold text-slate-800">COM3 @ 115200 bps</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 uppercase text-[10px]">FIRMWARE CORE</span>
                <span className="font-bold text-slate-800">v2.4.1-RTOS (Build 8892)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 uppercase text-[10px]">DIAGNOSTIC PING</span>
                <span className="font-bold text-slate-800">4.2 ms (Jitter &lt; 0.3ms)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 uppercase text-[10px]">GALVANIC ISOLATION</span>
                <span className="font-bold text-teal-700">2.5 kV RMS Tested</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button size="sm" variant="outline" onClick={() => toast.info('Link Verified', 'COM3 link latency 4.2ms.')}>
              Re-verify Link
            </Button>
            <Button size="sm" variant="ghost" onClick={handleVerify} isLoading={isExecuting}>
              Scan Now
            </Button>
          </div>
        </div>

        {/* Right Panel: Verification Points (Terminal Continuity) (col-span-8) */}
        <div className="lg:col-span-8 min-w-0 bg-white border border-slate-200 rounded-md p-4 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono block">
                  Verification Points (Terminal Continuity)
                </span>
                <span className="text-[10px] font-mono text-slate-400">AUTOMATED MULTI-CHANNEL SENSING MATRIX</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded font-bold whitespace-nowrap">
                  ACTIVE CHANNELS: 6 / 6 OK
                </span>
                <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded whitespace-nowrap">
                  LOOP LATENCY: 12 ms
                </span>
              </div>
            </div>

            {/* Verification Table - only the table itself scrolls horizontally when needed */}
            <div className="w-full overflow-x-auto border border-slate-200 rounded min-w-0">
              <table className="w-full min-w-[540px] text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-mono text-[10px] uppercase">
                    <th className="py-2 px-3 whitespace-nowrap">SL. NO.</th>
                    <th className="py-2 px-3 whitespace-nowrap">TEST CHANNEL POINT</th>
                    <th className="py-2 px-3 whitespace-nowrap">EXPECTED RANGE</th>
                    <th className="py-2 px-3 whitespace-nowrap">MEASURED TELEMETRY</th>
                    <th className="py-2 px-3 whitespace-nowrap">DEVIATION</th>
                    <th className="py-2 px-3 text-right whitespace-nowrap">CHANNEL STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {cvuVerification.channels.map((ch, idx) => (
                    <tr key={ch.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 text-slate-400 font-bold whitespace-nowrap">
                        {String(idx + 1).padStart(2, '0')}
                      </td>
                      <td className="py-2.5 px-3 font-sans font-semibold text-slate-900 whitespace-nowrap">
                        {ch.name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                        {ch.expectedMin} – {ch.expectedMax} {ch.unit}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                        {ch.measuredValue} {ch.unit}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={clsx(
                            ch.deviationPct <= 0.5 ? 'text-emerald-700' : 'text-amber-700',
                            'font-semibold'
                          )}
                        >
                          {ch.deviationPct > 0 ? `+${ch.deviationPct}%` : `${ch.deviationPct}%`}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded text-[10px] font-bold">
                          <Check className="w-3 h-3 stroke-[3]" />
                          OK
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Contact Resistance Stability Graph (matches Figma) */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded min-w-0">
              <div className="flex flex-wrap items-center justify-between text-[11px] font-mono mb-1 gap-2">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5 whitespace-nowrap">
                  <Activity className="w-3.5 h-3.5 text-teal-600" />
                  Contact Resistance Stability
                </span>
                <span className="text-[10px] text-slate-500 whitespace-nowrap">
                  100-sample Rolling Moving Average: <strong className="text-slate-800 font-bold">0.284 mΩ ±0.002</strong>
                </span>
              </div>

              <div className="h-14 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stabilityChartData}>
                    <XAxis dataKey="s" hide />
                    <YAxis hide domain={[0.27, 0.30]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: '#f8fafc',
                        fontFamily: 'monospace',
                      }}
                      formatter={(val: any) => [`${val} mΩ`, 'Resistance']}
                    />
                    <Line
                      type="monotone"
                      dataKey="r"
                      stroke="#0d9488"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Validation Banner (matches Figma Screen 4) */}
      <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-md flex flex-wrap items-center justify-between gap-3 text-xs w-full min-w-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-emerald-950 font-mono">
                All selected connections are verified successfully.
              </span>
              <span className="text-[10px] font-mono bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded font-bold">
                SAFETY LOOP INTACT
              </span>
            </div>
            <p className="text-[11px] text-emerald-900/80 mt-0.5">
              Interlock relay closed. Pre-calibration circuit continuity confirmed with zero fault leakage. System cleared for high-current calibration.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-emerald-800 font-mono font-bold text-xs flex-shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>READY TO ADVANCE</span>
        </div>
      </div>
    </div>
  );
};
