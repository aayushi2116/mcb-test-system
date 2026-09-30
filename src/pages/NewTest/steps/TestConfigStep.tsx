import React, { useState } from 'react';
import { useTestStore } from '../../../store/testStore';
import { useRecipeStore } from '../../../store/recipeStore';
import { useToastStore } from '../../../store/toastStore';
import {
  IEC_RATED_CURRENTS,
  STANDARD_POLES,
  STANDARD_CURVES,
  getRecommendedPowerFactor,
} from '../../../constants/iecStandards';
import { calculateTargetRL } from '../../../utils/electricalCalculations';
import { formatCurrent, formatResistance, formatInductance } from '../../../utils/formatters';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import {
  BookOpen,
  Minus,
  Plus,
  Zap,
  Activity,
  CheckCircle2,
  Sliders,
  Layers,
  Info,
} from 'lucide-react';
import { MCBPoleConfig, MCBTrippingCurve, TestType, ShotCycle } from '../../../types/test';
import { clsx } from 'clsx';

export const TestConfigStep: React.FC<{ onValidChange?: (isValid: boolean) => void }> = ({ onValidChange }) => {
  const { mcb, configuration, setMCB, setConfiguration, resetToNewTest } = useTestStore();
  const { recipes, selectRecipeAndApply } = useRecipeStore();
  const toast = useToastStore();

  const [showRecipeModal, setShowRecipeModal] = useState(false);

  // Live calculations
  const calculated = calculateTargetRL(
    configuration.systemVoltageV,
    configuration.prospectiveCurrentA,
    configuration.targetPowerFactor,
    configuration.systemFrequencyHz
  );

  // Validation
  const isValid =
    mcb.manufacturer.trim().length > 0 &&
    mcb.modelNumber.trim().length > 0 &&
    configuration.prospectiveCurrentA >= 500 &&
    configuration.targetPowerFactor > 0.1 &&
    configuration.targetPowerFactor <= 1.0;

  React.useEffect(() => {
    onValidChange?.(isValid);
  }, [isValid, onValidChange]);

  const handleCurrentChange = (val: number) => {
    const clamped = Math.max(500, Math.min(10000, val));
    const recPf = getRecommendedPowerFactor(clamped);
    setConfiguration({
      prospectiveCurrentA: clamped,
      targetPowerFactor: recPf.target,
    });
  };

  const handleRatedCurrentStep = (delta: number) => {
    const currentIndex = IEC_RATED_CURRENTS.indexOf(mcb.ratedCurrentA as any);
    if (currentIndex !== -1) {
      const nextIndex = Math.max(0, Math.min(IEC_RATED_CURRENTS.length - 1, currentIndex + delta));
      setMCB({ ratedCurrentA: IEC_RATED_CURRENTS[nextIndex] });
    } else {
      setMCB({ ratedCurrentA: Math.max(6, Math.min(63, mcb.ratedCurrentA + delta)) });
    }
  };

  const handleApplyRecipe = (recipeId: string) => {
    const ok = selectRecipeAndApply(recipeId);
    if (ok) {
      toast.success('Test Recipe Loaded', 'Configuration updated from template.');
      setShowRecipeModal(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Title & Phase Sub-header (matches Figma) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <div className="text-[10px] font-mono text-teal-700 font-bold uppercase tracking-wider">
            PHASE 01: DUT SPECS • SEQUENCE INITIATION
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Test Configuration (Input Parameters)
          </h2>
          <p className="text-xs text-slate-500">
            Configure device under test (DUT) ratings and normative IEC 60898-1 short-circuit test constraints.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded text-[11px] font-mono font-medium">
            NORM: <strong className="text-slate-900">IEC 60898-1 / CL 9.12</strong>
          </span>
          <span className="px-2.5 py-1 bg-teal-50 border border-teal-200 text-teal-800 rounded text-[11px] font-mono font-bold">
            R-L STATION: BANK ALPHA
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowRecipeModal(true)}
            leftIcon={<BookOpen className="w-3.5 h-3.5 text-teal-600" />}
          >
            Load Recipe Preset
          </Button>
        </div>
      </div>

      {/* Two Column Layout (matches Figma Screen 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: MCB Details (SPECIMEN SETUP) */}
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500" />
              MCB Details (SPECIMEN SETUP)
            </span>
            <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold">
              {mcb.poles === 'SP' ? '1 POLE DETECTED' : `${mcb.poles} DETECTED`}
            </span>
          </div>

          {/* Pole Configuration Buttons */}
          <div>
            <label className="block text-[11px] font-mono text-slate-500 uppercase mb-1.5">
              MCB Type (Pole Configuration)
            </label>
            <div className="grid grid-cols-5 gap-2">
              {STANDARD_POLES.map((pole) => (
                <button
                  key={pole}
                  type="button"
                  onClick={() => {
                    const voltage = pole === 'TP' || pole === 'FP' ? 400 : 240;
                    setMCB({ poles: pole, ratedVoltageV: voltage });
                    setConfiguration({ systemVoltageV: voltage });
                  }}
                  className={clsx(
                    'py-1.5 text-xs font-mono font-bold rounded border transition-all cursor-pointer',
                    mcb.poles === pole
                      ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  )}
                >
                  {pole}
                </button>
              ))}
            </div>
          </div>

          {/* Rated Current Stepper & Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-mono text-slate-500 uppercase">
                Rated Current (In)
              </label>
              <span className="text-[10px] font-mono text-slate-400">NORM: 6A – 63A RANGE</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center border border-slate-300 rounded bg-slate-50 px-2 py-1 flex-1 justify-between">
                <span className="text-[10px] font-mono text-slate-500 uppercase">NOMINAL VALUE</span>
                <span className="text-base font-mono font-bold text-slate-900">{mcb.ratedCurrentA} A</span>
              </div>
              <button
                type="button"
                onClick={() => handleRatedCurrentStep(-1)}
                className="w-9 h-9 flex items-center justify-center bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-slate-700 transition-colors cursor-pointer"
                title="Decrease rated current"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleRatedCurrentStep(1)}
                className="w-9 h-9 flex items-center justify-center bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-slate-700 transition-colors cursor-pointer"
                title="Increase rated current"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Presets pills */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap text-xs font-mono">
              <span className="text-[10px] text-slate-400 mr-1">IEC PRESETS:</span>
              {IEC_RATED_CURRENTS.map((amp) => (
                <button
                  key={amp}
                  type="button"
                  onClick={() => setMCB({ ratedCurrentA: amp })}
                  className={clsx(
                    'px-2 py-0.5 rounded text-[11px] font-mono font-semibold border transition-all cursor-pointer',
                    mcb.ratedCurrentA === amp
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  )}
                >
                  {amp}A
                </button>
              ))}
            </div>
          </div>

          {/* Instantaneous Tripping Curve (3 Cards matching Figma) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-mono text-slate-500 uppercase">
                Instantaneous Tripping Curve
              </label>
              <span className="text-[10px] font-mono text-teal-700 font-bold">
                {mcb.trippingCurve === 'B' ? '3·In – 5·In' : mcb.trippingCurve === 'C' ? '5·In – 10·In' : '10·In – 20·In'} (MAGNETIC TRIP)
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { curve: 'B', range: '3 to 5 In threshold', app: 'Domestic / Resistive' },
                { curve: 'C', range: '5 to 10 In threshold', app: 'General / Commercial' },
                { curve: 'D', range: '10 to 20 In threshold', app: 'Transformers / Motors' },
              ].map((c) => {
                const isSelected = mcb.trippingCurve === c.curve;
                return (
                  <button
                    key={c.curve}
                    type="button"
                    onClick={() =>
                      setMCB({
                        trippingCurve: c.curve as MCBTrippingCurve,
                        instantaneousTrippingRange: `${c.curve === 'B' ? '3 In – 5 In' : c.curve === 'C' ? '5 In – 10 In' : '10 In – 20 In'}`,
                      })
                    }
                    className={clsx(
                      'p-2 rounded text-left border transition-all cursor-pointer flex flex-col justify-between h-20',
                      isSelected
                        ? 'bg-teal-50/80 border-teal-500 ring-1 ring-teal-500'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono text-slate-900">Curve {c.curve}</span>
                      <span
                        className={clsx(
                          'w-3 h-3 rounded-full border flex items-center justify-center',
                          isSelected ? 'border-teal-600 bg-teal-600' : 'border-slate-300 bg-white'
                        )}
                      >
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-600 font-mono leading-tight">{c.range}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5 truncate">{c.app}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Manufacturer & Model Inputs */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-mono text-slate-500 uppercase mb-1">
                Manufacturer
              </label>
              <input
                type="text"
                value={mcb.manufacturer}
                onChange={(e) => setMCB({ manufacturer: e.target.value })}
                placeholder="e.g. Schneider Electric"
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:border-teal-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-slate-500 uppercase mb-1">
                Model / Catalog No.
              </label>
              <input
                type="text"
                value={mcb.modelNumber}
                onChange={(e) => setMCB({ modelNumber: e.target.value })}
                placeholder="e.g. iC60N-B16"
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:bg-white focus:border-teal-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Calculated Configuration Summary Box (matches Figma) */}
          <div className="p-3 bg-slate-100 border border-slate-200 rounded flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-[9px] text-slate-500 uppercase block">CALCULATED CONFIGURATION</span>
              <span className="font-bold text-slate-800">
                {mcb.poles === 'SP'
                  ? '1 Pole (Phase L1 to Neutral)'
                  : `${mcb.poles} Balanced Busbar Circuit`}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-slate-500 uppercase block">OPERATIONAL VOLTAGE (Ue)</span>
              <span className="font-bold text-teal-700">
                {configuration.systemVoltageV} V AC / {configuration.systemFrequencyHz}.0 Hz
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Test Parameters (IEC CONSTRAINTS) */}
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500" />
              Test Parameters (IEC CONSTRAINTS)
            </span>
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
          </div>

          {/* Test Type Dropdown */}
          <div>
            <label className="block text-[11px] font-mono text-slate-500 uppercase mb-1">
              Test Type (Breaking Capacity)
            </label>
            <select
              value={configuration.testType}
              onChange={(e) => setConfiguration({ testType: e.target.value as TestType })}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:bg-white focus:border-teal-500 focus:outline-hidden"
            >
              <option value="Icn">Short-Circuit Breaking Capacity (Icn / Ics) — Clause 9.12.11.2</option>
              <option value="Ics">Service Breaking Capacity (Ics) — Clause 9.12.11.3</option>
              <option value="Routine Breaking Capacity">Routine Production Breaking Verification</option>
            </select>
          </div>

          {/* Prospective Test Current Slider & Numeric Display (matches Figma) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div>
                <label className="text-[11px] font-mono text-slate-500 uppercase block">
                  Prospective Test Current (Isc)
                </label>
                <span className="text-[10px] text-slate-400 font-mono">NORMATIVE SHORT-CIRCUIT PROSPECTIVE RMS</span>
              </div>
              <div className="px-2.5 py-1 bg-slate-100 border border-slate-300 rounded text-right font-mono">
                <span className="text-sm font-bold text-slate-900">{configuration.prospectiveCurrentA} A </span>
                <span className="text-[10px] text-teal-700 font-semibold">({(configuration.prospectiveCurrentA / 1000).toFixed(1)} kA)</span>
              </div>
            </div>

            {/* Slider */}
            <input
              type="range"
              min={500}
              max={10000}
              step={250}
              value={configuration.prospectiveCurrentA}
              onChange={(e) => handleCurrentChange(Number(e.target.value))}
              className="w-full accent-teal-600 cursor-pointer mt-1"
            />

            {/* Ticks matching Figma */}
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
              <span onClick={() => handleCurrentChange(500)} className="cursor-pointer hover:text-slate-800">0.5 kA</span>
              <span onClick={() => handleCurrentChange(1500)} className="cursor-pointer hover:text-slate-800">1.5 kA</span>
              <span onClick={() => handleCurrentChange(3000)} className="cursor-pointer hover:text-slate-800 font-bold text-teal-700">3.0 kA</span>
              <span onClick={() => handleCurrentChange(4500)} className="cursor-pointer hover:text-slate-800">4.5 kA</span>
              <span onClick={() => handleCurrentChange(6000)} className="cursor-pointer hover:text-slate-800">6.0 kA</span>
              <span onClick={() => handleCurrentChange(10000)} className="cursor-pointer hover:text-slate-800">10.0 kA</span>
            </div>
          </div>

          {/* Mandated Power Factor Box (matches Figma Table 17 Box) */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                <Layers className="w-3.5 h-3.5 text-teal-600" />
                <span>Mandated Power Factor (cos φ)</span>
              </div>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                TABLE 17 AUTO-LOCKED
              </span>
            </div>

            <div className="flex items-center justify-between font-mono">
              <span className="text-xl font-bold text-slate-900">{configuration.targetPowerFactor.toFixed(2)}</span>
              <span className="text-[11px] text-slate-500">
                IEC 60898-1 CL 9.12.5 • For {configuration.prospectiveCurrentA <= 3000 ? '1500 A < Isc ≤ 3000 A' : '3000 A < Isc ≤ 6000 A'}
              </span>
            </div>

            {/* Visual Corridor Bar matching Figma */}
            <div className="space-y-1">
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden relative">
                <div
                  className="absolute top-0 bottom-0 bg-teal-500 rounded-full"
                  style={{ left: '45%', width: '10%' }}
                />
                <div
                  className="absolute top-0 bottom-0 w-1 bg-slate-900"
                  style={{ left: `${configuration.targetPowerFactor * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] font-mono text-slate-400">
                <span>0.00 (Pure Inductive)</span>
                <span className="text-teal-700 font-bold">Target Band (0.45 – 0.50)</span>
                <span>1.00 (Pure Resistive)</span>
              </div>
            </div>
          </div>

          {/* Shot Cycle & Normative Reference */}
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div>
              <label className="block text-[11px] text-slate-500 uppercase mb-1">
                Shot Cycle (O - t - CO)
              </label>
              <select
                value={configuration.shotCycle}
                onChange={(e) => setConfiguration({ shotCycle: e.target.value as ShotCycle })}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-hidden"
              >
                <option value="O - t - CO">1 Sequence: O - t - CO</option>
                <option value="O">Single Shot: O (Break)</option>
                <option value="CO">Single Shot: CO (Make-Break)</option>
                <option value="O - t - CO - t - CO">Double Sequence: O-t-CO-t-CO</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 uppercase mb-1">
                Normative Reference
              </label>
              <div className="p-1.5 bg-slate-100 border border-slate-200 rounded text-[11px] text-slate-700 truncate">
                IEC 60898-1:2015 Cl. 9.12.11.2.1
              </div>
            </div>
          </div>

          {/* Arc Chamber Pressure Transducer Toggle */}
          <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded text-xs">
            <div>
              <div className="font-semibold text-slate-800 font-mono">Arc Chamber Pressure Transducer</div>
              <div className="text-[10px] text-slate-500">Piezoresistive Ch-3 / 0–25 bar fast response</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={configuration.arcChamberPressureMonitoring}
                onChange={(e) => setConfiguration({ arcChamberPressureMonitoring: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
              <span className="ml-2 text-[10px] font-mono font-bold text-teal-800">
                {configuration.arcChamberPressureMonitoring ? 'ENABLED' : 'DISABLED'}
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Bottom Prediction Matrix Banner (matches Figma Screen 2 Bottom) */}
      <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-md flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-teal-600" />
          <div>
            <span className="font-bold text-slate-900 font-mono">
              R-L Prediction Matrix: Auto-Engine Ready
            </span>
            <span className="ml-2 px-2 py-0.5 bg-teal-600 text-white rounded font-mono text-[10px] font-bold">
              TARGET: {formatResistance(calculated.targetResistanceOhms)} / {formatInductance(calculated.targetInductanceMh)}
            </span>
            <p className="text-[11px] text-slate-600 mt-0.5">
              System will compute bank tap selections and contactor sequence on the next screen.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-600">
          <span className="flex items-center gap-1 text-emerald-700 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            CVU COMM OK
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-600">VOLTAGE INTRLK ENGAGED</span>
        </div>
      </div>

      {/* Standard Recipe Selection Modal */}
      <Modal
        isOpen={showRecipeModal}
        onClose={() => setShowRecipeModal(false)}
        title="Load IEC Standard Test Recipe Preset"
        maxWidth="2xl"
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-600">
            Select an IEC standard test recipe to auto-populate the specimen ratings and target prospective short-circuit electrical parameters:
          </p>
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {recipes.map((r) => (
              <div key={r.id} className="py-2.5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{r.name}</span>
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                      {r.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{r.description}</p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono mt-1">
                    <span>Target: {formatCurrent(r.testConfig.prospectiveCurrentA)}</span>
                    <span>cos φ: {r.testConfig.targetPowerFactor}</span>
                    <span>{r.testConfig.shotCycle}</span>
                  </div>
                </div>
                <Button size="sm" variant="primary" onClick={() => handleApplyRecipe(r.id)}>
                  Load Recipe
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};
