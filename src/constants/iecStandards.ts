import { SwitchedResistorBank, SwitchedInductorBank } from '../types/hardware';

export const IEC_RATED_CURRENTS = [0.5, 1, 2, 3, 4, 6, 10, 13, 16, 20, 25, 32, 40, 50, 63] as const;

export const IEC_BREAKING_CAPACITIES = [1500, 3000, 4500, 6000, 10000, 15000] as const;

export const STANDARD_POLES = ['SP', 'SPN', 'DP', 'TP', 'FP'] as const;

export const STANDARD_CURVES = [
  { curve: 'B', range: '3 In – 5 In', desc: 'Resistive/Heating loads with minimal surge' },
  { curve: 'C', range: '5 In – 10 In', desc: 'General domestic & commercial inductive loads' },
  { curve: 'D', range: '10 In – 20 In', desc: 'High inrush inductive loads (motors, transformers)' },
] as const;

export const IEC_POWER_FACTOR_REQUIREMENTS = [
  { minCurrentA: 0, maxCurrentA: 1500, targetCosPhi: 0.95, range: [0.93, 0.98] },
  { minCurrentA: 1500, maxCurrentA: 3000, targetCosPhi: 0.88, range: [0.85, 0.90] },
  { minCurrentA: 3000, maxCurrentA: 4500, targetCosPhi: 0.75, range: [0.70, 0.80] },
  { minCurrentA: 4500, maxCurrentA: 6000, targetCosPhi: 0.48, range: [0.45, 0.50] },
  { minCurrentA: 6000, maxCurrentA: 10000, targetCosPhi: 0.38, range: [0.35, 0.40] },
  { minCurrentA: 10000, maxCurrentA: 25000, targetCosPhi: 0.22, range: [0.20, 0.25] },
];

export function getRecommendedPowerFactor(currentA: number): { target: number; min: number; max: number } {
  const match = IEC_POWER_FACTOR_REQUIREMENTS.find(
    r => currentA > r.minCurrentA && currentA <= r.maxCurrentA
  );
  if (match) {
    return { target: match.targetCosPhi, min: match.range[0], max: match.range[1] };
  }
  return { target: 0.45, min: 0.40, max: 0.50 };
}

// Switched modular series resistor grid units with bypass contactors (K1 - K6)
export const AVAILABLE_RESISTOR_BANKS: SwitchedResistorBank[] = [
  { id: 'R_BANK_1', label: 'R1 - Coarse Grid 0.0400 Ω (150 kW)', resistanceOhms: 0.0400, powerRatingKw: 150, status: 'IDLE' },
  { id: 'R_BANK_2', label: 'R2 - Medium Grid 0.0200 Ω (200 kW)', resistanceOhms: 0.0200, powerRatingKw: 200, status: 'IDLE' },
  { id: 'R_BANK_3', label: 'R3 - Fine Grid 0.0100 Ω (250 kW)', resistanceOhms: 0.0100, powerRatingKw: 250, status: 'IDLE' },
  { id: 'R_BANK_4', label: 'R4 - Step Grid 0.0050 Ω (300 kW)', resistanceOhms: 0.0050, powerRatingKw: 300, status: 'IDLE' },
  { id: 'R_BANK_5', label: 'R5 - Micro-step 0.0025 Ω (350 kW)', resistanceOhms: 0.0025, powerRatingKw: 350, status: 'IDLE' },
  { id: 'R_BANK_6', label: 'R6 - Vernier 0.0010 Ω (400 kW)', resistanceOhms: 0.0010, powerRatingKw: 400, status: 'IDLE' },
];

// Switched air-core series reactor taps with selector contactors (L1 - L5)
export const AVAILABLE_INDUCTOR_BANKS: SwitchedInductorBank[] = [
  { id: 'L_BANK_1', label: 'L1 - Air-Core Reactor 0.160 mH (0.050 Ω)', inductanceMh: 0.160, reactanceOhms: 0.0503, currentRatingA: 2000, status: 'IDLE' },
  { id: 'L_BANK_2', label: 'L2 - Air-Core Reactor 0.080 mH (0.025 Ω)', inductanceMh: 0.080, reactanceOhms: 0.0251, currentRatingA: 4500, status: 'IDLE' },
  { id: 'L_BANK_3', label: 'L3 - Air-Core Reactor 0.040 mH (0.0125 Ω)', inductanceMh: 0.040, reactanceOhms: 0.0126, currentRatingA: 8000, status: 'IDLE' },
  { id: 'L_BANK_4', label: 'L4 - Air-Core Reactor 0.020 mH (0.0063 Ω)', inductanceMh: 0.020, reactanceOhms: 0.0063, currentRatingA: 12000, status: 'IDLE' },
  { id: 'L_BANK_5', label: 'L5 - Low-Z Vernier Tap 0.010 mH (0.0031 Ω)', inductanceMh: 0.010, reactanceOhms: 0.0031, currentRatingA: 18000, status: 'IDLE' },
];
