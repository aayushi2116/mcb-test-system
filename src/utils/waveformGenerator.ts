import { WaveformCapture, WaveformPoint, WaveformMarker } from '../types/waveform';

export interface WaveformGenOptions {
  prospectiveCurrentA: number;
  systemVoltageV: number;
  powerFactor: number;
  frequencyHz?: number;
  sampleRateKhz?: number;
  totalDurationMs?: number;
  preTriggerMs?: number;
  tripCurve?: 'B' | 'C' | 'D';
  ratedCurrentA?: number;
  simulateFailure?: 'NONE' | 'FAILED_TO_INTERRUPT' | 'HIGH_I2T' | 'ARC_RESTRIKE';
}

export function generateRealisticMCBWaveform(options: WaveformGenOptions): WaveformCapture {
  const {
    prospectiveCurrentA = 6000,
    systemVoltageV = 240,
    powerFactor = 0.48,
    frequencyHz = 50,
    sampleRateKhz = 20, // 20k points/sec = 1 pt per 0.05ms
    totalDurationMs = 40,
    preTriggerMs = 5,
    ratedCurrentA = 16,
    simulateFailure = 'NONE',
  } = options;

  const omega = 2 * Math.PI * frequencyHz; // rad/s
  const phi = Math.acos(Math.max(0.1, Math.min(0.99, powerFactor))); // radians
  const cosPhi = powerFactor;
  const sinPhi = Math.sin(phi);
  const Z = systemVoltageV / prospectiveCurrentA;
  const R = Z * cosPhi;
  const X = Z * sinPhi;
  const L = X / omega;
  const tau = L / Math.max(0.001, R); // seconds

  const dtMs = 1 / sampleRateKhz; // e.g. 0.05ms
  const totalPoints = Math.round(totalDurationMs / dtMs);

  const points: WaveformPoint[] = [];

  const triggerTimeMs = preTriggerMs;

  // Modern Class 3 MCBs feature rapid electrodynamic blow-off contact separation within 0.8 - 1.2ms
  // for steep current limitation before the first half-cycle prospective peak.
  let contactDelayMs = 0.95;
  if (ratedCurrentA && ratedCurrentA > 32) {
    contactDelayMs = 1.4;
  } else if (ratedCurrentA && ratedCurrentA > 16) {
    contactDelayMs = 1.15;
  }

  if (simulateFailure === 'HIGH_I2T') {
    contactDelayMs = 3.6; // Delayed unlatching causes massive energy let-through
  } else if (simulateFailure === 'FAILED_TO_INTERRUPT') {
    contactDelayMs = 4.2;
  }

  const contactSeparationTimeMs = triggerTimeMs + contactDelayMs;

  // Arc extinction happens typically 3.0 - 4.5ms after separation in splitter plates
  let arcDurationMs = simulateFailure === 'HIGH_I2T' ? 12.5 : simulateFailure === 'FAILED_TO_INTERRUPT' ? 30.0 : 3.6;

  const arcExtinctionTimeMs = contactSeparationTimeMs + arcDurationMs;
  const totalInterruptionTimeMs = arcExtinctionTimeMs - triggerTimeMs;

  let peakCurrentA = 0;
  let peakCurrentTimeMs = triggerTimeMs;
  let jouleIntegralA2s = 0;
  let arcEnergyJ = 0;

  const closingAngleRad = (45 * Math.PI) / 180; // Point-on-wave closing angle

  // Cut-off current limitation factor: Class 3 limits prospective peak (typically 0.45 - 0.60 of prospective peak)
  const isNormalTrip = simulateFailure === 'NONE';
  const cutoffCurrentLimit = isNormalTrip
    ? prospectiveCurrentA * (ratedCurrentA <= 16 ? 0.58 : ratedCurrentA <= 32 ? 0.68 : 0.78)
    : prospectiveCurrentA * 1.5;

  for (let i = 0; i < totalPoints; i++) {
    const timeMs = Number((i * dtMs).toFixed(3));
    const tSec = timeMs / 1000;
    const tAfterTriggerSec = (timeMs - triggerTimeMs) / 1000;

    let currentA = 0;
    let voltageV = 0;
    let arcVoltageV = 0;
    let tripRelay = 0;
    let contactLift = 0;

    // Normal AC line voltage (open-circuit before trigger)
    const vOpen = Math.sqrt(2) * systemVoltageV * Math.sin(omega * tSec + closingAngleRad);

    if (timeMs < triggerTimeMs) {
      // PRE-TRIGGER: Switch is open
      voltageV = vOpen;
      currentA = 0;
    } else if (timeMs >= triggerTimeMs && timeMs < contactSeparationTimeMs) {
      // CLOSED CONTACTS: Initial prospective current rise before blow-off
      tripRelay = 1;
      const acComponent = Math.sqrt(2) * prospectiveCurrentA * Math.sin(omega * tAfterTriggerSec + closingAngleRad - phi);
      const dcComponent = -Math.sqrt(2) * prospectiveCurrentA * Math.sin(closingAngleRad - phi) * Math.exp(-tAfterTriggerSec / tau);
      let rawCurrent = acComponent + dcComponent;

      // Limit by contact geometry & initial constriction resistance
      if (isNormalTrip && Math.abs(rawCurrent) > cutoffCurrentLimit) {
        rawCurrent = Math.sign(rawCurrent) * cutoffCurrentLimit;
      }
      currentA = rawCurrent;
      
      // Voltage across closed contacts is essentially zero (contact drop ~ 0.5V)
      voltageV = 0.5 + Math.random() * 0.2;
    } else if (timeMs >= contactSeparationTimeMs && timeMs < arcExtinctionTimeMs) {
      // ARCING PERIOD: MCB contacts separated, arc drawn, pushed into splitter plates
      tripRelay = 1;
      contactLift = 1;

      const tArcMs = timeMs - contactSeparationTimeMs;
      // Arc voltage ramps up sharply as arc enters de-ion splitter plates (>300V counter-EMF)
      const maxArcV = simulateFailure === 'HIGH_I2T' ? 120 : 380;
      const baseArcV = Math.min(maxArcV, 60 + Math.pow(tArcMs, 1.3) * (simulateFailure === 'HIGH_I2T' ? 15 : 95));
      const arcNoise = (Math.random() - 0.5) * 12;
      arcVoltageV = baseArcV + arcNoise;

      // Current limiting action: counter-EMF of arc suppresses prospective current
      const tAfterTrigger = (timeMs - triggerTimeMs) / 1000;
      const unsuppressed = Math.sqrt(2) * prospectiveCurrentA * (
        Math.sin(omega * tAfterTrigger + closingAngleRad - phi) -
        Math.sin(closingAngleRad - phi) * Math.exp(-tAfterTrigger / tau)
      );

      // Current suppression factor rapidly declines to zero as arc quenches
      const suppressionDecay = simulateFailure === 'HIGH_I2T' ? 1.2 : 2.2;
      const suppression = Math.max(0, 1 - Math.pow(tArcMs / arcDurationMs, suppressionDecay));
      
      let arcingCurrent = unsuppressed * suppression;
      if (isNormalTrip && Math.abs(arcingCurrent) > cutoffCurrentLimit) {
        arcingCurrent = Math.sign(arcingCurrent) * (cutoffCurrentLimit * suppression);
      }

      currentA = arcingCurrent;

      if (simulateFailure === 'ARC_RESTRIKE' && tArcMs > 4 && tArcMs < 6) {
        currentA = Math.abs(currentA) + 2500;
      }

      voltageV = arcVoltageV;

      // Accumulate arc energy
      const dtSec = dtMs / 1000;
      arcEnergyJ += Math.abs(voltageV * currentA) * dtSec;
    } else {
      // POST INTERRUPTION / RECOVERY:
      tripRelay = 0;
      contactLift = 1;
      currentA = 0;

      // Transient recovery voltage (TRV) with damping
      const tPostExtinctionMs = timeMs - arcExtinctionTimeMs;
      if (tPostExtinctionMs < 3.0) {
        // High frequency TRV oscillation ~ 4 kHz
        const trvFreq = 2 * Math.PI * 4000;
        const damping = Math.exp(-tPostExtinctionMs / 0.8);
        const trvPeak = Math.sqrt(2) * systemVoltageV * 1.4;
        voltageV = vOpen + trvPeak * damping * Math.sin(trvFreq * (tPostExtinctionMs / 1000));
      } else {
        voltageV = vOpen;
      }
    }

    if (Math.abs(currentA) > peakCurrentA) {
      peakCurrentA = Math.abs(currentA);
      peakCurrentTimeMs = timeMs;
    }

    // Accumulate Joule Integral (I²t)
    if (timeMs >= triggerTimeMs && timeMs <= arcExtinctionTimeMs) {
      const dtSec = dtMs / 1000;
      jouleIntegralA2s += currentA * currentA * dtSec;
    }

    // Sample down slightly for chart rendering performance (store ~400-800 points total)
    if (i % 2 === 0) {
      points.push({
        timeMs,
        currentA: Number(currentA.toFixed(1)),
        voltageV: Number(voltageV.toFixed(1)),
        arcVoltageV: arcVoltageV > 0 ? Number(arcVoltageV.toFixed(1)) : undefined,
        arcPowerKw: arcVoltageV > 0 && currentA > 0 ? Number(((arcVoltageV * currentA) / 1000).toFixed(2)) : undefined,
        contactLiftSignal: contactLift,
        tripRelaySignal: tripRelay,
      });
    }
  }

  const recoveryVoltageV = Number((systemVoltageV * (0.98 + Math.random() * 0.04)).toFixed(1));

  const markers: WaveformMarker[] = [
    {
      id: 'm1',
      timeMs: triggerTimeMs,
      label: 'Trigger / Switch Close',
      value: 0,
      unit: 'A',
      type: 'TRIGGER',
      color: '#0284c7', // sky
    },
    {
      id: 'm2',
      timeMs: contactSeparationTimeMs,
      label: 'Contact Separation / Arc Inception',
      value: Number(points.find(p => Math.abs(p.timeMs - contactSeparationTimeMs) < 0.2)?.currentA || 0),
      unit: 'A',
      type: 'CONTACT_SEPARATION',
      color: '#d97706', // amber
    },
    {
      id: 'm3',
      timeMs: Number(peakCurrentTimeMs.toFixed(2)),
      label: `Peak Cut-off Current (Ip = ${(peakCurrentA / 1000).toFixed(2)} kA)`,
      value: Number(peakCurrentA.toFixed(1)),
      unit: 'A',
      type: 'PEAK_CURRENT',
      color: '#dc2626', // red
    },
    {
      id: 'm4',
      timeMs: Number(arcExtinctionTimeMs.toFixed(2)),
      label: 'Final Arc Extinction',
      value: 0,
      unit: 'A',
      type: 'ARC_EXTINCTION',
      color: '#16a34a', // green
    },
    {
      id: 'm5',
      timeMs: Number((arcExtinctionTimeMs + 4).toFixed(2)),
      label: `Recovery Voltage (${recoveryVoltageV} V)`,
      value: recoveryVoltageV,
      unit: 'V',
      type: 'RECOVERY_VOLTAGE',
      color: '#7c3aed', // purple
    },
  ];

  return {
    sampleRateKhz,
    totalDurationMs,
    preTriggerDurationMs: preTriggerMs,
    points,
    markers,
    triggerTimeMs,
    contactSeparationTimeMs,
    peakCurrentA: Number(peakCurrentA.toFixed(1)),
    peakCurrentTimeMs: Number(peakCurrentTimeMs.toFixed(2)),
    arcInceptionTimeMs: contactSeparationTimeMs,
    arcExtinctionTimeMs: Number(arcExtinctionTimeMs.toFixed(2)),
    arcDurationMs: Number(arcDurationMs.toFixed(2)),
    totalInterruptionTimeMs: Number(totalInterruptionTimeMs.toFixed(2)),
    recoveryVoltageV,
    prospectiveCurrentA,
    jouleIntegralA2s: Number(jouleIntegralA2s.toFixed(0)),
    arcEnergyJ: Number(arcEnergyJ.toFixed(1)),
    averagePowerFactor: powerFactor,
  };
}
