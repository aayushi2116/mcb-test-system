import { RLConfiguration, RLCompatibilityStatus } from '../types/hardware';
import { AVAILABLE_RESISTOR_BANKS, AVAILABLE_INDUCTOR_BANKS } from '../constants/iecStandards';

export interface CalculatedTargetImpedance {
  targetImpedanceOhms: number;
  targetResistanceOhms: number;
  targetReactanceOhms: number;
  targetInductanceMh: number;
  prospectivePowerKva: number;
}

export function calculateTargetRL(
  voltageV: number,
  currentA: number,
  powerFactor: number,
  frequencyHz: number = 50
): CalculatedTargetImpedance {
  if (currentA <= 0 || voltageV <= 0) {
    return {
      targetImpedanceOhms: 0,
      targetResistanceOhms: 0,
      targetReactanceOhms: 0,
      targetInductanceMh: 0,
      prospectivePowerKva: 0,
    };
  }

  const targetImpedanceOhms = voltageV / currentA;
  const clampedCosPhi = Math.max(0.1, Math.min(0.999, powerFactor));
  const sinPhi = Math.sqrt(1 - clampedCosPhi * clampedCosPhi);

  const targetResistanceOhms = targetImpedanceOhms * clampedCosPhi;
  const targetReactanceOhms = targetImpedanceOhms * sinPhi;
  const targetInductanceMh = (targetReactanceOhms / (2 * Math.PI * frequencyHz)) * 1000;
  const prospectivePowerKva = (voltageV * currentA) / 1000;

  return {
    targetImpedanceOhms: Number(targetImpedanceOhms.toFixed(5)),
    targetResistanceOhms: Number(targetResistanceOhms.toFixed(5)),
    targetReactanceOhms: Number(targetReactanceOhms.toFixed(5)),
    targetInductanceMh: Number(targetInductanceMh.toFixed(4)),
    prospectivePowerKva: Number(prospectivePowerKva.toFixed(1)),
  };
}

export function autoSelectOptimalRLBanks(
  voltageV: number,
  currentA: number,
  powerFactor: number,
  frequencyHz: number = 50,
  inceptionAngleDeg: number = 45
): RLConfiguration {
  const targets = calculateTargetRL(voltageV, currentA, powerFactor, frequencyHz);

  // Evaluate subsets of series unbypassed resistor grid elements
  let selectedRIds: string[] = [];
  let bestR = 0;
  let minDiffR = Infinity;
  const rBanks = AVAILABLE_RESISTOR_BANKS;

  for (let i = 1; i < (1 << rBanks.length); i++) {
    let sumR = 0;
    const currentSubset: string[] = [];
    for (let bit = 0; bit < rBanks.length; bit++) {
      if ((i & (1 << bit)) !== 0) {
        sumR += rBanks[bit].resistanceOhms;
        currentSubset.push(rBanks[bit].id);
      }
    }
    const diff = Math.abs(sumR - targets.targetResistanceOhms);
    if (diff < minDiffR) {
      minDiffR = diff;
      bestR = sumR;
      selectedRIds = currentSubset;
    }
  }

  // Evaluate subsets of series air-core reactor taps
  let selectedLIds: string[] = [];
  let bestL = 0;
  let minDiffL = Infinity;
  const lBanks = AVAILABLE_INDUCTOR_BANKS;

  for (let i = 1; i < (1 << lBanks.length); i++) {
    let sumL = 0;
    const currentSubset: string[] = [];
    for (let bit = 0; bit < lBanks.length; bit++) {
      if ((i & (1 << bit)) !== 0) {
        sumL += lBanks[bit].inductanceMh;
        currentSubset.push(lBanks[bit].id);
      }
    }
    const diff = Math.abs(sumL - targets.targetInductanceMh);
    if (diff < minDiffL) {
      minDiffL = diff;
      bestL = sumL;
      selectedLIds = currentSubset;
    }
  }

  const actualReactanceOhms = (bestL / 1000) * (2 * Math.PI * frequencyHz);
  const actualImpedanceOhms = Math.sqrt(bestR * bestR + actualReactanceOhms * actualReactanceOhms);
  const calculatedCurrentA = actualImpedanceOhms > 0 ? voltageV / actualImpedanceOhms : 0;
  const calculatedPowerFactor = actualImpedanceOhms > 0 ? bestR / actualImpedanceOhms : 1.0;

  const currentErrorPct = Math.abs((calculatedCurrentA - currentA) / currentA) * 100;
  const pfErrorPct = Math.abs((calculatedPowerFactor - powerFactor) / powerFactor) * 100;

  let compatibilityStatus: RLCompatibilityStatus = 'OPTIMAL';
  if (currentErrorPct > 8 || pfErrorPct > 8) {
    compatibilityStatus = 'DEVIATION_HIGH';
  } else if (currentErrorPct > 3 || pfErrorPct > 3) {
    compatibilityStatus = 'ACCEPTABLE';
  }

  const activeRelays = [
    ...selectedRIds.map(id => `CONTACTOR_${id}`),
    ...selectedLIds.map(id => `TAP_${id}`),
    'BUS_COUPLER_MAIN',
  ];

  return {
    targetCurrentA: currentA,
    targetPowerFactor: powerFactor,
    systemVoltageV: voltageV,
    systemFrequencyHz: frequencyHz,
    prospectivePowerKva: targets.prospectivePowerKva,
    breakArcInceptionAngleDeg: inceptionAngleDeg,
    targetResistanceOhms: targets.targetResistanceOhms,
    targetInductanceMh: targets.targetInductanceMh,
    targetReactanceOhms: targets.targetReactanceOhms,
    targetImpedanceOhms: targets.targetImpedanceOhms,
    selectedResistorBankIds: selectedRIds,
    selectedInductorBankIds: selectedLIds,
    actualResistanceOhms: Number(bestR.toFixed(5)),
    actualInductanceMh: Number(bestL.toFixed(4)),
    actualReactanceOhms: Number(actualReactanceOhms.toFixed(5)),
    actualImpedanceOhms: Number(actualImpedanceOhms.toFixed(5)),
    calculatedCurrentA: Number(calculatedCurrentA.toFixed(1)),
    calculatedPowerFactor: Number(calculatedPowerFactor.toFixed(3)),
    currentErrorPct: Number(currentErrorPct.toFixed(2)),
    powerFactorErrorPct: Number(pfErrorPct.toFixed(2)),
    activeRelays,
    isConfigured: true,
    compatibilityStatus,
  };
}

