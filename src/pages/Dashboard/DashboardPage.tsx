import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSystemStore } from '../../store/systemStore';
import { useAuthStore } from '../../store/authStore';
import { useTestStore } from '../../store/testStore';
import { MOCK_OPERATORS } from '../../data/mockOperators';
import {
  PlaySquare,
  History,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Activity,
  ArrowRight,
  Sliders,
  Cpu,
  Layers,
  FileText,
  Lock,
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

// Sample calibration impulse reference waveform for the preview widget
const referenceImpulseData = [
  { t: 0, i: 0 },
  { t: 2, i: 1.2 },
  { t: 4, i: 3.8 },
  { t: 6, i: 6.9 },
  { t: 8, i: 7.42 }, // Peak cut-off
  { t: 10, i: 5.8 },
  { t: 12, i: 3.2 },
  { t: 14, i: 1.1 },
  { t: 16, i: 0 },
  { t: 18, i: 0 },
  { t: 20, i: 0 },
];

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentOperator, setOperator } = useAuthStore();
  const { hardwareStatus } = useSystemStore();
  const { resetToNewTest } = useTestStore();

  const [operatorMode, setOperatorMode] = useState<'OPERATOR' | 'CERTIFIER'>('OPERATOR');
  const [selectedStation, setSelectedStation] = useState<string>('Station 02 - High-Current Rig');

  const handleStartNewTest = () => {
    resetToNewTest();
    navigate('/new-test');
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Top Station Status Banner (matches Figma) */}
      <div className="bg-white border border-slate-200 rounded-md px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-2xs">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            LAB STATION ONLINE
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-700 font-semibold">RIG ID: HC-LAB-04B</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-600">POWER BUS: 415V 3-PHASE 50Hz</span>
        </div>
        <div className="flex items-center gap-3 text-slate-500">
          <span>ENV: 23.4°C / 46% RH</span>
          <span className="text-slate-300">|</span>
          <span className="px-2 py-0.5 bg-teal-50 border border-teal-200 text-teal-800 rounded font-semibold text-[10px]">
            NABL ACCREDITED
          </span>
        </div>
      </div>

      {/* Main Mission Control Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Mission Control & Operator Session Authorization */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-md p-5 shadow-2xs flex flex-col justify-between">
          <div>
            {/* Header sub-label */}
            <div className="flex items-center gap-2 text-[10px] font-mono text-teal-700 font-bold uppercase tracking-wider mb-1">
              <span>MISSION CONTROL</span>
              <span>•</span>
              <span>STAGE #01</span>
              <span>•</span>
              <span className="text-slate-400">V2.4-RELEASE</span>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
              Automated MCB Short-Circuit Test System
            </h1>

            {/* Description */}
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Deterministic laboratory execution engine designed for strict IEC 60898-1:2015 breaking capacity verification, synthetic point-on-wave synchronism, and precision arc energy capture.
            </p>

            {/* 4 Feature Badges (matches Figma) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-4">
              <div className="p-2 bg-slate-50 border border-slate-200 rounded text-center">
                <div className="text-[10px] font-mono font-bold text-slate-900 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-teal-600" />
                  AUTOMATED
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">Sequencer & contactors</div>
              </div>

              <div className="p-2 bg-slate-50 border border-slate-200 rounded text-center">
                <div className="text-[10px] font-mono font-bold text-slate-900 flex items-center justify-center gap-1">
                  <Activity className="w-3 h-3 text-teal-600" />
                  ACCURATE
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">Class 0.2 Rogowski & DAQ</div>
              </div>

              <div className="p-2 bg-slate-50 border border-slate-200 rounded text-center">
                <div className="text-[10px] font-mono font-bold text-slate-900 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-teal-600" />
                  SAFE
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">Pneumatic SIL-3 loop</div>
              </div>

              <div className="p-2 bg-slate-50 border border-slate-200 rounded text-center">
                <div className="text-[10px] font-mono font-bold text-slate-900 flex items-center justify-center gap-1">
                  <FileText className="w-3 h-3 text-teal-600" />
                  TRACEABLE
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">SQLite & IEC PDF cert</div>
              </div>
            </div>

            {/* Operator Session Authorization Box (matches Figma) */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Operator Session Authorization
                  </span>
                </div>
                {/* Role Switcher Pills */}
                <div className="flex bg-slate-200 p-0.5 rounded text-[10px] font-mono">
                  <button
                    type="button"
                    onClick={() => setOperatorMode('OPERATOR')}
                    className={clsx(
                      'px-2.5 py-0.5 rounded transition-all cursor-pointer font-bold',
                      operatorMode === 'OPERATOR'
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    OPERATOR
                  </button>
                  <button
                    type="button"
                    onClick={() => setOperatorMode('CERTIFIER')}
                    className={clsx(
                      'px-2.5 py-0.5 rounded transition-all cursor-pointer font-bold',
                      operatorMode === 'CERTIFIER'
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    CERTIFIER / ADMIN
                  </button>
                </div>
              </div>

              {/* Form Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">
                    Active Operator Credential
                  </label>
                  <select
                    value={currentOperator?.id}
                    onChange={(e) => {
                      const op = MOCK_OPERATORS.find((o) => o.id === e.target.value);
                      if (op) setOperator(op);
                    }}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:border-teal-500 focus:outline-hidden"
                  >
                    {MOCK_OPERATORS.map((op) => (
                      <option key={op.id} value={op.id}>
                        {op.badgeNumber} ({op.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">
                    Test Bay Assignment
                  </label>
                  <select
                    value={selectedStation}
                    onChange={(e) => setSelectedStation(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:border-teal-500 focus:outline-hidden"
                  >
                    <option value="Station 02 - High-Current Rig">Station 02 - High-Current Rig</option>
                    <option value="Station 04 - Universal Bench">Station 04 - Universal Bench</option>
                    <option value="Station 06 - Endurance Cell">Station 06 - Endurance Cell</option>
                  </select>
                </div>
              </div>

              {/* Normative Reference Strip */}
              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] font-mono text-slate-600">
                <div>
                  <span className="text-slate-400">STANDARD: </span>
                  <span className="font-semibold text-slate-800">IEC 60898-1</span>
                </div>
                <div>
                  <span className="text-slate-400">MAX CURRENT (ICN): </span>
                  <span className="font-semibold text-slate-800">10.0 kA</span>
                </div>
                <div>
                  <span className="text-slate-400">INTERLOCK PROTOCOL: </span>
                  <span className="font-semibold text-emerald-700">SIL 3 Dual</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button Row */}
          <div className="flex items-center gap-3 pt-5">
            <button
              onClick={handleStartNewTest}
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-mono font-bold text-xs py-2.5 px-4 rounded shadow-xs transition-transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>START NEW TEST</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate('/test-history')}
              className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-mono font-bold text-xs py-2.5 px-4 rounded transition-colors flex items-center gap-2 cursor-pointer"
            >
              <History className="w-4 h-4 text-slate-500" />
              <span>OPEN TEST HISTORY</span>
            </button>
          </div>
        </div>

        {/* Right Column: Lab Station Photography & Waveform Reference Widget */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-md p-4 shadow-2xs flex flex-col justify-between">
          <div>
            {/* Bench Readiness & Metrology State Panel (Clean Light Industrial Theme) */}
            <div className="bg-slate-50 border border-slate-200 rounded-md p-3.5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-teal-600" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide font-mono">
                    Bench Readiness & Metrology State
                  </span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded text-[10px] font-mono font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  CALIBRATED & READY
                </span>
              </div>

              {/* 4 Light-Theme Metrological Specification Cards */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 bg-white border border-slate-200 rounded">
                  <div className="text-[10px] text-slate-400 uppercase">Max Test Capacity</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">10.0 kA <span className="text-xs font-normal text-slate-500">/ 415 VAC</span></div>
                  <div className="text-[9px] text-teal-700 mt-0.5">IEC 60898-1 Table 17</div>
                </div>

                <div className="p-2.5 bg-white border border-slate-200 rounded">
                  <div className="text-[10px] text-slate-400 uppercase">POW Synchronism</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">±1.0° <span className="text-xs font-normal text-slate-500">POW Sync</span></div>
                  <div className="text-[9px] text-emerald-700 mt-0.5">Solid-State Thyristor Gate</div>
                </div>

                <div className="p-2.5 bg-white border border-slate-200 rounded">
                  <div className="text-[10px] text-slate-400 uppercase">Power Factor Control</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">cos φ 0.20 – 0.95</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">Switched R-L Matrix Banks</div>
                </div>

                <div className="p-2.5 bg-white border border-slate-200 rounded">
                  <div className="text-[10px] text-slate-400 uppercase">DAQ Sampling Core</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">1.0 MS/s <span className="text-xs font-normal text-slate-500">16-Bit</span></div>
                  <div className="text-[9px] text-teal-700 mt-0.5">Rogowski + Coaxial Shunts</div>
                </div>
              </div>

              {/* Safety Interlock Loop Live Summary */}
              <div className="p-2.5 bg-white border border-slate-200 rounded text-[11px] font-mono flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-teal-600" />
                  SAFETY LOOP STATUS:
                </span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  ALL SENSORS INTERLOCKED (SIL 3)
                </span>
              </div>
            </div>

            {/* Calibration Reference Wave Mini-Chart */}
            <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded">
              <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                <span className="font-semibold text-slate-800 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-teal-600" />
                  CALIBRATION IMPULSE REFERENCE WAVE
                </span>
                <span className="text-[10px] text-slate-500">ACQ RATE: 1.0 MS/s</span>
              </div>

              <div className="h-20 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={referenceImpulseData}>
                    <XAxis dataKey="t" hide />
                    <YAxis hide domain={[0, 9]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#cbd5e1',
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: '#0f172a',
                        fontFamily: 'monospace',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                      }}
                      formatter={(val: any) => [`${val} kA`, 'Current']}
                      labelFormatter={(l) => `${l} ms`}
                    />
                    <Line
                      type="monotone"
                      dataKey="i"
                      stroke="#0d9488"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-200">
                <span>PEAK CUT-OFF: <strong className="text-slate-800">Ip = 7.42 kA</strong></span>
                <span>TIME TO PEAK: <strong className="text-slate-800">tp = 8.0 ms</strong></span>
              </div>
            </div>
          </div>

          {/* Sub-strip: Hardware connection indicators (matches Figma) */}
          <div className="grid grid-cols-3 gap-2 mt-3 text-[10px] font-mono">
            <div className="p-1.5 bg-slate-50 border border-slate-200 rounded text-center">
              <div className="text-slate-400">ESP32 CVU</div>
              <div className="text-emerald-700 font-bold flex items-center justify-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                COM3 OK
              </div>
            </div>

            <div className="p-1.5 bg-slate-50 border border-slate-200 rounded text-center">
              <div className="text-slate-400">MODBUS PLC</div>
              <div className="text-emerald-700 font-bold flex items-center justify-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                ONLINE
              </div>
            </div>

            <div className="p-1.5 bg-slate-50 border border-slate-200 rounded text-center">
              <div className="text-slate-400">HIGH-SPEED DAQ</div>
              <div className="text-teal-700 font-bold flex items-center justify-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                ARMED
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Pre-Configured IEC 60898-1 Specifications (matches Figma) */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
              PRE-CONFIGURED IEC 60898-1:2015 TEST SPECIFICATIONS
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
            AUTOMATIC PARAMETER LOADING SUPPORTED
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
            <span className="text-[10px] text-slate-500 block uppercase">RATED BREAKING (ICN)</span>
            <span className="text-sm font-bold text-slate-900 mt-1 block">3.0 kA – 10.0 kA</span>
          </div>

          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
            <span className="text-[10px] text-slate-500 block uppercase">POWER FACTOR (COS φ)</span>
            <span className="text-sm font-bold text-slate-900 mt-1 block">0.45 – 0.50 (Lag)</span>
          </div>

          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
            <span className="text-[10px] text-slate-500 block uppercase">POLES RANGE</span>
            <span className="text-sm font-bold text-slate-900 mt-1 block">SP, SPN, DP, TP, FP</span>
          </div>

          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
            <span className="text-[10px] text-slate-500 block uppercase">CURRENT RANGES (IN)</span>
            <span className="text-xs font-bold text-slate-900 mt-1 block">6A, 10A, 16A, 25A, 32A, 63A</span>
          </div>

          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
            <span className="text-[10px] text-slate-500 block uppercase">TRIPPING CURVES</span>
            <span className="text-sm font-bold text-slate-900 mt-1 block">Type B, Type C, Type D</span>
          </div>

          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
            <span className="text-[10px] text-slate-500 block uppercase">ARC ENERGY CLASS</span>
            <span className="text-sm font-bold text-teal-700 mt-1 block">Class 3 (I²t Corridor)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
