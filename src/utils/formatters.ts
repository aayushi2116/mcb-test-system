export function formatCurrent(amperes: number, decimals: number = 0): string {
  if (Math.abs(amperes) >= 1000) {
    return `${(amperes / 1000).toFixed(decimals > 0 ? decimals : 2)} kA`;
  }
  return `${amperes.toFixed(decimals)} A`;
}

export function formatVoltage(volts: number, decimals: number = 1): string {
  if (Math.abs(volts) >= 1000) {
    return `${(volts / 1000).toFixed(2)} kV`;
  }
  return `${volts.toFixed(decimals)} V`;
}

export function formatResistance(ohms: number): string {
  if (ohms < 0.001) {
    return `${(ohms * 1000000).toFixed(1)} µΩ`;
  }
  if (ohms < 1) {
    return `${(ohms * 1000).toFixed(2)} mΩ`;
  }
  return `${ohms.toFixed(3)} Ω`;
}

export function formatInductance(millihenry: number): string {
  if (millihenry < 0.1) {
    return `${(millihenry * 1000).toFixed(1)} µH`;
  }
  return `${millihenry.toFixed(3)} mH`;
}

export function formatJouleIntegral(a2s: number): string {
  if (a2s >= 1000000) {
    return `${(a2s / 1000000).toFixed(2)} MA²s`;
  }
  if (a2s >= 1000) {
    return `${(a2s / 1000).toFixed(1)} kA²s`;
  }
  return `${a2s.toFixed(0)} A²s`;
}

export function formatTimeMs(ms: number, decimals: number = 1): string {
  return `${ms.toFixed(decimals)} ms`;
}

export function formatDate(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return isoDate;
  }
}

export function formatShortDate(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  } catch {
    return isoDate;
  }
}