export function recalculateWithCustomBanks(
  selectedRIds: string[],
  selectedLIds: string[],
  targetCurrentA: number,
  targetPowerFactor: number,
  voltageV: number,
  frequencyHz: number,
  inceptionAngleDeg: number
): RLConfiguration {
  const targets = calculateTargetRL(voltageV, targetCurrentA, targetPowerFactor, frequencyHz);

  // Compute R from selected series elements
  let actualResistanceOhms = 0;
  selectedRIds.forEach(id => {
    const bank = AVAILABLE_RESISTOR_BANKS.find(b => b.id === id);
    if (bank) actualResistanceOhms += bank.resistanceOhms;
  });
  if (actualResistanceOhms === 0) actualResistanceOhms = 0.02;

  // Compute L from selected series banks
  let actualInductanceMh = 0;
  selectedLIds.forEach(id => {
    const bank = AVAILABLE_INDUCTOR_BANKS.find(b => b.id === id);
    if (bank) actualInductanceMh += bank.inductanceMh;
  });
  if (actualInductanceMh === 0) actualInductanceMh = 0.1;

  const actualReactanceOhms = (actualInductanceMh / 1000) * (2 * Math.PI * frequencyHz);
  const actualImpedanceOhms = Math.sqrt(actualResistanceOhms * actualResistanceOhms + actualReactanceOhms * actualReactanceOhms);
  const calculatedCurrentA = actualImpedanceOhms > 0 ? voltageV / actualImpedanceOhms : 0;
  const calculatedPowerFactor = actualImpedanceOhms > 0 ? actualResistanceOhms / actualImpedanceOhms : 1.0;

  const currentErrorPct = Math.abs((calculatedCurrentA - targetCurrentA) / targetCurrentA) * 100;
  const pfErrorPct = Math.abs((calculatedPowerFactor - targetPowerFactor) / targetPowerFactor) * 100;

  let compatibilityStatus: RLCompatibilityStatus = 'OPTIMAL';
  if (currentErrorPct > 8 || pfErrorPct > 8) {
    compatibilityStatus = 'DEVIATION_HIGH';
  } else if (currentErrorPct > 3 || pfErrorPct > 3) {
    compatibilityStatus = 'ACCEPTABLE';
  }

  const activeRelays = [
    ...selectedRIds.map(id => `CONTACTOR_${id}`),
    ...selectedLIds.map(id => `TAP_${id}`),
    'BUS_COUPLER_MAIN',
  ];

  return {
    targetCurrentA,
    targetPowerFactor,
    systemVoltageV: voltageV,
    systemFrequencyHz: frequencyHz,
    prospectivePowerKva: targets.prospectivePowerKva,
    breakArcInceptionAngleDeg: inceptionAngleDeg,
    targetResistanceOhms: targets.targetResistanceOhms,
    targetInductanceMh: targets.targetInductanceMh,
    targetReactanceOhms: targets.targetReactanceOhms,
    targetImpedanceOhms: targets.targetImpedanceOhms,
    selectedResistorBankIds: selectedRIds,
    selectedInductorBankIds: selectedLIds,
    actualResistanceOhms: Number(actualResistanceOhms.toFixed(5)),
    actualInductanceMh: Number(actualInductanceMh.toFixed(4)),
    actualReactanceOhms: Number(actualReactanceOhms.toFixed(5)),
    actualImpedanceOhms: Number(actualImpedanceOhms.toFixed(5)),
    calculatedCurrentA: Number(calculatedCurrentA.toFixed(1)),
    calculatedPowerFactor: Number(calculatedPowerFactor.toFixed(3)),
    currentErrorPct: Number(currentErrorPct.toFixed(2)),
    powerFactorErrorPct: Number(pfErrorPct.toFixed(2)),
    activeRelays,
    isConfigured: selectedRIds.length > 0 && selectedLIds.length > 0,
    compatibilityStatus,
  };
}
