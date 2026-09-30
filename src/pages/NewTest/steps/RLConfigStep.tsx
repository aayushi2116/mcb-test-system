import React, { useState } from 'react';
import { useTestStore } from '../../../store/testStore';
import { useToastStore } from '../../../store/toastStore';
import {
  formatCurrent,
  formatResistance,
  formatInductance,
} from '../../../utils/formatters';
import { Button } from '../../../components/common/Button';
import {
  Layers,
  Sparkles,
  CheckCircle2,
  Cpu,
  Zap,
  Activity,
  ArrowRight,
  ShieldCheck,
  RotateCw,
} from 'lucide-react';
import { clsx } from 'clsx';

export const RLConfigStep: React.FC<{ onValidChange?: (isValid: boolean) => void }> = ({ onValidChange }) => {
  const { configuration, rlConfig, runAutoRLConfig } = useTestStore();
  const toast = useToastStore();

  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const isValid =
    rlConfig.isConfigured &&
    rlConfig.selectedResistorBankIds.length > 0 &&
    rlConfig.selectedInductorBankIds.length > 0 &&
    rlConfig.compatibilityStatus !== 'UNSUPPORTED';

  React.useEffect(() => {
    onValidChange?.(isValid);
  }, [isValid, onValidChange]);

  const handleAutoOptimize = () => {
    setIsSynthesizing(true);
    setTimeout(() => {
      runAutoRLConfig();
      setIsSynthesizing(false);
      toast.success('R-L Switched Matrix Synthesized', 'Optimal resistor grids and inductor taps engaged.');
    }, 350);
  };

  const reqCurrentKa = (configuration.prospectiveCurrentA / 1000).toFixed(2);
  const expCurrentKa = (rlConfig.calculatedCurrentA / 1000).toFixed(2);

  return (
    <div className="space-y-4">
      {/* Top Header & Tags (matches Figma Screen 3) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <div className="text-[10px] font-mono text-teal-700 font-bold uppercase tracking-wider">
            IEC 60898-1 CLAUSE 9.12 • AUTO IMPEDANCE SYNTHESIS
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            R-L Configuration Selection
          </h2>
          <p className="text-xs text-slate-500">
            Automated calculation and matrix switching of high-power non-inductive resistor grid and variable toroidal inductor banks for prospective current profiling.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded text-[11px] font-mono">
            MATRIX STATE: <strong className="text-teal-700">SYNCHRONIZED</strong>
          </span>
          <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-[11px] font-mono font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            THERMAL SATURATION: 24.4 °C / 12%
          </span>
        </div>
      </div>

      {/* Main Two-Panel Grid (matches Figma Screen 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Panel: Target Conditions (col-span-5) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-md p-4 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-500" />
                Target Conditions
              </span>
              <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">
                AUTO SOLVER REF
              </span>
            </div>

            {/* Big Readouts for Required Current & Target Power Factor */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">REQUIRED CURRENT</span>
                <div className="text-2xl font-mono font-bold text-slate-900 mt-0.5">
                  {reqCurrentKa} <span className="text-xs text-slate-500 font-normal">kA</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                  {configuration.prospectiveCurrentA} A RMS ±2.5%
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">POWER FACTOR (COS φ)</span>
                <div className="text-2xl font-mono font-bold text-slate-900 mt-0.5">
                  {configuration.targetPowerFactor.toFixed(2)}
                  <span className="text-xs text-slate-500 font-normal ml-1">PF</span>
                </div>
                <span className="text-[10px] font-mono text-teal-700 font-semibold mt-1 block">
                  IEC 60898 Range
                </span>
              </div>
            </div>

            {/* Technical Specification Rows */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">System Source Voltage (Ue)</span>
                <span className="font-bold text-slate-800">{configuration.systemVoltageV}.0 V AC</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Test Frequency (f)</span>
                <span className="font-bold text-slate-800">{configuration.systemFrequencyHz}.0 Hz</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Prospective Circuit Power</span>
                <span className="font-bold text-slate-800">
                  {((configuration.systemVoltageV * configuration.prospectiveCurrentA) / 1000).toFixed(0)} kVA
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Break Arc Inception Angle</span>
                <span className="font-bold text-teal-700">{configuration.breakArcInceptionAngleDeg}° Point-on-Wave</span>
              </div>
            </div>

            {/* Equivalent Load Network Schematic Diagram (Vector representation matching Figma) */}
            <div className="p-3 bg-slate-900 rounded-md text-white">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-2">
                <span>EQUIVALENT LOAD NETWORK (BANK MATRIX)</span>
                <span className="text-teal-400 font-bold">SERIES R+L</span>
              </div>

              {/* Graphical circuit diagram */}
              <div className="py-3 px-2 flex items-center justify-center gap-1 font-mono text-[10px] text-teal-300">
                <div className="w-2.5 h-2.5 rounded-full border border-teal-400" />
                <div className="w-4 h-0.5 bg-teal-400" />
                {/* Resistor symbol */}
                <div className="border border-teal-400 px-1.5 py-0.5 bg-slate-800 text-center rounded-xs">
                  <div className="text-[9px] text-slate-400">R-GRID</div>
                  <div className="font-bold">{formatResistance(rlConfig.actualResistanceOhms)}</div>
                </div>
                <div className="w-4 h-0.5 bg-teal-400" />
                {/* Inductor symbol */}
                <div className="border border-teal-400 px-1.5 py-0.5 bg-slate-800 text-center rounded-xs">
                  <div className="text-[9px] text-slate-400">L-CHOKE</div>
                  <div className="font-bold">{formatInductance(rlConfig.actualInductanceMh)}</div>
                </div>
                <div className="w-4 h-0.5 bg-teal-400" />
                <div className="w-2.5 h-2.5 rounded-full border border-teal-400" />
              </div>

              <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-1 border-t border-slate-800">
                <span>ACTIVE MATRIX: RECEPTACLE BANK 06</span>
                <span className="text-emerald-400 font-bold">CONTACTORS ARMED</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Selected R-L Configuration (col-span-7) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-md p-4 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-teal-600" />
                Selected R-L Configuration
              </span>
              <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                OPTIMAL SOLUTION
              </span>
            </div>

            {/* 3 Main Measurement Readouts (matches Figma) */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>RESISTANCE (R)</span>
                  <span className="text-teal-700 font-bold">ACTIVE</span>
                </div>
                <div className="text-xl font-mono font-bold text-slate-900 mt-1">
                  {formatResistance(rlConfig.actualResistanceOhms)}
                </div>
                <div className="text-[9px] font-mono text-slate-400 mt-1">
                  Tol: ±0.15 mΩ • Tap 407
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>INDUCTANCE (L)</span>
                  <span className="text-teal-700 font-bold">CHOKE</span>
                </div>
                <div className="text-xl font-mono font-bold text-slate-900 mt-1">
                  {formatInductance(rlConfig.actualInductanceMh)}
                </div>
                <div className="text-[9px] font-mono text-slate-400 mt-1">
                  Air Core Sat: Tap #14
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>REACTANCE (XL)</span>
                  <span className="text-slate-400">@ 50 Hz</span>
                </div>
                <div className="text-xl font-mono font-bold text-slate-900 mt-1">
                  {formatResistance(rlConfig.actualReactanceOhms)}
                </div>
                <div className="text-[9px] font-mono text-slate-400 mt-1">
                  XL = 2π·f·L
                </div>
              </div>
            </div>

            {/* Lower Summary Readouts */}
            <div className="grid grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                <span className="text-[10px] text-slate-500 block uppercase">EXPECTED CURRENT (ICORR)</span>
                <div className="text-base font-bold text-slate-900 mt-0.5">
                  {expCurrentKa} kA
                </div>
                <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
                  ±{rlConfig.currentErrorPct}% of target (within ±5%)
                </span>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                <span className="text-[10px] text-slate-500 block uppercase">EXPECTED POWER FACTOR</span>
                <div className="text-base font-bold text-slate-900 mt-0.5">
                  {rlConfig.calculatedPowerFactor.toFixed(2)} cos φ
                </div>
                <span className="text-[10px] text-teal-700 font-semibold block mt-0.5">
                  Optimal (Mid-point of range)
                </span>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                <span className="text-[10px] text-slate-500 block uppercase">RELAY CHANGES</span>
                <div className="text-base font-bold text-slate-900 mt-0.5">
                  {rlConfig.selectedResistorBankIds.length + rlConfig.selectedInductorBankIds.length} (Minimized)
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Banks: R-{rlConfig.selectedResistorBankIds.length} & L-{rlConfig.selectedInductorBankIds.length}
                </span>
              </div>
            </div>

            {/* Power Factor Acceptance Corridor (matches Figma Gauge) */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="font-semibold text-slate-700">
                  IEC 60898-1 Power Factor Acceptance Corridor
                </span>
                <span className="text-teal-800 font-bold">
                  cos φ = {rlConfig.calculatedPowerFactor.toFixed(2)} (Target: 0.45 – 0.50)
                </span>
              </div>

              {/* Visual gauge */}
              <div className="h-3 w-full bg-slate-200 rounded overflow-hidden relative">
                {/* 0.45 to 0.50 compliance corridor */}
                <div
                  className="absolute top-0 bottom-0 bg-emerald-500 rounded"
                  style={{ left: '40%', width: '20%' }}
                />
                {/* Needle */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-slate-950"
                  style={{ left: `${(rlConfig.calculatedPowerFactor - 0.3) * 200}%` }}
                />
              </div>

              <div className="flex justify-between text-[9px] font-mono text-slate-400">
                <span>0.40 (Under-excited)</span>
                <span className="text-emerald-700 font-bold">TOLERANCE COMPLIANT</span>
                <span>0.55 (Over-excited)</span>
              </div>
            </div>

            {/* Pneumatic Contactor State Table (matches Figma) */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-2">
                <span className="font-semibold text-slate-700 uppercase">Pneumatic Contactor State Table</span>
                <span>PLC MODBUS TCP : 192.168.1.104</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                <div className="p-2 bg-white border border-slate-200 rounded text-center">
                  <div className="text-slate-500">BANK R-01</div>
                  <div className="font-bold text-slate-400 mt-0.5">OPEN</div>
                </div>

                <div className="p-2 bg-teal-50 border border-teal-300 rounded text-center">
                  <div className="text-teal-800 font-semibold">BANK R-02 (R-3)</div>
                  <div className="font-bold text-teal-900 mt-0.5">CLOSED [12.5mΩ]</div>
                </div>

                <div className="p-2 bg-white border border-slate-200 rounded text-center">
                  <div className="text-slate-500">BANK L-03</div>
                  <div className="font-bold text-slate-400 mt-0.5">OPEN</div>
                </div>

                <div className="p-2 bg-teal-50 border border-teal-300 rounded text-center">
                  <div className="text-teal-800 font-semibold">BANK L-04 (P-4)</div>
                  <div className="font-bold text-teal-900 mt-0.5">CLOSED [1.80mH]</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Configuration Validation Banner (matches Figma Screen 3) */}
      <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-md flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-950 font-mono">
                Calculated Configuration Validated
              </span>
              <span className="text-[10px] font-mono bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded font-bold">
                IEC CLAUSE COMPLIANCE 100%
              </span>
            </div>
            <p className="text-[11px] text-emerald-900/80 mt-0.5">
              Selected configuration meets the required current ({expCurrentKa} kA vs {reqCurrentKa} kA target) and power factor range. Mechanical switching wear is minimized with only 2 contactor state changes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-emerald-800">
            ESTIMATED CYCLE TIME: <strong>2.4 SECONDS</strong>
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleAutoOptimize}
            isLoading={isSynthesizing}
            leftIcon={<RotateCw className="w-3.5 h-3.5 text-teal-600" />}
          >
            Re-Synthesize Solution
          </Button>
        </div>
      </div>
    </div>
  );
};
