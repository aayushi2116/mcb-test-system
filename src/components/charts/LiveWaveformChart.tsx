import React, { useState, useEffect, useMemo } from 'react';
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
} from 'recharts';
import { WaveformCapture, WaveformPoint } from '../../types/waveform';
import { Button } from '../common/Button';
import { Play, Pause, RotateCcw, ZoomIn, Eye, Activity } from 'lucide-react';
import { formatCurrent, formatVoltage } from '../../utils/formatters';

interface LiveWaveformChartProps {
  waveform: WaveformCapture | null;
  isStreaming?: boolean;
  height?: number;
}

export const LiveWaveformChart: React.FC<LiveWaveformChartProps> = ({
  waveform,
  isStreaming = false,
  height = 360,
}) => {
  const [streamIndex, setStreamIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showVoltage, setShowVoltage] = useState<boolean>(true);
  const [showCurrent, setShowCurrent] = useState<boolean>(true);

  // If streaming during live test
  useEffect(() => {
    if (!waveform || !isStreaming || isPaused) return;

    setStreamIndex(0);
    const total = waveform.points.length;
    const stepSize = Math.max(1, Math.floor(total / 30));

    const interval = setInterval(() => {
      setStreamIndex((prev) => {
        if (prev + stepSize >= total) {
          clearInterval(interval);
          return total;
        }
        return prev + stepSize;
      });
    }, 40);

    return () => clearInterval(interval);
  }, [waveform, isStreaming, isPaused]);

  // Points to render
  const renderedPoints = useMemo(() => {
    if (!waveform) return [];
    if (!isStreaming) return waveform.points;
    return waveform.points.slice(0, Math.max(10, streamIndex));
  }, [waveform, isStreaming, streamIndex]);

  if (!waveform || renderedPoints.length === 0) {
    return (
      <div
        className="w-full flex flex-col items-center justify-center bg-slate-50 border border-dashed border-slate-300 rounded-lg text-slate-400 p-8"
        style={{ height }}
      >
        <Activity className="w-8 h-8 text-slate-300 mb-2 animate-pulse" />
        <p className="text-sm font-medium">Waveform Acquisition Standby</p>
        <p className="text-xs text-slate-400 mt-1">
          Trigger a test or select a historical record to inspect high-speed oscilloscope telemetry.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col">
      {/* Chart toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 bg-slate-50 p-2.5 rounded-md border border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">Display Traces:</span>
          <button
            onClick={() => setShowCurrent(!showCurrent)}
            className={`px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${
              showCurrent
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-white text-slate-400 border-slate-200'
            }`}
          >
            ● Current (i)
          </button>
          <button
            onClick={() => setShowVoltage(!showVoltage)}
            className={`px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${
              showVoltage
                ? 'bg-sky-50 text-sky-700 border-sky-200'
                : 'bg-white text-slate-400 border-slate-200'
            }`}
          >
            ● Voltage (u)
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-600">
          <div>
            <span className="text-slate-400">Peak Ip:</span>{' '}
            <strong className="text-red-600">{formatCurrent(waveform.peakCurrentA)}</strong>
          </div>
          <div>
            <span className="text-slate-400">Total Duration:</span>{' '}
            <strong>{waveform.totalInterruptionTimeMs.toFixed(1)} ms</strong>
          </div>
          <div>
            <span className="text-slate-400">Sampling:</span>{' '}
            <strong>{waveform.sampleRateKhz} kS/s</strong>
          </div>
        </div>

        {isStreaming && (
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsPaused(!isPaused)}
              leftIcon={isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            >
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setStreamIndex(0)}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Replay
            </Button>
          </div>
        )}
      </div>

      {/* Recharts LineChart */}
      <div className="w-full bg-white rounded-md border border-slate-200 p-2" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={renderedPoints} margin={{ top: 15, right: 30, left: 15, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="timeMs"
              unit="ms"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              label={{ value: 'Time (milliseconds)', position: 'insideBottom', offset: -12, fontSize: 11, fill: '#64748b' }}
            />
            
            {/* Left Y-Axis: Current in Amperes */}
            <YAxis
              yAxisId="left"
              orientation="left"
              stroke="#dc2626"
              fontSize={11}
              tickLine={false}
              tickFormatter={(val) => formatCurrent(val, 1)}
              label={{ value: 'Current (A)', angle: -90, position: 'insideLeft', offset: -5, fontSize: 11, fill: '#dc2626' }}
            />

            {/* Right Y-Axis: Voltage in Volts */}
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#0284c7"
              fontSize={11}
              tickLine={false}
              tickFormatter={(val) => `${val}V`}
              label={{ value: 'Voltage (V)', angle: 90, position: 'insideRight', offset: 5, fontSize: 11, fill: '#0284c7' }}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-slate-900/90 backdrop-blur-sm text-white p-3 rounded-lg shadow-xl text-xs font-mono border border-slate-700">
                      <p className="text-teal-400 font-bold border-b border-slate-700 pb-1 mb-1">
                        Time: {label} ms
                      </p>
                      {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-4 py-0.5">
                          <span style={{ color: entry.color }}>{entry.name}:</span>
                          <span className="font-bold">
                            {entry.dataKey === 'currentA'
                              ? formatCurrent(entry.value, 1)
                              : formatVoltage(entry.value, 1)}
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

            {/* Reference markers */}
            <ReferenceLine
              yAxisId="left"
              x={waveform.triggerTimeMs}
              stroke="#0284c7"
              strokeDasharray="4 4"
              label={{ value: 'Trigger', fill: '#0284c7', fontSize: 10, position: 'insideTopLeft' }}
            />
            <ReferenceLine
              yAxisId="left"
              x={waveform.arcExtinctionTimeMs}
              stroke="#16a34a"
              strokeDasharray="4 4"
              label={{ value: 'Extinction', fill: '#16a34a', fontSize: 10, position: 'insideTopRight' }}
            />

            {showCurrent && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="currentA"
                name="Test Current (A)"
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
                name="Terminal Voltage (V)"
                stroke="#0284c7"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
