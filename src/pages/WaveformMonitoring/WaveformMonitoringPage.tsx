import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTestStore } from '../../store/testStore';
import { LiveWaveformChart } from '../../components/charts/LiveWaveformChart';
import { generateRealisticMCBWaveform } from '../../utils/waveformGenerator';
import { formatCurrent, formatVoltage, formatJouleIntegral, formatTimeMs } from '../../utils/formatters';
import {
  Activity,
  Cpu,
  Zap,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Sliders,
  ShieldCheck,
  Radio,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  PlaySquare,
  Flame,
} from 'lucide-react';
import { clsx } from 'clsx';

export const WaveformMonitoringPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeWaveform, isExecuting, setActiveWaveform } = useTestStore();

  // Oscilloscope Hardware States
  const [timebase, setTimebase] = useState<string>('2.0 ms/div');
  const [samplingRate, setSamplingRate] = useState<string>('100 kS/s');
  const [triggerMode, setTriggerMode] = useState<'AUTO' | 'NORM' | 'SINGLE'>('NORM');
  const [triggerSource, setTriggerSource] = useState<'CH1' | 'CH2' | 'EXT_POW'>('CH1');
  const [triggerSlope, setTriggerSlope] = useState<'RISING' | 'FALLING'>('RISING');
  const [triggerLevelA, setTriggerLevelA] = useState<number>(250);
  const [bandwidthFilter, setBandwidthFilter] = useState<'FULL' | '20MHZ' | '10KHZ'>('FULL');
  const [ch1Scale, setCh1Scale] = useState<string>('1000 A/div');
  const [ch2Scale, setCh2Scale] = useState<string>('100 V/div');

  // Acquisition Operational State
  const [acqState, setAcqState] = useState<'ARMED' | 'ACQUIRING' | 'TRIGGERED' | 'STANDBY'>('ARMED');
  const [isLiveScanning, setIsLiveScanning] = useState<boolean>(true);

  // Live fluctuating telemetry values for high-speed realism
  const [telemetry, setTelemetry] = useState({
    vRms: 239.8,
    iRms: 15.8,
    freqHz: 50.01,
    powerFactor: 0.482,
    tempC: 23.6,
    airPressureBar: 6.2,
    bufferSamples: 245760,
  });

  // Simulated telemetry live heartbeat jitter
  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetry((prev) => ({
        vRms: Number((239.5 + Math.random() * 0.7).toFixed(1)),
        iRms: acqState === 'TRIGGERED' ? 3462 : Number((15.4 + Math.random() * 0.8).toFixed(1)),
        freqHz: Number((49.99 + Math.random() * 0.04).toFixed(2)),
        powerFactor: Number((0.480 + Math.random() * 0.006).toFixed(3)),
        tempC: Number((23.5 + Math.random() * 0.3).toFixed(1)),
        airPressureBar: Number((6.18 + Math.random() * 0.05).toFixed(2)),
        bufferSamples: prev.bufferSamples + 128,
      }));
    }, 800);
    return () => clearInterval(timer);
  }, [acqState]);

  // If no waveform active, provide realistic test stream
  const displayWaveform = activeWaveform || generateRealisticMCBWaveform({
    prospectiveCurrentA: 6000,
    systemVoltageV: 240,
    powerFactor: 0.48,
    ratedCurrentA: 16,
    simulateFailure: 'NONE',
  });

  // Action handlers
  const handleArmTrigger = () => {
    setAcqState('ARMED');
    setIsLiveScanning(true);
  };

  const handleForceTrigger = () => {
    setAcqState('TRIGGERED');
    setIsLiveScanning(false);
    const shot = generateRealisticMCBWaveform({
      prospectiveCurrentA: 6000,
      systemVoltageV: 240,
      powerFactor: 0.48,
      ratedCurrentA: 16,
      simulateFailure: 'NONE',
    });
    setActiveWaveform(shot);
  };

  const handleClearBuffer = () => {
    setAcqState('STANDBY');
    setIsLiveScanning(false);
    // Baseline zero waveform
    const baseWf = generateRealisticMCBWaveform({
      prospectiveCurrentA: 6000,
      systemVoltageV: 240,
      powerFactor: 0.48,
      ratedCurrentA: 16,
      simulateFailure: 'NONE',
    });
    setActiveWaveform({
      ...baseWf,
      peakCurrentA: 0,
      jouleIntegralA2s: 0,
      points: baseWf.points.map((p) => ({ ...p, currentA: 0, voltageV: 240 * Math.sin((p.timeMs * 2 * Math.PI * 50) / 1000) })),
    });
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* 1. Top Operational DAQ Status Strip */}
      <div className="bg-white border border-slate-200 rounded-md px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-2xs">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-teal-600 animate-pulse" />
            <span className="font-bold text-slate-800 tracking-wide uppercase">
              HIGH-SPEED DAQ MONITOR
            </span>
          </div>
          <span className="text-slate-300">|</span>
          <span className="text-slate-600">STREAM: <strong className="text-slate-800">100 kS/s REAL-TIME FIFO</strong></span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-600">BUFFER: <strong className="text-teal-700">{telemetry.bufferSamples.toLocaleString()} PTS</strong></span>
        </div>

        <div className="flex items-center gap-2">
          {acqState === 'ARMED' && (
            <span className="px-2.5 py-0.5 bg-amber-50 border border-amber-300 text-amber-800 font-bold rounded flex items-center gap-1.5 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              TRIGGER ARMED (POW 45°)
            </span>
          )}
          {acqState === 'ACQUIRING' && (
            <span className="px-2.5 py-0.5 bg-teal-50 border border-teal-300 text-teal-800 font-bold rounded flex items-center gap-1.5 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
              STREAMING LIVE
            </span>
          )}
          {acqState === 'TRIGGERED' && (
            <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold rounded flex items-center gap-1.5 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              SHOT CAPTURED (3.46 kA)
            </span>
          )}
          {acqState === 'STANDBY' && (
            <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-300 text-slate-600 font-bold rounded text-[11px]">
              STANDBY
            </span>
          )}

          <button
            onClick={() => navigate('/waveform-analysis')}
            className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold rounded transition-colors text-[11px] flex items-center gap-1.5 cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5 text-teal-600" />
            Switch to Analysis Workspace →
          </button>
        </div>
      </div>

      {/* 2. Real-Time Telemetry Bar (Live Instrumentation Readouts) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs font-mono">
        <div className="p-2.5 bg-white border border-slate-200 rounded shadow-2xs">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">BUS VOLTAGE (RMS)</div>
          <div className="text-base font-bold text-slate-900 mt-0.5">{telemetry.vRms} V</div>
          <div className="text-[9px] text-emerald-700 flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            50 Hz ± 0.05%
          </div>
        </div>

        <div className="p-2.5 bg-white border border-slate-200 rounded shadow-2xs">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">CIRCUIT CURRENT (RMS)</div>
          <div className="text-base font-bold text-teal-700 mt-0.5">{telemetry.iRms} A</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Rogowski CH1 Active</div>
        </div>

        <div className="p-2.5 bg-white border border-slate-200 rounded shadow-2xs">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">POWER FACTOR (cos φ)</div>
          <div className="text-base font-bold text-slate-900 mt-0.5">{telemetry.powerFactor}</div>
          <div className="text-[9px] text-teal-700 mt-0.5">IEC 60898 Table 17 OK</div>
        </div>

        <div className="p-2.5 bg-white border border-slate-200 rounded shadow-2xs">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">MAINS FREQUENCY</div>
          <div className="text-base font-bold text-slate-900 mt-0.5">{telemetry.freqHz} Hz</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Grid Synchronized</div>
        </div>

        <div className="p-2.5 bg-white border border-slate-200 rounded shadow-2xs">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">ENCLOSURE TEMP</div>
          <div className="text-base font-bold text-slate-900 mt-0.5">{telemetry.tempC} °C</div>
          <div className="text-[9px] text-emerald-700 mt-0.5">Within 25°C Reference</div>
        </div>

        <div className="p-2.5 bg-white border border-slate-200 rounded shadow-2xs">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">PNEUMATIC LINE</div>
          <div className="text-base font-bold text-slate-900 mt-0.5">{telemetry.airPressureBar} bar</div>
          <div className="text-[9px] text-emerald-700 mt-0.5">Contactor Pressure OK</div>
        </div>
      </div>

      {/* 3. Central Digital Storage Oscilloscope (DSO) Display */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-2xs space-y-3">
        {/* DSO Channel Status Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 bg-slate-100 border border-slate-200 rounded text-[11px] font-mono">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1.5 font-bold text-teal-800">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
              CH1: {ch1Scale} (DC 1MΩ) [CURRENT i(t)]
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1.5 font-bold text-sky-700">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
              CH2: {ch2Scale} (DC 1MΩ) [VOLTAGE u(t)]
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-600">
            <span>TB: <strong>{timebase}</strong></span>
            <span>•</span>
            <span>SR: <strong>{samplingRate}</strong></span>
            <span>•</span>
            <span>TRG: <strong>{triggerSource} &gt; {triggerLevelA}A ({triggerSlope})</strong></span>
          </div>
        </div>

        {/* Live DSO Canvas */}
        <div className="border border-slate-200 rounded bg-white p-2">
          <LiveWaveformChart
            waveform={displayWaveform}
            isStreaming={isLiveScanning}
            height={400}
          />
        </div>

        {/* Live Instantaneous Measurement Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono pt-1">
          <div className="p-2 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
            <span className="text-slate-500 text-[10px]">PEAK CURRENT CUT-OFF (Ip):</span>
            <span className="font-bold text-slate-900">{formatCurrent(displayWaveform.peakCurrentA)}</span>
          </div>
          <div className="p-2 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
            <span className="text-slate-500 text-[10px]">JOULE INTEGRAL (I²t):</span>
            <span className="font-bold text-teal-700">{formatJouleIntegral(displayWaveform.jouleIntegralA2s)}</span>
          </div>
          <div className="p-2 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
            <span className="text-slate-500 text-[10px]">TOTAL BREAK TIME:</span>
            <span className="font-bold text-slate-900">{formatTimeMs(displayWaveform.totalInterruptionTimeMs)}</span>
          </div>
          <div className="p-2 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
            <span className="text-slate-500 text-[10px]">RECOVERY VOLTAGE (Ur):</span>
            <span className="font-bold text-slate-900">{formatVoltage(displayWaveform.recoveryVoltageV)}</span>
          </div>
        </div>
      </div>

      {/* 4. Front-Panel Oscilloscope Hardware Controls (3 Dedicated Control Modules) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Module A: Horizontal & Timebase */}
        <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-2xs space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="font-bold text-slate-800 uppercase text-[11px] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              1. HORIZONTAL & TIMEBASE
            </span>
            <span className="text-[10px] text-slate-400">CLK: 10 MHz</span>
          </div>

          <div>
            <label className="block text-[10px] text-slate-500 uppercase mb-1">Timebase (Scale / Div)</label>
            <div className="grid grid-cols-3 gap-1.5">
              {['0.5 ms/div', '1.0 ms/div', '2.0 ms/div', '5.0 ms/div', '10.0 ms/div', '20.0 ms/div'].map((tb) => (
                <button
                  key={tb}
                  onClick={() => setTimebase(tb)}
                  className={clsx(
                    'py-1 text-center rounded border text-[11px] font-bold cursor-pointer transition-colors',
                    timebase === tb
                      ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  )}
                >
                  {tb.replace('/div', '')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-slate-500 uppercase mb-1">DAQ Sampling Frequency</label>
            <select
              value={samplingRate}
              onChange={(e) => setSamplingRate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:border-teal-500 focus:outline-hidden"
            >
              <option value="50 kS/s">50 kS/s (20 µs resolution)</option>
              <option value="100 kS/s">100 kS/s (10 µs standard)</option>
              <option value="250 kS/s">250 kS/s (4 µs high res)</option>
              <option value="1 MS/s">1.0 MS/s (1 µs transient)</option>
            </select>
          </div>

          <div className="pt-1 text-[10px] text-slate-500 flex justify-between">
            <span>Pre-Trigger Buffer: <strong>20% (8.0 ms)</strong></span>
            <span>Record Length: <strong>4,000 pts</strong></span>
          </div>
        </div>

        {/* Module B: Vertical Channels & Scales */}
        <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-2xs space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="font-bold text-slate-800 uppercase text-[11px] flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-teal-600" />
              2. VERTICAL CHANNELS
            </span>
            <span className="text-[10px] text-slate-400">16-BIT ADC</span>
          </div>

          <div>
            <label className="block text-[10px] text-slate-500 uppercase mb-1">
              CH1 Current Scale (Rogowski)
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {['500 A/div', '1000 A/div', '2000 A/div'].map((sc) => (
                <button
                  key={sc}
                  onClick={() => setCh1Scale(sc)}
                  className={clsx(
                    'py-1 text-center rounded border text-[11px] font-bold cursor-pointer transition-colors',
                    ch1Scale === sc
                      ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  )}
                >
                  {sc}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-slate-500 uppercase mb-1">
              CH2 Voltage Scale (Differential)
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {['50 V/div', '100 V/div', '200 V/div'].map((sc) => (
                <button
                  key={sc}
                  onClick={() => setCh2Scale(sc)}
                  className={clsx(
                    'py-1 text-center rounded border text-[11px] font-bold cursor-pointer transition-colors',
                    ch2Scale === sc
                      ? 'bg-sky-700 text-white border-sky-700 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  )}
                >
                  {sc}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-slate-500 uppercase mb-1">Bandwidth Limit Filter</label>
            <div className="flex gap-1.5">
              {(['FULL', '20MHZ', '10KHZ'] as const).map((bw) => (
                <button
                  key={bw}
                  onClick={() => setBandwidthFilter(bw)}
                  className={clsx(
                    'flex-1 py-1 text-center rounded border text-[10px] font-bold cursor-pointer transition-colors',
                    bandwidthFilter === bw
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  )}
                >
                  {bw === 'FULL' ? '100 kHz Full' : bw === '20MHZ' ? '20 MHz' : '10 kHz AA'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Module C: Trigger Engine & Front-Panel Arming */}
        <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-2xs space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="font-bold text-slate-800 uppercase text-[11px] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-teal-600" />
              3. TRIGGER & ACQUISITION
            </span>
            <span className="text-[10px] text-teal-700 font-bold">POW SYNC</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-slate-500 uppercase mb-1">Trigger Mode</label>
              <div className="flex gap-1">
                {(['AUTO', 'NORM', 'SINGLE'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setTriggerMode(m)}
                    className={clsx(
                      'flex-1 py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer',
                      triggerMode === m
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 uppercase mb-1">Source</label>
              <select
                value={triggerSource}
                onChange={(e) => setTriggerSource(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-[11px] text-slate-800 font-mono focus:border-teal-500 focus:outline-hidden"
              >
                <option value="CH1">CH1 (Current)</option>
                <option value="CH2">CH2 (Voltage)</option>
                <option value="EXT_POW">POW Opto Sync</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[10px] text-slate-500 uppercase mb-1">
              <span>Trigger Level: <strong>{triggerLevelA} A</strong></span>
              <button
                onClick={() => setTriggerSlope(triggerSlope === 'RISING' ? 'FALLING' : 'RISING')}
                className="text-teal-700 font-bold hover:underline"
              >
                Slope: {triggerSlope}
              </button>
            </div>
            <input
              type="range"
              min="50"
              max="2000"
              step="50"
              value={triggerLevelA}
              onChange={(e) => setTriggerLevelA(Number(e.target.value))}
              className="w-full accent-teal-600 cursor-pointer"
            />
          </div>

          {/* Action Button Strip */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleArmTrigger}
              className="py-2 px-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs"
            >
              <Play className="w-3.5 h-3.5" />
              <span>ARM TRIGGER</span>
            </button>

            <button
              onClick={handleForceTrigger}
              className="py-2 px-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>FORCE SHOT</span>
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleClearBuffer}
              className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold rounded text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3 h-3 text-slate-500" />
              <span>CLEAR FIFO BUFFER</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
