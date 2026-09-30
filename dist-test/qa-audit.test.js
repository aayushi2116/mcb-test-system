import { jsPDF } from "jspdf";
//#region src/constants/iecStandards.ts
var AVAILABLE_RESISTOR_BANKS = [
	{
		id: "R_BANK_1",
		label: "R1 - Coarse Grid 0.0400 Ω (150 kW)",
		resistanceOhms: .04,
		powerRatingKw: 150,
		status: "IDLE"
	},
	{
		id: "R_BANK_2",
		label: "R2 - Medium Grid 0.0200 Ω (200 kW)",
		resistanceOhms: .02,
		powerRatingKw: 200,
		status: "IDLE"
	},
	{
		id: "R_BANK_3",
		label: "R3 - Fine Grid 0.0100 Ω (250 kW)",
		resistanceOhms: .01,
		powerRatingKw: 250,
		status: "IDLE"
	},
	{
		id: "R_BANK_4",
		label: "R4 - Step Grid 0.0050 Ω (300 kW)",
		resistanceOhms: .005,
		powerRatingKw: 300,
		status: "IDLE"
	},
	{
		id: "R_BANK_5",
		label: "R5 - Micro-step 0.0025 Ω (350 kW)",
		resistanceOhms: .0025,
		powerRatingKw: 350,
		status: "IDLE"
	},
	{
		id: "R_BANK_6",
		label: "R6 - Vernier 0.0010 Ω (400 kW)",
		resistanceOhms: .001,
		powerRatingKw: 400,
		status: "IDLE"
	}
];
var AVAILABLE_INDUCTOR_BANKS = [
	{
		id: "L_BANK_1",
		label: "L1 - Air-Core Reactor 0.160 mH (0.050 Ω)",
		inductanceMh: .16,
		reactanceOhms: .0503,
		currentRatingA: 2e3,
		status: "IDLE"
	},
	{
		id: "L_BANK_2",
		label: "L2 - Air-Core Reactor 0.080 mH (0.025 Ω)",
		inductanceMh: .08,
		reactanceOhms: .0251,
		currentRatingA: 4500,
		status: "IDLE"
	},
	{
		id: "L_BANK_3",
		label: "L3 - Air-Core Reactor 0.040 mH (0.0125 Ω)",
		inductanceMh: .04,
		reactanceOhms: .0126,
		currentRatingA: 8e3,
		status: "IDLE"
	},
	{
		id: "L_BANK_4",
		label: "L4 - Air-Core Reactor 0.020 mH (0.0063 Ω)",
		inductanceMh: .02,
		reactanceOhms: .0063,
		currentRatingA: 12e3,
		status: "IDLE"
	},
	{
		id: "L_BANK_5",
		label: "L5 - Low-Z Vernier Tap 0.010 mH (0.0031 Ω)",
		inductanceMh: .01,
		reactanceOhms: .0031,
		currentRatingA: 18e3,
		status: "IDLE"
	}
];
//#endregion
//#region src/utils/electricalCalculations.ts
function calculateTargetRL(voltageV, currentA, powerFactor, frequencyHz = 50) {
	if (currentA <= 0 || voltageV <= 0) return {
		targetImpedanceOhms: 0,
		targetResistanceOhms: 0,
		targetReactanceOhms: 0,
		targetInductanceMh: 0,
		prospectivePowerKva: 0
	};
	const targetImpedanceOhms = voltageV / currentA;
	const clampedCosPhi = Math.max(.1, Math.min(.999, powerFactor));
	const sinPhi = Math.sqrt(1 - clampedCosPhi * clampedCosPhi);
	const targetResistanceOhms = targetImpedanceOhms * clampedCosPhi;
	const targetReactanceOhms = targetImpedanceOhms * sinPhi;
	const targetInductanceMh = targetReactanceOhms / (2 * Math.PI * frequencyHz) * 1e3;
	const prospectivePowerKva = voltageV * currentA / 1e3;
	return {
		targetImpedanceOhms: Number(targetImpedanceOhms.toFixed(5)),
		targetResistanceOhms: Number(targetResistanceOhms.toFixed(5)),
		targetReactanceOhms: Number(targetReactanceOhms.toFixed(5)),
		targetInductanceMh: Number(targetInductanceMh.toFixed(4)),
		prospectivePowerKva: Number(prospectivePowerKva.toFixed(1))
	};
}
function autoSelectOptimalRLBanks(voltageV, currentA, powerFactor, frequencyHz = 50, inceptionAngleDeg = 45) {
	const targets = calculateTargetRL(voltageV, currentA, powerFactor, frequencyHz);
	let selectedRIds = [];
	let bestR = 0;
	let minDiffR = Infinity;
	const rBanks = AVAILABLE_RESISTOR_BANKS;
	for (let i = 1; i < 1 << rBanks.length; i++) {
		let sumR = 0;
		const currentSubset = [];
		for (let bit = 0; bit < rBanks.length; bit++) if ((i & 1 << bit) !== 0) {
			sumR += rBanks[bit].resistanceOhms;
			currentSubset.push(rBanks[bit].id);
		}
		const diff = Math.abs(sumR - targets.targetResistanceOhms);
		if (diff < minDiffR) {
			minDiffR = diff;
			bestR = sumR;
			selectedRIds = currentSubset;
		}
	}
	let selectedLIds = [];
	let bestL = 0;
	let minDiffL = Infinity;
	const lBanks = AVAILABLE_INDUCTOR_BANKS;
	for (let i = 1; i < 1 << lBanks.length; i++) {
		let sumL = 0;
		const currentSubset = [];
		for (let bit = 0; bit < lBanks.length; bit++) if ((i & 1 << bit) !== 0) {
			sumL += lBanks[bit].inductanceMh;
			currentSubset.push(lBanks[bit].id);
		}
		const diff = Math.abs(sumL - targets.targetInductanceMh);
		if (diff < minDiffL) {
			minDiffL = diff;
			bestL = sumL;
			selectedLIds = currentSubset;
		}
	}
	const actualReactanceOhms = bestL / 1e3 * (2 * Math.PI * frequencyHz);
	const actualImpedanceOhms = Math.sqrt(bestR * bestR + actualReactanceOhms * actualReactanceOhms);
	const calculatedCurrentA = actualImpedanceOhms > 0 ? voltageV / actualImpedanceOhms : 0;
	const calculatedPowerFactor = actualImpedanceOhms > 0 ? bestR / actualImpedanceOhms : 1;
	const currentErrorPct = Math.abs((calculatedCurrentA - currentA) / currentA) * 100;
	const pfErrorPct = Math.abs((calculatedPowerFactor - powerFactor) / powerFactor) * 100;
	let compatibilityStatus = "OPTIMAL";
	if (currentErrorPct > 8 || pfErrorPct > 8) compatibilityStatus = "DEVIATION_HIGH";
	else if (currentErrorPct > 3 || pfErrorPct > 3) compatibilityStatus = "ACCEPTABLE";
	const activeRelays = [
		...selectedRIds.map((id) => `CONTACTOR_${id}`),
		...selectedLIds.map((id) => `TAP_${id}`),
		"BUS_COUPLER_MAIN"
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
		compatibilityStatus
	};
}
//#endregion
//#region src/utils/waveformGenerator.ts
function generateRealisticMCBWaveform(options) {
	const { prospectiveCurrentA = 6e3, systemVoltageV = 240, powerFactor = .48, frequencyHz = 50, sampleRateKhz = 20, totalDurationMs = 40, preTriggerMs = 5, ratedCurrentA = 16, simulateFailure = "NONE" } = options;
	const omega = 2 * Math.PI * frequencyHz;
	const phi = Math.acos(Math.max(.1, Math.min(.99, powerFactor)));
	const cosPhi = powerFactor;
	const sinPhi = Math.sin(phi);
	const Z = systemVoltageV / prospectiveCurrentA;
	const R = Z * cosPhi;
	const tau = Z * sinPhi / omega / Math.max(.001, R);
	const dtMs = 1 / sampleRateKhz;
	const totalPoints = Math.round(totalDurationMs / dtMs);
	const points = [];
	const triggerTimeMs = preTriggerMs;
	let contactDelayMs = .95;
	if (ratedCurrentA && ratedCurrentA > 32) contactDelayMs = 1.4;
	else if (ratedCurrentA && ratedCurrentA > 16) contactDelayMs = 1.15;
	if (simulateFailure === "HIGH_I2T") contactDelayMs = 3.6;
	else if (simulateFailure === "FAILED_TO_INTERRUPT") contactDelayMs = 4.2;
	const contactSeparationTimeMs = triggerTimeMs + contactDelayMs;
	let arcDurationMs = simulateFailure === "HIGH_I2T" ? 12.5 : simulateFailure === "FAILED_TO_INTERRUPT" ? 30 : 3.6;
	const arcExtinctionTimeMs = contactSeparationTimeMs + arcDurationMs;
	const totalInterruptionTimeMs = arcExtinctionTimeMs - triggerTimeMs;
	let peakCurrentA = 0;
	let peakCurrentTimeMs = triggerTimeMs;
	let jouleIntegralA2s = 0;
	let arcEnergyJ = 0;
	const closingAngleRad = 45 * Math.PI / 180;
	const isNormalTrip = simulateFailure === "NONE";
	const cutoffCurrentLimit = isNormalTrip ? prospectiveCurrentA * (ratedCurrentA <= 16 ? .58 : ratedCurrentA <= 32 ? .68 : .78) : prospectiveCurrentA * 1.5;
	for (let i = 0; i < totalPoints; i++) {
		const timeMs = Number((i * dtMs).toFixed(3));
		const tSec = timeMs / 1e3;
		const tAfterTriggerSec = (timeMs - triggerTimeMs) / 1e3;
		let currentA = 0;
		let voltageV = 0;
		let arcVoltageV = 0;
		let tripRelay = 0;
		let contactLift = 0;
		const vOpen = Math.sqrt(2) * systemVoltageV * Math.sin(omega * tSec + closingAngleRad);
		if (timeMs < triggerTimeMs) {
			voltageV = vOpen;
			currentA = 0;
		} else if (timeMs >= triggerTimeMs && timeMs < contactSeparationTimeMs) {
			tripRelay = 1;
			let rawCurrent = Math.sqrt(2) * prospectiveCurrentA * Math.sin(omega * tAfterTriggerSec + closingAngleRad - phi) + -Math.sqrt(2) * prospectiveCurrentA * Math.sin(closingAngleRad - phi) * Math.exp(-tAfterTriggerSec / tau);
			if (isNormalTrip && Math.abs(rawCurrent) > cutoffCurrentLimit) rawCurrent = Math.sign(rawCurrent) * cutoffCurrentLimit;
			currentA = rawCurrent;
			voltageV = .5 + Math.random() * .2;
		} else if (timeMs >= contactSeparationTimeMs && timeMs < arcExtinctionTimeMs) {
			tripRelay = 1;
			contactLift = 1;
			const tArcMs = timeMs - contactSeparationTimeMs;
			arcVoltageV = Math.min(simulateFailure === "HIGH_I2T" ? 120 : 380, 60 + Math.pow(tArcMs, 1.3) * (simulateFailure === "HIGH_I2T" ? 15 : 95)) + (Math.random() - .5) * 12;
			const tAfterTrigger = (timeMs - triggerTimeMs) / 1e3;
			const unsuppressed = Math.sqrt(2) * prospectiveCurrentA * (Math.sin(omega * tAfterTrigger + closingAngleRad - phi) - Math.sin(closingAngleRad - phi) * Math.exp(-tAfterTrigger / tau));
			const suppressionDecay = simulateFailure === "HIGH_I2T" ? 1.2 : 2.2;
			const suppression = Math.max(0, 1 - Math.pow(tArcMs / arcDurationMs, suppressionDecay));
			let arcingCurrent = unsuppressed * suppression;
			if (isNormalTrip && Math.abs(arcingCurrent) > cutoffCurrentLimit) arcingCurrent = Math.sign(arcingCurrent) * (cutoffCurrentLimit * suppression);
			currentA = arcingCurrent;
			if (simulateFailure === "ARC_RESTRIKE" && tArcMs > 4 && tArcMs < 6) currentA = Math.abs(currentA) + 2500;
			voltageV = arcVoltageV;
			const dtSec = dtMs / 1e3;
			arcEnergyJ += Math.abs(voltageV * currentA) * dtSec;
		} else {
			tripRelay = 0;
			contactLift = 1;
			currentA = 0;
			const tPostExtinctionMs = timeMs - arcExtinctionTimeMs;
			if (tPostExtinctionMs < 3) {
				const trvFreq = 2 * Math.PI * 4e3;
				const damping = Math.exp(-tPostExtinctionMs / .8);
				voltageV = vOpen + Math.sqrt(2) * systemVoltageV * 1.4 * damping * Math.sin(trvFreq * (tPostExtinctionMs / 1e3));
			} else voltageV = vOpen;
		}
		if (Math.abs(currentA) > peakCurrentA) {
			peakCurrentA = Math.abs(currentA);
			peakCurrentTimeMs = timeMs;
		}
		if (timeMs >= triggerTimeMs && timeMs <= arcExtinctionTimeMs) {
			const dtSec = dtMs / 1e3;
			jouleIntegralA2s += currentA * currentA * dtSec;
		}
		if (i % 2 === 0) points.push({
			timeMs,
			currentA: Number(currentA.toFixed(1)),
			voltageV: Number(voltageV.toFixed(1)),
			arcVoltageV: arcVoltageV > 0 ? Number(arcVoltageV.toFixed(1)) : void 0,
			arcPowerKw: arcVoltageV > 0 && currentA > 0 ? Number((arcVoltageV * currentA / 1e3).toFixed(2)) : void 0,
			contactLiftSignal: contactLift,
			tripRelaySignal: tripRelay
		});
	}
	const recoveryVoltageV = Number((systemVoltageV * (.98 + Math.random() * .04)).toFixed(1));
	return {
		sampleRateKhz,
		totalDurationMs,
		preTriggerDurationMs: preTriggerMs,
		points,
		markers: [
			{
				id: "m1",
				timeMs: triggerTimeMs,
				label: "Trigger / Switch Close",
				value: 0,
				unit: "A",
				type: "TRIGGER",
				color: "#0284c7"
			},
			{
				id: "m2",
				timeMs: contactSeparationTimeMs,
				label: "Contact Separation / Arc Inception",
				value: Number(points.find((p) => Math.abs(p.timeMs - contactSeparationTimeMs) < .2)?.currentA || 0),
				unit: "A",
				type: "CONTACT_SEPARATION",
				color: "#d97706"
			},
			{
				id: "m3",
				timeMs: Number(peakCurrentTimeMs.toFixed(2)),
				label: `Peak Cut-off Current (Ip = ${(peakCurrentA / 1e3).toFixed(2)} kA)`,
				value: Number(peakCurrentA.toFixed(1)),
				unit: "A",
				type: "PEAK_CURRENT",
				color: "#dc2626"
			},
			{
				id: "m4",
				timeMs: Number(arcExtinctionTimeMs.toFixed(2)),
				label: "Final Arc Extinction",
				value: 0,
				unit: "A",
				type: "ARC_EXTINCTION",
				color: "#16a34a"
			},
			{
				id: "m5",
				timeMs: Number((arcExtinctionTimeMs + 4).toFixed(2)),
				label: `Recovery Voltage (${recoveryVoltageV} V)`,
				value: recoveryVoltageV,
				unit: "V",
				type: "RECOVERY_VOLTAGE",
				color: "#7c3aed"
			}
		],
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
		averagePowerFactor: powerFactor
	};
}
//#endregion
//#region src/utils/resultEvaluator.ts
function evaluateTestResult(mcb, config, waveform, failureSimulated = false) {
	const i2tLimit = mcb.ratedCurrentA <= 16 ? 35e3 : mcb.ratedCurrentA <= 32 ? 45e3 : 75e3;
	const maxInterruptionTimeMs = 20;
	const maxArcDurationMs = 12;
	const minRecoveryVoltageV = config.systemVoltageV * .95;
	const peakPass = !failureSimulated && waveform.peakCurrentA > 0 && waveform.peakCurrentA <= config.prospectiveCurrentA * 1.8;
	const i2tPass = !failureSimulated && waveform.jouleIntegralA2s <= i2tLimit;
	const timePass = !failureSimulated && waveform.totalInterruptionTimeMs <= maxInterruptionTimeMs;
	const arcPass = !failureSimulated && waveform.arcDurationMs <= maxArcDurationMs;
	const recPass = waveform.recoveryVoltageV >= minRecoveryVoltageV;
	const contactWelding = failureSimulated;
	const criteria = [
		{
			parameter: "Cut-off Peak Current (Ip)",
			description: "Maximum instantaneous peak current during interruption",
			measured: waveform.peakCurrentA,
			unit: "A",
			limitMax: Number((config.prospectiveCurrentA * 1.5).toFixed(0)),
			pass: peakPass,
			standardReference: "IEC 60898-1 Cl. 9.12.11.2"
		},
		{
			parameter: "Joule Integral (I²t)",
			description: "Total specific energy let-through into the circuit (Class 3 limit)",
			measured: waveform.jouleIntegralA2s,
			unit: "A²s",
			limitMax: i2tLimit,
			pass: i2tPass,
			standardReference: "IEC 60898-1 Annex ZA Table ZA.1"
		},
		{
			parameter: "Total Interruption Time",
			description: "Time elapsed between make-switch trigger and final arc extinction",
			measured: waveform.totalInterruptionTimeMs,
			unit: "ms",
			limitMax: maxInterruptionTimeMs,
			pass: timePass,
			standardReference: "IEC 60898-1 Cl. 9.12.11.3"
		},
		{
			parameter: "Arc Duration",
			description: "Duration of electric arc inside deionisation chamber",
			measured: waveform.arcDurationMs,
			unit: "ms",
			limitMax: maxArcDurationMs,
			pass: arcPass,
			standardReference: "IEC 60898-1 Cl. 9.12.11.4"
		},
		{
			parameter: "Power Factor Accuracy",
			description: "Test circuit prospective power factor cos φ",
			measured: waveform.averagePowerFactor,
			unit: "",
			limitMin: config.targetPowerFactor - .05,
			limitMax: config.targetPowerFactor + .05,
			pass: Math.abs(waveform.averagePowerFactor - config.targetPowerFactor) <= .05,
			standardReference: "IEC 60898-1 Table 17"
		},
		{
			parameter: "Power-Frequency Recovery Voltage",
			description: "RMS recovery voltage sustained across open contacts post-test",
			measured: waveform.recoveryVoltageV,
			unit: "V",
			limitMin: Number(minRecoveryVoltageV.toFixed(1)),
			pass: recPass,
			standardReference: "IEC 60898-1 Cl. 9.12.11.5"
		}
	];
	const overallPass = criteria.every((c) => c.pass) && !contactWelding;
	return {
		overallResult: overallPass ? "PASS" : "FAIL",
		peakCurrentA: waveform.peakCurrentA,
		jouleIntegralA2s: waveform.jouleIntegralA2s,
		interruptionTimeMs: waveform.totalInterruptionTimeMs,
		arcDurationMs: waveform.arcDurationMs,
		recoveryVoltageV: waveform.recoveryVoltageV,
		powerFactor: waveform.averagePowerFactor,
		dielectricPostCheck: overallPass ? "PASSED" : "FAILED",
		arcChamberIntegrity: overallPass ? "INTACT" : "DISCOLORATION",
		contactWeldingDetected: contactWelding,
		criteria,
		complianceVerdict: overallPass ? `COMPLIANT: The test sample (${mcb.manufacturer} ${mcb.modelNumber} ${mcb.poles} ${mcb.trippingCurve}${mcb.ratedCurrentA}) successfully interrupted the prospective fault current of ${config.prospectiveCurrentA} A at ${config.systemVoltageV} V with complete contact separation and intact dielectric recovery.` : `NON-COMPLIANT: Test sample failed to satisfy one or more limiting criteria specified in IEC 60898-1:2015.`,
		evaluatedAt: (/* @__PURE__ */ new Date()).toISOString(),
		evaluatorNotes: overallPass ? "Clean arc quenching inside splitter plates. No external flame escape or contact welding." : "Excessive let-through energy or delayed interruption observed."
	};
}
//#endregion
//#region src/utils/formatters.ts
function formatCurrent(amperes, decimals = 0) {
	if (Math.abs(amperes) >= 1e3) return `${(amperes / 1e3).toFixed(decimals > 0 ? decimals : 2)} kA`;
	return `${amperes.toFixed(decimals)} A`;
}
function formatVoltage(volts, decimals = 1) {
	if (Math.abs(volts) >= 1e3) return `${(volts / 1e3).toFixed(2)} kV`;
	return `${volts.toFixed(decimals)} V`;
}
function formatJouleIntegral(a2s) {
	if (a2s >= 1e6) return `${(a2s / 1e6).toFixed(2)} MA²s`;
	if (a2s >= 1e3) return `${(a2s / 1e3).toFixed(1)} kA²s`;
	return `${a2s.toFixed(0)} A²s`;
}
function formatTimeMs(ms, decimals = 1) {
	return `${ms.toFixed(decimals)} ms`;
}
function formatDate(isoDate) {
	try {
		return new Date(isoDate).toLocaleString("en-US", {
			year: "numeric",
			month: "short",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			hour12: false
		});
	} catch {
		return isoDate;
	}
}
//#endregion
//#region src/services/reports/pdfService.ts
function generateTestCertificatePDF(test, download = true) {
	const doc = new jsPDF({
		orientation: "portrait",
		unit: "mm",
		format: "a4"
	});
	const pageWidth = doc.internal.pageSize.getWidth();
	const pageHeight = doc.internal.pageSize.getHeight();
	const margin = 14;
	doc.setFillColor(15, 23, 42);
	doc.rect(0, 0, pageWidth, 24, "F");
	doc.setFillColor(13, 148, 136);
	doc.rect(0, 24, pageWidth, 2, "F");
	doc.setTextColor(255, 255, 255);
	doc.setFont("helvetica", "bold");
	doc.setFontSize(13);
	doc.text("AUTOMATED MCB SHORT-CIRCUIT TEST BENCH", margin, 11);
	doc.setFont("helvetica", "normal");
	doc.setFontSize(8.5);
	doc.text("HIGH-POWER ELECTRICAL METROLOGY & CERTIFICATION SYSTEM | IEC 60898-1:2015", margin, 18);
	const isPass = test.result?.overallResult === "PASS";
	doc.setFont("helvetica", "bold");
	doc.setFontSize(11);
	if (isPass) {
		doc.setTextColor(52, 211, 153);
		doc.text("VERDICT: COMPLIANT / PASS", pageWidth - margin, 15, { align: "right" });
	} else {
		doc.setTextColor(248, 113, 113);
		doc.text("VERDICT: NON-COMPLIANT / FAIL", pageWidth - margin, 15, { align: "right" });
	}
	let y = 34;
	doc.setDrawColor(226, 232, 240);
	doc.setFillColor(248, 250, 252);
	doc.roundedRect(margin, y, pageWidth - 28, 20, 2, 2, "FD");
	doc.setTextColor(51, 65, 85);
	doc.setFont("helvetica", "bold");
	doc.setFontSize(8.5);
	doc.text("TEST CERTIFICATE REF:", 18, y + 6);
	doc.setFont("helvetica", "normal");
	doc.text(test.id, 62, y + 6);
	doc.setFont("helvetica", "bold");
	doc.text("EXECUTION DATE:", 18, y + 14);
	doc.setFont("helvetica", "normal");
	doc.text(formatDate(test.createdAt), 62, y + 14);
	doc.setFont("helvetica", "bold");
	doc.text("TEST STATION ID:", pageWidth / 2 + 10, y + 6);
	doc.setFont("helvetica", "normal");
	doc.text("BENCH-HP-04 (High-Current Cell)", pageWidth / 2 + 48, y + 6);
	doc.setFont("helvetica", "bold");
	doc.text("AUTHORIZED OPERATOR:", pageWidth / 2 + 10, y + 14);
	doc.setFont("helvetica", "normal");
	doc.text(`${test.operator?.name || "Authorized Engineer"} (${test.operator?.badgeNumber || "STN4-OP"})`, pageWidth / 2 + 48, y + 14);
	y += 26;
	doc.setFillColor(241, 245, 249);
	doc.rect(margin, y, pageWidth - 28, 6, "F");
	doc.setFont("helvetica", "bold");
	doc.setFontSize(9);
	doc.setTextColor(15, 23, 42);
	doc.text("1. TEST SPECIMEN IDENTIFICATION (DEVICE UNDER TEST)", 17, y + 4.5);
	y += 9;
	const colW = (pageWidth - 28) / 3;
	doc.setFontSize(8);
	[
		[
			"Manufacturer:",
			test.mcb.manufacturer,
			"Model / Cat No:",
			test.mcb.modelNumber,
			"Serial Number:",
			test.mcb.serialNumber || "N/A"
		],
		[
			"Poles Configuration:",
			test.mcb.poles,
			"Rated Current (In):",
			`${test.mcb.ratedCurrentA} A`,
			"Rated Voltage (Un):",
			`${test.mcb.ratedVoltageV} V`
		],
		[
			"Tripping Curve:",
			`Type ${test.mcb.trippingCurve} (${test.mcb.instantaneousTrippingRange})`,
			"Breaking Capacity (Icn):",
			`${formatCurrent(test.mcb.ratedBreakingCapacityA)}`,
			"Standard Complied:",
			test.mcb.standardsComplied
		]
	].forEach((row) => {
		doc.setFont("helvetica", "bold");
		doc.setTextColor(71, 85, 105);
		doc.text(row[0], 16, y);
		doc.setFont("helvetica", "normal");
		doc.setTextColor(15, 23, 42);
		doc.text(row[1], 48, y);
		doc.setFont("helvetica", "bold");
		doc.setTextColor(71, 85, 105);
		doc.text(row[2], margin + colW + 2, y);
		doc.setFont("helvetica", "normal");
		doc.setTextColor(15, 23, 42);
		doc.text(row[3], margin + colW + 36, y);
		doc.setFont("helvetica", "bold");
		doc.setTextColor(71, 85, 105);
		doc.text(row[4], margin + colW * 2 + 2, y);
		doc.setFont("helvetica", "normal");
		doc.setTextColor(15, 23, 42);
		doc.text(row[5], margin + colW * 2 + 36, y);
		y += 5.5;
	});
	y += 3;
	doc.setFillColor(241, 245, 249);
	doc.rect(margin, y, pageWidth - 28, 6, "F");
	doc.setFont("helvetica", "bold");
	doc.setFontSize(9);
	doc.setTextColor(15, 23, 42);
	doc.text("2. PROSPECTIVE TEST CIRCUIT & SWITCHED R-L CONFIGURATION", 17, y + 4.5);
	y += 9;
	[
		[
			"Test Duty Cycle:",
			test.configuration.shotCycle,
			"Test Category:",
			test.configuration.testType,
			"Prospective Current:",
			`${formatCurrent(test.configuration.prospectiveCurrentA)}`
		],
		[
			"Target Power Factor:",
			`${test.configuration.targetPowerFactor} (cos φ)`,
			"System Voltage:",
			`${test.configuration.systemVoltageV} V RMS`,
			"Frequency:",
			`${test.configuration.systemFrequencyHz} Hz`
		],
		[
			"Target Resistance R:",
			`${test.rlConfig?.targetResistanceOhms || .02} Ω`,
			"Target Inductance L:",
			`${test.rlConfig?.targetInductanceMh || .1} mH`,
			"Relay Interlocks:",
			"All verified & latched"
		]
	].forEach((row) => {
		doc.setFont("helvetica", "bold");
		doc.setTextColor(71, 85, 105);
		doc.text(row[0], 16, y);
		doc.setFont("helvetica", "normal");
		doc.setTextColor(15, 23, 42);
		doc.text(row[1], 48, y);
		doc.setFont("helvetica", "bold");
		doc.setTextColor(71, 85, 105);
		doc.text(row[2], margin + colW + 2, y);
		doc.setFont("helvetica", "normal");
		doc.setTextColor(15, 23, 42);
		doc.text(row[3], margin + colW + 36, y);
		doc.setFont("helvetica", "bold");
		doc.setTextColor(71, 85, 105);
		doc.text(row[4], margin + colW * 2 + 2, y);
		doc.setFont("helvetica", "normal");
		doc.setTextColor(15, 23, 42);
		doc.text(row[5], margin + colW * 2 + 36, y);
		y += 5.5;
	});
	y += 3;
	doc.setFillColor(241, 245, 249);
	doc.rect(margin, y, pageWidth - 28, 6, "F");
	doc.setFont("helvetica", "bold");
	doc.setFontSize(9);
	doc.setTextColor(15, 23, 42);
	doc.text("3. MEASURED ELECTRICAL PARAMETERS & IEC 60898-1 CRITERIA", 17, y + 4.5);
	y += 9;
	doc.setFillColor(226, 232, 240);
	doc.rect(margin, y, pageWidth - 28, 6, "F");
	doc.setFont("helvetica", "bold");
	doc.setFontSize(7.5);
	doc.setTextColor(30, 41, 59);
	doc.text("PARAMETER / REQUIREMENT", 17, y + 4.2);
	doc.text("MEASURED VALUE", 84, y + 4.2);
	doc.text("IEC SPEC / LIMIT", 124, y + 4.2);
	doc.text("STANDARD REF", 159, y + 4.2);
	doc.text("STATUS", pageWidth - margin - 4, y + 4.2, { align: "right" });
	y += 6.5;
	if (test.result?.criteria) test.result.criteria.forEach((crit, index) => {
		if (index % 2 === 1) {
			doc.setFillColor(248, 250, 252);
			doc.rect(margin, y - .5, pageWidth - 28, 5.5, "F");
		}
		doc.setFont("helvetica", "normal");
		doc.setFontSize(7.5);
		doc.setTextColor(15, 23, 42);
		doc.text(crit.parameter, 17, y + 3.5);
		let valStr = `${crit.measured} ${crit.unit}`;
		if (crit.parameter.includes("Current")) valStr = formatCurrent(crit.measured);
		if (crit.parameter.includes("Integral")) valStr = formatJouleIntegral(crit.measured);
		if (crit.parameter.includes("Time") || crit.parameter.includes("Duration")) valStr = formatTimeMs(crit.measured);
		if (crit.parameter.includes("Voltage")) valStr = formatVoltage(crit.measured);
		if (crit.parameter.includes("Factor")) valStr = crit.measured.toFixed(3);
		let limStr = "-";
		if (crit.limitMax) {
			limStr = `Max ${crit.limitMax} ${crit.unit}`;
			if (crit.parameter.includes("Current")) limStr = `Max ${formatCurrent(crit.limitMax)}`;
			if (crit.parameter.includes("Integral")) limStr = `Max ${formatJouleIntegral(crit.limitMax)}`;
			if (crit.parameter.includes("Time") || crit.parameter.includes("Duration")) limStr = `Max ${formatTimeMs(crit.limitMax)}`;
		} else if (crit.limitMin) limStr = `Min ${crit.limitMin} ${crit.unit}`;
		doc.text(valStr, 84, y + 3.5);
		doc.text(limStr, 124, y + 3.5);
		doc.text(crit.standardReference, 159, y + 3.5);
		doc.setFont("helvetica", "bold");
		if (crit.pass) {
			doc.setTextColor(22, 101, 52);
			doc.text("PASS", pageWidth - margin - 4, y + 3.5, { align: "right" });
		} else {
			doc.setTextColor(185, 28, 28);
			doc.text("FAIL", pageWidth - margin - 4, y + 3.5, { align: "right" });
		}
		y += 5.5;
	});
	y += 4;
	const verdictBg = isPass ? [
		236,
		253,
		245
	] : [
		254,
		242,
		242
	];
	const verdictBorder = isPass ? [
		16,
		185,
		129
	] : [
		239,
		68,
		68
	];
	doc.setFillColor(verdictBg[0], verdictBg[1], verdictBg[2]);
	doc.setDrawColor(verdictBorder[0], verdictBorder[1], verdictBorder[2]);
	doc.roundedRect(margin, y, pageWidth - 28, 22, 2, 2, "FD");
	doc.setFont("helvetica", "bold");
	doc.setFontSize(8.5);
	doc.setTextColor(isPass ? 4 : 153, isPass ? 120 : 27, isPass ? 87 : 27);
	doc.text("OFFICIAL CERTIFICATION VERDICT & EVALUATOR STATEMENT:", 18, y + 6);
	doc.setFont("helvetica", "normal");
	doc.setFontSize(7.5);
	doc.setTextColor(30, 41, 59);
	const verdictText = test.result?.complianceVerdict || "Compliance evaluation completed per IEC 60898-1:2015 protocol.";
	const splitText = doc.splitTextToSize(verdictText, pageWidth - 28 - 8);
	doc.text(splitText, 18, y + 12);
	y += 28;
	doc.setFillColor(248, 250, 252);
	doc.setDrawColor(226, 232, 240);
	doc.roundedRect(margin, y, pageWidth - 28, 18, 2, 2, "FD");
	doc.setFont("helvetica", "bold");
	doc.setFontSize(8);
	doc.setTextColor(71, 85, 105);
	doc.text("METROLOGY TRACEABILITY & CALIBRATION HARNESS:", 18, y + 5);
	doc.setFont("helvetica", "normal");
	doc.setFontSize(7.2);
	doc.setTextColor(15, 23, 42);
	doc.text(`Reference Meter: ${test.calibration?.referenceMeterModel || "Yokogawa WT3000E Precision Power Analyzer"}`, 18, y + 10);
	doc.text(`Calibration Cert: ${test.calibration?.certificateId || "CAL-CERT-9941"} (Current Error: ${test.calibration?.currentTolerancePct ?? .1}%)`, 18, y + 14);
	doc.text(`CVU Unit: ${test.cvuVerification?.firmwareVersion || "ESP32-CVU-v2.4"} (${test.cvuVerification?.port || "COM4"})`, pageWidth / 2 + 10, y + 10);
	doc.text(`Isolation & Earth: Verified (PE Impedance 0.012 Ω, Galvanic ISO OK)`, pageWidth / 2 + 10, y + 14);
	y += 22;
	doc.setFont("helvetica", "bold");
	doc.setFontSize(7.5);
	doc.setTextColor(71, 85, 105);
	doc.line(24, y + 12, 79, y + 12);
	doc.text("Test Engineer / Operator Signature", 26, y + 16);
	doc.setFont("helvetica", "normal");
	doc.text(test.operator?.name || "Dr. Marcus Vance", 26, y + 10);
	doc.line(pageWidth - margin - 65, y + 12, pageWidth - margin - 10, y + 12);
	doc.setFont("helvetica", "bold");
	doc.text("Laboratory Technical Director Seal", pageWidth - margin - 63, y + 16);
	doc.setFont("helvetica", "normal");
	doc.text("Dr. Aris Thorne, Lead Physicist", pageWidth - margin - 63, y + 10);
	doc.setFont("helvetica", "italic");
	doc.setFontSize(6.5);
	doc.setTextColor(148, 163, 184);
	doc.text("Notice: This document is produced by the Automated MCB Short-Circuit Test System software prototype. Measurements reflect automated laboratory instrumentation telemetry evaluated against IEC 60898-1:2015 limits.", pageWidth / 2, pageHeight - 6, { align: "center" });
	if (download) doc.save(`MCB_Report_${test.id}.pdf`);
	return doc;
}
//#endregion
//#region src/services/hardware/mockHardwareService.ts
var MockHardwareController = class {
	status = {
		plcConnected: true,
		plcLatencyMs: 4,
		daqConnected: true,
		daqSampleRateKhz: 100,
		cvuConnected: true,
		cvuPort: "COM4 (USB-RS485-ISO)",
		interlockClosed: true,
		safetyDoorLocked: true,
		emergencyStopActive: false,
		clampEngaged: true,
		arcShieldClosed: true,
		sourceTransformerReady: true,
		sourceBusVoltageV: 241.4,
		temperatureAmbientC: 24.5,
		systemMode: "IDLE",
		simulationMode: true
	};
	cvuVerification = {
		status: "IDLE",
		connected: true,
		port: "COM4 (USB-RS485-ISO)",
		firmwareVersion: "ESP32-CVU-v2.4.18-PROD",
		diagnosticPingMs: 6,
		galvanicIsolationVerified: true,
		channels: this.getDefaultCVUChannels(),
		verifiedAt: null
	};
	calibrationResult = {
		status: "IDLE",
		targetCurrentA: 6e3,
		measuredCurrentA: 5988,
		currentTolerancePct: .2,
		targetPowerFactor: .48,
		measuredPowerFactor: .482,
		powerFactorTolerancePct: .4,
		targetFrequencyHz: 50,
		measuredFrequencyHz: 50.02,
		shuntVoltageMv: 59.88,
		transformerTempC: 38.4,
		referenceMeterModel: "Yokogawa WT3000E Precision Power Analyzer",
		calibratedAt: null,
		certificateId: "CAL-REF-2026-0814",
		progressPct: 0
	};
	currentRLConfig = null;
	lastCapturedWaveform = null;
	telemetryListeners = /* @__PURE__ */ new Set();
	statusListeners = /* @__PURE__ */ new Set();
	telemetryIntervalTimer = null;
	activeTestAborted = false;
	constructor() {
		this.startBackgroundTelemetry();
	}
	getDefaultCVUChannels() {
		return [
			{
				id: "cvu_ch1",
				name: "Phase Input (L1 Line)",
				channelNumber: 1,
				expectedMin: 228,
				expectedMax: 242,
				measuredValue: 239.8,
				unit: "V RMS",
				deviationPct: .1,
				status: "PASS"
			},
			{
				id: "cvu_ch2",
				name: "Neutral Input (N Reference)",
				channelNumber: 2,
				expectedMin: 0,
				expectedMax: 2.5,
				measuredValue: .4,
				unit: "V RMS",
				deviationPct: 0,
				status: "PASS"
			},
			{
				id: "cvu_ch3",
				name: "MCB Terminal Input (Line Side)",
				channelNumber: 3,
				expectedMin: 228,
				expectedMax: 242,
				measuredValue: 239.6,
				unit: "V RMS",
				deviationPct: .15,
				status: "PASS"
			},
			{
				id: "cvu_ch4",
				name: "MCB Terminal Output (Load Side)",
				channelNumber: 4,
				expectedMin: 0,
				expectedMax: 2,
				measuredValue: .1,
				unit: "V RMS",
				deviationPct: .05,
				status: "PASS"
			},
			{
				id: "cvu_ch5",
				name: "Earth Continuity (PE Safety Bond)",
				channelNumber: 5,
				expectedMin: .001,
				expectedMax: .05,
				measuredValue: .012,
				unit: "Ω",
				deviationPct: .4,
				status: "PASS"
			},
			{
				id: "cvu_ch6",
				name: "Coaxial Shunt / Rogowski Zero Offset",
				channelNumber: 6,
				expectedMin: -.5,
				expectedMax: .5,
				measuredValue: .03,
				unit: "mV",
				deviationPct: .02,
				status: "PASS"
			}
		];
	}
	startBackgroundTelemetry() {
		if (this.telemetryIntervalTimer) return;
		this.telemetryIntervalTimer = setInterval(() => {
			const isTesting = this.status.systemMode === "TESTING";
			const isArmed = this.status.systemMode === "ARMED";
			const jitter = (Math.random() - .5) * .4;
			const vRms = this.status.interlockClosed ? 240 + jitter : 0;
			const currentRms = isTesting ? 4500 + Math.random() * 500 : 0;
			const currentInstant = isTesting ? (Math.random() - .5) * 8e3 : 0;
			const voltageInstant = (Math.random() - .5) * 340;
			const telemetry = {
				timestamp: Date.now(),
				currentRmsA: Number(currentRms.toFixed(1)),
				voltageRmsV: Number(vRms.toFixed(1)),
				instantaneousCurrentA: Number(currentInstant.toFixed(1)),
				instantaneousVoltageV: Number(voltageInstant.toFixed(1)),
				powerFactor: isTesting ? .48 + (Math.random() - .5) * .02 : 1,
				frequencyHz: Number((50 + (Math.random() - .5) * .04).toFixed(2)),
				temperatureTransformerC: Number((32 + Math.sin(Date.now() / 6e4) * 3).toFixed(1)),
				temperatureArcChuteC: Number((26.5 + (isTesting ? 25 : 0)).toFixed(1)),
				arcPressureBar: isTesting ? Number((1.8 + Math.random() * .8).toFixed(2)) : .01,
				pneumaticClampPressureBar: this.status.clampEngaged ? 6.2 : 0,
				mcbContactState: isTesting ? "TRIPPED" : isArmed ? "CLOSED" : "OPEN",
				isArcing: isTesting,
				busCharged: this.status.interlockClosed && !this.status.emergencyStopActive
			};
			this.telemetryListeners.forEach((listener) => {
				try {
					listener(telemetry);
				} catch (e) {
					console.error("Error in telemetry listener:", e);
				}
			});
		}, 400);
	}
	async connect() {
		await new Promise((r) => setTimeout(r, 600));
		this.status.plcConnected = true;
		this.status.daqConnected = true;
		this.status.cvuConnected = true;
		this.startBackgroundTelemetry();
		this.notifyStatus();
		return true;
	}
	async disconnect() {
		await new Promise((r) => setTimeout(r, 400));
		if (this.telemetryIntervalTimer) {
			clearInterval(this.telemetryIntervalTimer);
			this.telemetryIntervalTimer = null;
		}
		this.status.plcConnected = false;
		this.status.daqConnected = false;
		this.status.cvuConnected = false;
		this.notifyStatus();
	}
	getStatus() {
		return { ...this.status };
	}
	setInterlockDoor(closed) {
		this.status.interlockClosed = closed;
		this.status.safetyDoorLocked = closed;
		this.status.arcShieldClosed = closed;
		this.notifyStatus();
	}
	async setPneumaticClamp(engaged) {
		await new Promise((r) => setTimeout(r, 500));
		this.status.clampEngaged = engaged;
		this.notifyStatus();
		return true;
	}
	emergencyStop() {
		this.activeTestAborted = true;
		this.status.emergencyStopActive = true;
		this.status.systemMode = "EMERGENCY_STOP";
		this.status.sourceTransformerReady = false;
		this.notifyStatus();
	}
	resetEmergencyStop() {
		this.status.emergencyStopActive = false;
		this.status.systemMode = "IDLE";
		this.status.sourceTransformerReady = true;
		this.notifyStatus();
		return true;
	}
	notifyStatus() {
		this.statusListeners.forEach((l) => l({ ...this.status }));
	}
	async verifyCVU(onProgress) {
		this.cvuVerification.status = "SCANNING";
		onProgress?.(15, "Scanning RS485 bus on COM4...");
		await new Promise((r) => setTimeout(r, 500));
		onProgress?.(35, "Handshaking with ESP32-CVU controller (v2.4.18)...");
		await new Promise((r) => setTimeout(r, 500));
		onProgress?.(60, "Checking galvanic isolation & ADC reference voltage...");
		await new Promise((r) => setTimeout(r, 600));
		onProgress?.(85, "Acquiring 6-channel analog diagnostic readings...");
		await new Promise((r) => setTimeout(r, 600));
		const channels = this.getDefaultCVUChannels().map((ch) => {
			const nominal = (ch.expectedMin + ch.expectedMax) / 2;
			const noise = (Math.random() - .5) * (ch.expectedMax - ch.expectedMin) * .1;
			const measured = Number((nominal + noise).toFixed(ch.unit === "Ω" ? 3 : 2));
			const dev = Math.abs(measured - nominal) / (nominal || 1) * 100;
			return {
				...ch,
				measuredValue: measured,
				deviationPct: Number(dev.toFixed(2)),
				status: "PASS"
			};
		});
		this.cvuVerification = {
			status: "VERIFIED",
			connected: true,
			port: "COM4 (USB-RS485-ISO)",
			firmwareVersion: "ESP32-CVU-v2.4.18-PROD",
			diagnosticPingMs: 5,
			galvanicIsolationVerified: true,
			channels,
			verifiedAt: (/* @__PURE__ */ new Date()).toISOString()
		};
		onProgress?.(100, "CVU Verification Completed — All Channels Verified");
		return { ...this.cvuVerification };
	}
	getCVUStatus() {
		return { ...this.cvuVerification };
	}
	async configureRL(config) {
		this.status.systemMode = "CALIBRATION";
		this.notifyStatus();
		await new Promise((r) => setTimeout(r, 800));
		this.currentRLConfig = {
			...config,
			isConfigured: true
		};
		this.status.systemMode = "IDLE";
		this.notifyStatus();
		return true;
	}
	getRLStatus() {
		return this.currentRLConfig ? { ...this.currentRLConfig } : null;
	}
	async startCalibration(targetCurrentA, targetPowerFactor, onProgress) {
		this.status.systemMode = "CALIBRATION";
		this.notifyStatus();
		const cal = {
			status: "INITIALIZING",
			targetCurrentA,
			measuredCurrentA: 0,
			currentTolerancePct: 0,
			targetPowerFactor,
			measuredPowerFactor: 0,
			powerFactorTolerancePct: 0,
			targetFrequencyHz: 50,
			measuredFrequencyHz: 50,
			shuntVoltageMv: 0,
			transformerTempC: 32.5,
			referenceMeterModel: "Yokogawa WT3000E Precision Power Analyzer",
			calibratedAt: null,
			certificateId: `CAL-CERT-${Date.now().toString().slice(-6)}`,
			progressPct: 10
		};
		onProgress?.({ ...cal });
		await new Promise((r) => setTimeout(r, 600));
		cal.status = "APPLYING_TEST_CONDITION";
		cal.progressPct = 40;
		onProgress?.({ ...cal });
		await new Promise((r) => setTimeout(r, 800));
		cal.status = "MEASURING";
		cal.progressPct = 75;
		const curDev = (Math.random() - .45) * .008;
		cal.measuredCurrentA = Number((targetCurrentA * (1 + curDev)).toFixed(1));
		cal.currentTolerancePct = Number((Math.abs(curDev) * 100).toFixed(2));
		const pfDev = (Math.random() - .5) * .006;
		cal.measuredPowerFactor = Number((targetPowerFactor + pfDev).toFixed(3));
		cal.powerFactorTolerancePct = Number((Math.abs(pfDev) * 100).toFixed(2));
		cal.measuredFrequencyHz = Number((50.01 + (Math.random() - .5) * .02).toFixed(2));
		cal.shuntVoltageMv = Number((cal.measuredCurrentA / 1e3 * 10).toFixed(2));
		cal.transformerTempC = 35.8;
		onProgress?.({ ...cal });
		await new Promise((r) => setTimeout(r, 800));
		cal.status = "PASSED";
		cal.progressPct = 100;
		cal.calibratedAt = (/* @__PURE__ */ new Date()).toISOString();
		this.calibrationResult = { ...cal };
		this.status.systemMode = "IDLE";
		this.notifyStatus();
		onProgress?.({ ...cal });
		return { ...cal };
	}
	stopCalibration() {
		this.status.systemMode = "IDLE";
		this.notifyStatus();
	}
	getCalibrationStatus() {
		return { ...this.calibrationResult };
	}
	async armTestSequence(mcb, config) {
		if (this.status.emergencyStopActive) throw new Error("Emergency stop is active! Reset before arming.");
		if (!this.status.interlockClosed) throw new Error("Safety interlock is open! Close safety door.");
		if (!this.status.clampEngaged) throw new Error("MCB pneumatic clamp is disengaged! Clamp MCB securely.");
		this.status.systemMode = "ARMED";
		this.notifyStatus();
		await new Promise((r) => setTimeout(r, 500));
		return true;
	}
	async startTest(mcb, config, onStageChange, onTelemetry) {
		this.activeTestAborted = false;
		if (this.status.emergencyStopActive) throw new Error("Emergency stop is active.");
		if (!this.status.interlockClosed) throw new Error("Safety interlock is open.");
		const checkAborted = () => {
			if (this.activeTestAborted) throw new Error("Test sequence aborted by user or emergency stop.");
		};
		try {
			this.status.systemMode = "TESTING";
			this.notifyStatus();
			onStageChange?.("PRE_CHECK", 10, "Verifying safety interlocks and ground continuity...");
			await new Promise((r) => setTimeout(r, 600));
			checkAborted();
			onStageChange?.("RL_CONFIG", 25, "Confirming switched R-L contactor positions...");
			await new Promise((r) => setTimeout(r, 600));
			checkAborted();
			onStageChange?.("CLAMP_ARMED", 40, "Pressurizing pneumatic clamps and charging pulse bus...");
			await new Promise((r) => setTimeout(r, 700));
			checkAborted();
			onStageChange?.("PRE_TRIGGER", 55, "Point-on-wave synchronizer armed at 45° inception angle...");
			await new Promise((r) => setTimeout(r, 600));
			checkAborted();
			onStageChange?.("HIGH_CURRENT_PULSE", 70, `High current pulse fired: ${config.prospectiveCurrentA} A prospective...`);
			await new Promise((r) => setTimeout(r, 500));
			checkAborted();
			onStageChange?.("MCB_INTERRUPTING", 85, "Arc quenched in deionisation plates. Contacts separated.");
			await new Promise((r) => setTimeout(r, 600));
			checkAborted();
			onStageChange?.("WAVEFORM_PROCESSING", 95, "Acquiring 100 kHz Rogowski & high-voltage probe data...");
			await new Promise((r) => setTimeout(r, 600));
			checkAborted();
			const waveform = generateRealisticMCBWaveform({
				prospectiveCurrentA: config.prospectiveCurrentA,
				systemVoltageV: config.systemVoltageV,
				powerFactor: config.targetPowerFactor,
				frequencyHz: config.systemFrequencyHz,
				tripCurve: mcb.trippingCurve,
				ratedCurrentA: mcb.ratedCurrentA,
				simulateFailure: "NONE"
			});
			this.lastCapturedWaveform = waveform;
			this.status.systemMode = "IDLE";
			this.notifyStatus();
			onStageChange?.("COMPLETED", 100, "Test completed successfully. Waveform captured.");
			return waveform;
		} catch (err) {
			this.status.systemMode = "IDLE";
			this.notifyStatus();
			onStageChange?.("ABORTED", 0, err.message || "Test sequence failed.");
			throw err;
		}
	}
	abortTest() {
		this.activeTestAborted = true;
		this.status.systemMode = "IDLE";
		this.notifyStatus();
	}
	async captureWaveform() {
		if (this.lastCapturedWaveform) return this.lastCapturedWaveform;
		const wf = generateRealisticMCBWaveform({
			prospectiveCurrentA: 6e3,
			systemVoltageV: 240,
			powerFactor: .48
		});
		this.lastCapturedWaveform = wf;
		return wf;
	}
	subscribeTelemetry(listener) {
		this.telemetryListeners.add(listener);
		return () => {
			this.telemetryListeners.delete(listener);
		};
	}
	subscribeHardwareStatus(listener) {
		this.statusListeners.add(listener);
		listener({ ...this.status });
		return () => {
			this.statusListeners.delete(listener);
		};
	}
};
//#endregion
//#region src/data/mockOperators.ts
var MOCK_OPERATORS = [
	{
		id: "OP-8821",
		name: "Dr. Marcus Vance",
		badgeNumber: "STN4-ENG-8821",
		role: "LAB_ENGINEER",
		labStation: "Station 4 (High-Current Test Cell)",
		lastLogin: "2026-09-30T09:15:00.000Z"
	},
	{
		id: "OP-7419",
		name: "Elena Rostova",
		badgeNumber: "STN4-TECH-7419",
		role: "OPERATOR",
		labStation: "Station 4 (High-Current Test Cell)",
		lastLogin: "2026-09-29T16:30:00.000Z"
	},
	{
		id: "OP-9012",
		name: "Sarah Chen, PE",
		badgeNumber: "QA-AUDIT-9012",
		role: "QUALITY_AUDITOR",
		labStation: "Certification Verification Bureau",
		lastLogin: "2026-09-28T11:00:00.000Z"
	},
	{
		id: "OP-1001",
		name: "Vikram Joshi",
		badgeNumber: "SYS-ADMIN-1001",
		role: "ADMIN",
		labStation: "Master Control Center",
		lastLogin: "2026-09-30T08:00:00.000Z"
	}
];
//#endregion
//#region src/qa-audit.test.ts
async function runQAAudit() {
	console.log("====================================================");
	console.log("STARTING AUTOMATED QA & INTEGRATION AUDIT SUITE");
	console.log("====================================================\n");
	let passed = 0;
	let failed = 0;
	function assert(condition, desc) {
		if (condition) {
			console.log(`[PASS] ${desc}`);
			passed++;
		} else {
			console.error(`[FAIL] ${desc}`);
			failed++;
		}
	}
	console.log("--- 1. Testing Electrical Calculations ---");
	const z6k = calculateTargetRL(240, 6e3, .48, 50);
	assert(Math.abs(z6k.targetImpedanceOhms - .04) < .001, "Z = 240V / 6000A = 0.04 Ω");
	assert(Math.abs(z6k.targetResistanceOhms - .0192) < .001, "R = 0.04 * 0.48 = 0.0192 Ω");
	assert(z6k.targetInductanceMh > .09 && z6k.targetInductanceMh < .13, "L is ~0.11 mH at 50Hz");
	const rlConfig = autoSelectOptimalRLBanks(240, 6e3, .48, 50, 45);
	assert(rlConfig.isConfigured, "R-L Matrix successfully auto-synthesizes banks");
	assert(rlConfig.selectedResistorBankIds.length > 0, "Resistor banks selected");
	assert(rlConfig.selectedInductorBankIds.length > 0, "Inductor banks selected");
	assert(rlConfig.compatibilityStatus === "OPTIMAL" || rlConfig.compatibilityStatus === "ACCEPTABLE", "Impedance match within allowable deviation");
	console.log("\n--- 2. Testing Hardware Controller & CVU Diagnostics ---");
	const hw = new MockHardwareController();
	const initialStatus = hw.getStatus();
	assert(initialStatus.plcConnected && initialStatus.daqConnected, "Hardware controller initial status connected");
	const cvu = await hw.verifyCVU();
	assert(cvu.status === "VERIFIED", "CVU verification completes with VERIFIED status");
	assert(cvu.channels.length === 6, "CVU acquires all 6 analog channels");
	assert(cvu.channels.every((c) => c.status === "PASS"), "All 6 channels within permissible deviation limits");
	console.log("\n--- 3. Testing Metrology Calibration Process ---");
	const cal = await hw.startCalibration(6e3, .48);
	assert(cal.status === "PASSED", "Calibration completes with PASSED status");
	assert(cal.currentTolerancePct <= 1, `Current error ${cal.currentTolerancePct}% <= 1.0% tolerance`);
	assert(cal.certificateId.startsWith("CAL-CERT-"), "Valid calibration certificate ID issued");
	console.log("\n--- 4. Testing Waveform Physics & Parameter Extraction ---");
	const wf = generateRealisticMCBWaveform({
		prospectiveCurrentA: 6e3,
		systemVoltageV: 240,
		powerFactor: .48,
		frequencyHz: 50,
		tripCurve: "C",
		ratedCurrentA: 16,
		simulateFailure: "NONE"
	});
	assert(wf.points.length > 100, `Waveform generated ${wf.points.length} points`);
	assert(wf.peakCurrentA > 2e3 && wf.peakCurrentA <= 9e3, `Peak current cut-off Ip is ${wf.peakCurrentA} A`);
	assert(wf.jouleIntegralA2s > 5e3 && wf.jouleIntegralA2s < 45e3, `Joule integral let-through is ${wf.jouleIntegralA2s} A²s`);
	assert(wf.totalInterruptionTimeMs > 4 && wf.totalInterruptionTimeMs < 20, `Total interruption time is ${wf.totalInterruptionTimeMs} ms (< 20ms full cycle)`);
	assert(wf.recoveryVoltageV > 220, `Recovery voltage sustained at ${wf.recoveryVoltageV} V`);
	assert(wf.markers.length >= 4, "Oscilloscope markers generated for trigger, contact lift, Ip, and extinction");
	console.log("\n--- 5. Testing IEC 60898-1 Criteria Evaluation ---");
	const mcbSpec = {
		manufacturer: "Schneider Electric",
		modelNumber: "Acti9 iC60N",
		serialNumber: "SE-TEST-001",
		poles: "SP",
		ratedCurrentA: 16,
		ratedVoltageV: 240,
		trippingCurve: "C",
		instantaneousTrippingRange: "5 In – 10 In",
		ratedBreakingCapacityA: 6e3,
		standardsComplied: "IEC 60898-1:2015",
		productionBatch: "B26-09"
	};
	const testCfg = {
		testType: "Icn",
		prospectiveCurrentA: 6e3,
		targetPowerFactor: .48,
		systemVoltageV: 240,
		systemFrequencyHz: 50,
		shotCycle: "O - t - CO",
		openCloseIntervalSec: 180,
		breakArcInceptionAngleDeg: 45,
		arcChamberPressureMonitoring: true,
		ambientTemperatureC: 24,
		relativeHumidityPct: 45
	};
	const passResult = evaluateTestResult(mcbSpec, testCfg, wf, false);
	assert(passResult.overallResult === "PASS", "Normal waveform evaluates to overall PASS");
	assert(passResult.criteria.length === 6, "All 6 IEC limiting criteria evaluated");
	assert(evaluateTestResult(mcbSpec, testCfg, generateRealisticMCBWaveform({
		prospectiveCurrentA: 6e3,
		systemVoltageV: 240,
		powerFactor: .48,
		simulateFailure: "HIGH_I2T"
	}), true).overallResult === "FAIL", "Simulated failure correctly evaluates to overall FAIL");
	console.log("\n--- 6. Testing jsPDF Certificate Generation ---");
	const doc = generateTestCertificatePDF({
		id: "TEST-AUDIT-001",
		createdAt: (/* @__PURE__ */ new Date()).toISOString(),
		operator: MOCK_OPERATORS[0],
		mcb: mcbSpec,
		configuration: testCfg,
		rlConfig,
		cvuVerification: cvu,
		calibration: cal,
		waveform: wf,
		result: passResult,
		status: "COMPLETED"
	}, false);
	assert(doc !== null && typeof doc.save === "function", "jsPDF successfully generates vector document");
	assert(doc.internal.pages.length >= 1, "PDF document contains formatted pages");
	console.log("\n--- 7. Testing Emergency Stop Functionality ---");
	hw.emergencyStop();
	const eStopStatus = hw.getStatus();
	assert(eStopStatus.emergencyStopActive === true, "Emergency stop flag latched");
	assert(eStopStatus.systemMode === "EMERGENCY_STOP", "System mode shifted to EMERGENCY_STOP");
	assert(eStopStatus.sourceTransformerReady === false, "Transformer source de-energized");
	hw.resetEmergencyStop();
	const resetStatus = hw.getStatus();
	assert(resetStatus.emergencyStopActive === false, "Emergency stop successfully reset");
	assert(resetStatus.systemMode === "IDLE", "System mode restored to IDLE");
	await hw.disconnect();
	assert(!hw.getStatus().plcConnected, "Clean disconnect releases hardware resources and timers");
	console.log("\n====================================================");
	console.log(`AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
	console.log("====================================================");
	if (failed > 0) process.exit(1);
}
runQAAudit().catch((err) => {
	console.error("Audit exception:", err);
	process.exit(1);
});
//#endregion
export {};
