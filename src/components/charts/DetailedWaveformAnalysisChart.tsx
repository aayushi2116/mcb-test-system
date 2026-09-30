import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import { WaveformCapture } from '../../types/waveform';
import { formatCurrent, formatVoltage, formatJouleIntegral, formatTimeMs } from '../../utils/formatters';
import { Badge } from '../common/Badge';
import { Layers, ZoomIn, ZoomOut, Zap, Flame, Clock } from 'lucide-react';
import { Button } from '../common/Button';

interface DetailedWaveformProps {
  waveform: WaveformCapture;
  height?: number;
}

export const DetailedWaveformAnalysisChart: React.FC<DetailedWaveformProps> = ({
  waveform,
  height = 420,
}) => {
  const [showCurrent, setShowCurrent] = useState(true);
  const [showVoltage, setShowVoltage] = useState(true);
  const [showArcVoltage, setShowArcVoltage] = useState(true);
  const [showTripSignal, setShowTripSignal] = useState(false);
  const [zoomRange, setZoomRange] = useState<'ALL' | 'ARC_ZONE' | 'PRE_POST'>('ALL');

  const filteredPoints = React.useMemo(() => {
    if (zoomRange === 'ARC_ZONE') {
      return waveform.points.filter(
        (p) => p.timeMs >= waveform.triggerTimeMs - 2 && p.timeMs <= waveform.arcExtinctionTimeMs + 4
      );
    }
    if (zoomRange === 'PRE_POST') {
      return waveform.points.filter(
        (p) => p.timeMs <= waveform.triggerTimeMs + 1 || p.timeMs >= waveform.arcExtinctionTimeMs
      );
    }
    return waveform.points;
  }, [waveform, zoomRange]);

  return (
    <div className="flex flex-col gap-4">
      {/* Top Controls & Quantities Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-4">
        {/* Trace Visibility Toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-700">Traces:</span>
          <button
            onClick={() => setShowCurrent(!showCurrent)}
            className={`px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${
              showCurrent
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-white text-slate-400 border-slate-200'
            }`}
          >
            ● Short-Circuit Current i(t)
          </button>
          <button
            onClick={() => setShowVoltage(!showVoltage)}
            className={`px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${
              showVoltage
                ? 'bg-sky-50 text-sky-700 border-sky-200'
                : 'bg-white text-slate-400 border-slate-200'
            }`}
          >
            ● Supply Voltage u(t)
          </button>
          <button
            onClick={() => setShowArcVoltage(!showArcVoltage)}
            className={`px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${
              showArcVoltage
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-white text-slate-400 border-slate-200'
            }`}
          >
            ● Arc Voltage u_arc(t)
          </button>
        </div>

        {/* Zoom Window Presets */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">Zoom Window:</span>
          <div className="inline-flex rounded-md shadow-xs" role="group">
            <button
              onClick={() => setZoomRange('ALL')}
              className={`px-2.5 py-1 text-xs font-medium border rounded-l-md ${
                zoomRange === 'ALL'
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Full Span (40ms)
            </button>
            <button
              onClick={() => setZoomRange('ARC_ZONE')}
              className={`px-2.5 py-1 text-xs font-medium border-t border-b ${
                zoomRange === 'ARC_ZONE'
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Arc Interruption Region
            </button>
            <button
              onClick={() => setZoomRange('PRE_POST')}
              className={`px-2.5 py-1 text-xs font-medium border rounded-r-md ${
                zoomRange === 'PRE_POST'
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Recovery TRV
            </button>
          </div>
        </div>
      </div>

      {/* Main Chart Container */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filteredPoints} margin={{ top: 20, right: 35, left: 15, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            
            <XAxis
              dataKey="timeMs"
              unit="ms"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              label={{
                value: 'Time from Sequence Arming (milliseconds)',
                position: 'insideBottom',
                offset: -15,
                fontSize: 11,
                fill: '#64748b',
              }}
            />

            {/* Current Axis (Left) */}
            <YAxis
              yAxisId="left"
              orientation="left"
              stroke="#dc2626"
              fontSize={11}
              tickLine={false}
              tickFormatter={(val) => formatCurrent(val, 1)}
              label={{
                value: 'Instantaneous Current i(t) [A]',
                angle: -90,
                position: 'insideLeft',
                offset: -5,
                fontSize: 11,
                fill: '#dc2626',
              }}
            />

            {/* Voltage Axis (Right) */}
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#0284c7"
              fontSize={11}
              tickLine={false}
              tickFormatter={(val) => `${val}V`}
              label={{
                value: 'Voltage Across MCB u(t) [V]',
                angle: 90,
                position: 'insideRight',
                offset: 5,
                fontSize: 11,
                fill: '#0284c7',
              }}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-slate-900/95 text-white p-3 rounded-md shadow-xl text-xs font-mono border border-slate-700 min-w-52">
                      <div className="text-teal-400 font-bold border-b border-slate-700 pb-1 mb-1.5 flex justify-between">
                        <span>t = {label} ms</span>
                        <span>
                          {Number(label) >= waveform.arcInceptionTimeMs && Number(label) <= waveform.arcExtinctionTimeMs
                            ? '⚡ ARC ACTIVE'
                            : Number(label) > waveform.arcExtinctionTimeMs
                            ? '✓ INTERRUPTED'
                            : 'ARMED'}
                        </span>
                      </div>
                      {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-3 py-0.5">
                          <span style={{ color: entry.color }}>{entry.name}:</span>
                          <span className="font-bold">
                            {entry.dataKey === 'currentA'
                              ? formatCurrent(entry.value, 1)
                              : `${entry.value} V`}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />

            <Legend verticalAlign="top" height={36} iconType="plainline" />

            {/* Shaded Area for Arc Duration Period */}
            <ReferenceArea
              yAxisId="left"
              x1={waveform.arcInceptionTimeMs}
              x2={waveform.arcExtinctionTimeMs}
              strokeOpacity={0.2}
              fill="#f59e0b"
              fillOpacity={0.12}
            />

            {/* Key Marker 1: Trigger Closing */}
            <ReferenceLine
              yAxisId="left"
              x={waveform.triggerTimeMs}
              stroke="#0284c7"
              strokeDasharray="3 3"
              strokeWidth={1.5}
              label={{
                value: `Trigger: ${waveform.triggerTimeMs}ms`,
                fill: '#0284c7',
                fontSize: 10,
                position: 'top',
              }}
            />

            {/* Key Marker 2: Contact Separation / Arc Inception */}
            <ReferenceLine
              yAxisId="left"
              x={waveform.contactSeparationTimeMs}
              stroke="#d97706"
              strokeDasharray="3 3"
              strokeWidth={1.5}
              label={{
                value: `Contact Lift: ${waveform.contactSeparationTimeMs.toFixed(1)}ms`,
                fill: '#d97706',
                fontSize: 10,
                position: 'insideTopLeft',
              }}
            />

            {/* Key Marker 3: Peak Current Cut-off Ip */}
            <ReferenceLine
              yAxisId="left"
              x={waveform.peakCurrentTimeMs}
              stroke="#dc2626"
              strokeDasharray="3 3"
              strokeWidth={1.5}
              label={{
                value: `Ip = ${formatCurrent(waveform.peakCurrentA)}`,
                fill: '#dc2626',
                fontSize: 10,
                position: 'insideTopRight',
              }}
            />

            {/* Key Marker 4: Final Arc Extinction */}
            <ReferenceLine
              yAxisId="left"
              x={waveform.arcExtinctionTimeMs}
              stroke="#16a34a"
              strokeDasharray="3 3"
              strokeWidth={1.5}
              label={{
                value: `Extinction: ${waveform.arcExtinctionTimeMs.toFixed(1)}ms`,
                fill: '#16a34a',
                fontSize: 10,
                position: 'top',
              }}
            />

            {showCurrent && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="currentA"
                name="Current i(t)"
                stroke="#dc2626"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            )}

            {showVoltage && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="voltageV"
                name="Voltage u(t)"
                stroke="#0284c7"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            )}

            {showArcVoltage && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="arcVoltageV"
                name="Arc Voltage u_arc"
                stroke="#d97706"
                strokeWidth={1.5}
                strokeDasharray="5 5"
                dot={false}
                isAnimationActive={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Physics & Physical Quantities Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
          <div className="text-[10px] uppercase font-bold text-slate-500">Peak Current (Ip)</div>
          <div className="text-base font-mono font-bold text-red-600 mt-1">
            {formatCurrent(waveform.peakCurrentA)}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">at {waveform.peakCurrentTimeMs.toFixed(2)} ms</div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
          <div className="text-[10px] uppercase font-bold text-slate-500">Joule Integral (I²t)</div>
          <div className="text-base font-mono font-bold text-slate-900 mt-1">
            {formatJouleIntegral(waveform.jouleIntegralA2s)}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">Let-through Energy</div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
          <div className="text-[10px] uppercase font-bold text-slate-500">Total Interruption</div>
          <div className="text-base font-mono font-bold text-slate-900 mt-1">
            {waveform.totalInterruptionTimeMs.toFixed(1)} ms
          </div>
          <div className="text-[10px] text-slate-400 font-mono">From make-switch</div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
          <div className="text-[10px] uppercase font-bold text-slate-500">Arc Duration</div>
          <div className="text-base font-mono font-bold text-amber-700 mt-1">
            {waveform.arcDurationMs.toFixed(1)} ms
          </div>
          <div className="text-[10px] text-slate-400 font-mono">Chamber quenching</div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
          <div className="text-[10px] uppercase font-bold text-slate-500">Recovery Voltage</div>
          <div className="text-base font-mono font-bold text-emerald-700 mt-1">
            {formatVoltage(waveform.recoveryVoltageV)}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">RMS power-frequency</div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
          <div className="text-[10px] uppercase font-bold text-slate-500">Arc Energy (E_arc)</div>
          <div className="text-base font-mono font-bold text-slate-900 mt-1">
            {waveform.arcEnergyJ.toFixed(0)} J
          </div>
          <div className="text-[10px] text-slate-400 font-mono">∫ u(t) · i(t) dt</div>
        </div>
      </div>
    </div>
  );
};
