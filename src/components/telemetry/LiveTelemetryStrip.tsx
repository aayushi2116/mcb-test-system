import React from 'react';
import { useSystemStore } from '../../store/systemStore';
import { formatCurrent, formatVoltage } from '../../utils/formatters';
import { Activity, Gauge, Flame, Wind, Radio, Zap } from 'lucide-react';
import { clsx } from 'clsx';

export const LiveTelemetryStrip: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { telemetry, hardwareStatus } = useSystemStore();

  const isTesting = hardwareStatus.systemMode === 'TESTING';

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Activity className={clsx('w-4 h-4', isTesting ? 'text-red-600 animate-pulse' : 'text-teal-600')} />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            Real-Time Instrumentation Telemetry
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          DAQ 100 kS/s ACTIVE
        </div>
      </div>

      <div className={clsx('grid gap-3', compact ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-7')}>
        {/* Voltage RMS */}
        <div className="bg-slate-50 p-2.5 rounded-md border border-slate-200">
          <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center justify-between">
            <span>Source RMS</span>
            <Radio className="w-3 h-3 text-slate-400" />
          </div>
          <div className="text-lg font-mono font-bold text-slate-900 mt-1">
            {formatVoltage(telemetry.voltageRmsV)}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">Nominal 240 V</div>
        </div>

        {/* Current RMS */}
        <div className="bg-slate-50 p-2.5 rounded-md border border-slate-200">
          <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center justify-between">
            <span>Current RMS</span>
            <Zap className="w-3 h-3 text-slate-400" />
          </div>
          <div className={clsx('text-lg font-mono font-bold mt-1', isTesting ? 'text-red-600 animate-pulse' : 'text-slate-900')}>
            {formatCurrent(telemetry.currentRmsA)}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">Rogowski Sensor</div>
        </div>

        {/* Power Factor */}
        <div className="bg-slate-50 p-2.5 rounded-md border border-slate-200">
          <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center justify-between">
            <span>cos φ</span>
            <Activity className="w-3 h-3 text-slate-400" />
          </div>
          <div className="text-lg font-mono font-bold text-slate-900 mt-1">
            {telemetry.powerFactor.toFixed(3)}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">Target R-L Match</div>
        </div>

        {/* Frequency */}
        <div className="bg-slate-50 p-2.5 rounded-md border border-slate-200">
          <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center justify-between">
            <span>Frequency</span>
            <Radio className="w-3 h-3 text-slate-400" />
          </div>
          <div className="text-lg font-mono font-bold text-slate-900 mt-1">
            {telemetry.frequencyHz.toFixed(2)} Hz
          </div>
          <div className="text-[10px] text-slate-400 font-mono">Grid Locked</div>
        </div>

        {/* Transformer Temp */}
        <div className="bg-slate-50 p-2.5 rounded-md border border-slate-200">
          <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center justify-between">
            <span>Xformer Temp</span>
            <Flame className="w-3 h-3 text-amber-500" />
          </div>
          <div className="text-lg font-mono font-bold text-slate-900 mt-1">
            {telemetry.temperatureTransformerC.toFixed(1)} °C
          </div>
          <div className="text-[10px] text-slate-400 font-mono">Limit &lt; 75 °C</div>
        </div>

        {/* Arc Pressure */}
        <div className="bg-slate-50 p-2.5 rounded-md border border-slate-200">
          <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center justify-between">
            <span>Chamber Pressure</span>
            <Gauge className="w-3 h-3 text-slate-400" />
          </div>
          <div className="text-lg font-mono font-bold text-slate-900 mt-1">
            {telemetry.arcPressureBar.toFixed(2)} bar
          </div>
          <div className="text-[10px] text-slate-400 font-mono">Piezo Transducer</div>
        </div>

        {/* Pneumatic Clamp */}
        <div className="bg-slate-50 p-2.5 rounded-md border border-slate-200">
          <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center justify-between">
            <span>Pneumatic Clamp</span>
            <Wind className="w-3 h-3 text-teal-600" />
          </div>
          <div className={clsx('text-lg font-mono font-bold mt-1', hardwareStatus.clampEngaged ? 'text-emerald-700' : 'text-amber-700')}>
            {telemetry.pneumaticClampPressureBar.toFixed(1)} bar
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            {hardwareStatus.clampEngaged ? 'CLAMPED (6.0 bar)' : 'UNCLAMPED'}
          </div>
        </div>
      </div>
    </div>
  );
};
