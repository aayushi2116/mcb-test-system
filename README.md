# Automated MCB Short-Circuit Test System (IEC 60898-1:2015)
### Precision Metrology, Instrumentation & Control Prototype

---

## 1. Executive Summary

This software application represents the control, instrumentation, data acquisition, and metrology reporting layer for an **Automated High-Current MCB Short-Circuit Test Bench**, designed in compliance with the test procedures and limiting parameters specified in **IEC 60898-1:2015** (Clause 9.12: *Test of rated short-circuit capacity*).

The system replaces error-prone manual testing, manual impedance calculation, and ad-hoc waveform measurements with an automated pipeline:

$$\text{Configuration} \longrightarrow \text{Switched R-L Matrix} \longrightarrow \text{CVU Diagnostic Verification} \longrightarrow \text{Calibration} \longrightarrow \text{Live MCB Pulse Test} \longrightarrow \text{Waveform Acquisition} \longrightarrow \text{Parameter Analysis} \longrightarrow \text{Compliance Verdict} \longrightarrow \text{Certificate Generation}$$

---

## 2. Key Capabilities & Implemented Features

- **Professional Light Industrial Theme**: Clean, high-contrast UI tailored for laboratory instrumentation engineers and metrology auditors. Uses white backgrounds, light gray surfaces, subtle borders, charcoal typography, and standard industrial status semantics (green for verified, amber for warning/armed, red for faults/emergency, teal for primary telemetry).
- **Hardware Abstraction Layer (`IHardwareController`)**: Strict decoupling between React UI and hardware drivers. Currently implemented via `MockHardwareController` with realistic async processes, delays, contactor states, and telemetry. Ready for seamless replacement by PLC, ESP32, and DAQ drivers.
- **Physics-Based Waveform Engine**: Generates authentic short-circuit waveforms capturing AC prospective fault current, DC asymmetry ($\tau = L/R$), make-switch inception angle, electrodynamic contact separation, arc voltage ramp inside deionisation splitter plates, current suppression, arc extinction, and damped high-frequency Transient Recovery Voltage (TRV).
- **Automated Parameter Extraction**:
  - Cut-off Peak Current ($I_p$)
  - Joule Integral / Specific Energy Let-Through ($I^2t$) in $\text{A}^2\text{s}$ (Class 3 limiting verification)
  - Total Interruption Time ($t_{int}$) and Arc Duration ($t_{arc}$)
  - Test circuit Power Factor ($\cos\phi$)
  - Power-Frequency Recovery Voltage ($V_{rec}$)
- **Switched R-L Impedance Matrix**: Automated synthesis of 5 parallel high-power resistor banks and 5 series air-core reactor taps to match target prospective current and power factor per IEC 60898-1 Table 17.
- **ESP32 CVU Verification**: Automated 6-channel diagnostic scan (Phase L1, Neutral N, Terminal Line, Terminal Load, Earth PE Continuity, Shunt Zero).
- **Traceable Calibration**: Low-duty current pulse verification against reference power analyzer (Yokogawa WT3000E).
- **Client-Side PDF Certificate Generation**: Generates official PDF test certificates with specimen specifications, test circuit settings, criteria audit table, official compliance verdict, and electronic signatory stamps using `jspdf`.
- **Persistent Test History & Recipe Management**: Full local database storage for historical shots, CSV export, filtering, and pre-configured IEC test recipes.

---

## 3. Technology Stack

- **Framework**: React 19 + TypeScript
- **Bundler & Tooling**: Vite 8, PostCSS, Autoprefixer
- **Styling**: Tailwind CSS (Custom Industrial theme tokens)
- **Routing**: React Router v7 (Protected routes, layout routing)
- **State Management**: Zustand (Auth, System Telemetry, Test Execution, Recipes, Settings, Toasts)
- **Waveform & Telemetry Visualizations**: Recharts (Dual-axis oscilloscope plots, markers, shaded arc regions)
- **Icons**: Lucide React
- **PDF Generation**: jsPDF (Vector certificate report layouts)
- **Local Persistence**: Browser LocalStorage & Session Cache

---

## 4. Project Directory Structure

```
mcb-test-system/
│
├── src/
│   ├── app/
│   │   ├── App.tsx                     # Main App component with RouterProvider
│   │   └── routes.tsx                  # Protected routes definition
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx           # Shell container
│   │   │   ├── Header.tsx              # Top bar (IEC ref, mode, clock, E-Stop, operator)
│   │   │   └── Sidebar.tsx             # Main navigation & hardware status
│   │   ├── common/
│   │   │   ├── Button.tsx              # Industrial buttons (variants, loading states)
│   │   │   ├── Card.tsx                # Card container with title, badge, and actions
│   │   │   ├── Badge.tsx               # Status badges (success, warning, danger, teal)
│   │   │   ├── Modal.tsx               # Accessible dialog modal
│   │   │   ├── Input.tsx               # Form input with units and validation
│   │   │   ├── StatusDot.tsx           # Hardware LED status indicator
│   │   │   └── ToastContainer.tsx      # System notification toast manager
│   │   ├── charts/
│   │   │   ├── LiveWaveformChart.tsx   # Real-time oscilloscope chart
│   │   │   └── DetailedWaveformAnalysisChart.tsx # Analysis chart with markers & TRV
│   │   ├── telemetry/
│   │   │   ├── LiveTelemetryStrip.tsx  # Top instrumentation telemetry strip
│   │   │   └── HardwareHealthCard.tsx  # Subsystem hardware status & control card
│   │   ├── testing/
│   │   │   ├── StepWizardNav.tsx       # 5-step test sequence navigation bar
│   │   │   └── SafetyInterlockChecklist.tsx # Pre-test safety interlock checklist
│   │   └── reports/
│   │
│   ├── pages/
│   │   ├── Login/LoginPage.tsx         # Operator login & quick demo switcher
│   │   ├── Dashboard/DashboardPage.tsx # Overview dashboard & metrics
│   │   ├── NewTest/
│   │   │   ├── TestWizardPage.tsx      # 5-step test orchestrator
│   │   │   └── steps/
│   │   │       ├── TestConfigStep.tsx      # Step 1: MCB & prospective parameters
│   │   │       ├── RLConfigStep.tsx        # Step 2: Switched R-L matrix synthesis
│   │   │       ├── CVUVerificationStep.tsx # Step 3: ESP32 CVU channel diagnostics
│   │   │       ├── CalibrationStep.tsx     # Step 4: Shunt & reference calibration
│   │   │       └── MCBTestingStep.tsx      # Step 5: Live pulse test & results
│   │   ├── RLConfiguration/RLConfigPage.tsx
│   │   ├── CVUVerification/CVUVerificationPage.tsx
│   │   ├── Calibration/CalibrationPage.tsx
│   │   ├── MCBTesting/MCBTestingPage.tsx
│   │   ├── WaveformMonitoring/WaveformMonitoringPage.tsx
│   │   ├── TestResults/TestResultsPage.tsx
│   │   ├── WaveformAnalysis/WaveformAnalysisPage.tsx
│   │   ├── TestReport/TestReportPage.tsx
│   │   ├── TestHistory/TestHistoryPage.tsx
│   │   ├── TestRecipes/TestRecipesPage.tsx
│   │   └── Settings/SettingsPage.tsx
│   │
│   ├── services/
│   │   ├── hardware/
│   │   │   ├── hardwareInterface.ts    # IHardwareController contract
│   │   │   ├── mockHardwareService.ts  # Realistic hardware simulation
│   │   │   └── hardwareService.ts      # Active hardware service manager singleton
│   │   ├── reports/
│   │   │   └── pdfService.ts           # jsPDF test certificate generation
│   │   ├── storage/
│   │   │   └── storageService.ts       # Persistence service for tests, recipes, settings
│   │   └── testEngine/
│   │
│   ├── store/
│   │   ├── authStore.ts                # Current operator & authentication
│   │   ├── systemStore.ts              # Hardware status, telemetry, emergency stop
│   │   ├── testStore.ts                # Active test wizard & execution state
│   │   ├── recipeStore.ts              # Test recipes management
│   │   ├── settingsStore.ts            # System settings persistence
│   │   └── toastStore.ts               # Toast notifications
│   │
│   ├── types/
│   │   ├── system.ts                   # Operator, HardwareStatus, Settings
│   │   ├── hardware.ts                 # CVU, RL, Calibration, Telemetry
│   │   ├── waveform.ts                 # WaveformPoint, Markers, WaveformCapture
│   │   ├── test.ts                     # MCBSpecification, TestConfiguration, TestResult
│   │   ├── recipe.ts                   # TestRecipe
│   │   ├── report.ts                   # ReportCertificate
│   │   └── index.ts                    # Unified export
│   │
│   ├── data/
│   │   ├── mockOperators.ts            # Realistic lab operators
│   │   ├── mockRecipes.ts              # IEC standard test recipes
│   │   └── mockTests.ts                # Seeded historical test database
│   │
│   ├── utils/
│   │   ├── electricalCalculations.ts   # Impedance, power factor & bank synthesis
│   │   ├── waveformGenerator.ts        # Physics-based short-circuit waveform engine
│   │   ├── resultEvaluator.ts          # IEC 60898-1 criteria verification logic
│   │   └── formatters.ts               # Engineering units formatters (kA, mΩ, ms, MA²s)
│   │
│   └── constants/
│       ├── iecStandards.ts             # IEC 60898-1 Table 17, curves, ratings
│       └── defaultSettings.ts          # Default laboratory parameters
│
├── start-dev.bat                       # One-click Windows dev server launcher
├── build.bat                           # One-click Windows build script
└── README.md
```

---

## 5. Hardware Abstraction & Future Integration Points

The UI components never interface directly with raw hardware or mock internals. All interactions flow through the **`IHardwareController`** interface:

```typescript
export interface IHardwareController {
  connect(): Promise<boolean>;
  disconnect(): Promise<void>;
  getStatus(): HardwareStatus;
  setInterlockDoor(closed: boolean): void;
  setPneumaticClamp(engaged: boolean): Promise<boolean>;
  emergencyStop(): void;
  resetEmergencyStop(): boolean;
  verifyCVU(onProgress?: (pct: number, step: string) => void): Promise<CVUVerification>;
  configureRL(config: RLConfiguration): Promise<boolean>;
  startCalibration(targetCurrentA: number, targetPF: number): Promise<CalibrationResult>;
  armTestSequence(mcb: MCBSpecification, config: TestConfiguration): Promise<boolean>;
  startTest(mcb: MCBSpecification, config: TestConfiguration, onStageChange?, onTelemetry?): Promise<WaveformCapture>;
  abortTest(): void;
  captureWaveform(): Promise<WaveformCapture>;
  subscribeTelemetry(listener: TelemetryListener): () => void;
  subscribeHardwareStatus(listener: (status: HardwareStatus) => void): () => void;
}
```

### Future Physical Hardware Integration Architecture:
When integrating physical hardware:
1. Create a `PhysicalHardwareController` implementing `IHardwareController`.
2. Connect to the Industrial PC / Gateway over:
   - **PLC (Siemens S7-1500 / Beckhoff)**: Modbus TCP or OPC-UA for contactors, pneumatic clamp valve, and safety door interlocks.
   - **ESP32 CVU**: USB-RS485 Serial protocol streaming 16-bit isolated ADC samples for 6 channels.
   - **DAQ (NI PXIe / USB Oscilloscope)**: SCPI / NI-DAQmx C-API or WebSocket gateway streaming Rogowski coil waveform points at 100 kS/s.
3. Update `HardwareServiceManager` to instantiate `PhysicalHardwareController` when physical hardware is present. **No UI components or pages need modification.**

---

## 6. How to Run Locally

### Prerequisites
Node.js (v18+) and npm/pnpm.

### Starting the Development Server
On Windows:
- Double-click `start-dev.bat`, or
- Run in PowerShell/Command Prompt:
  ```powershell
  npm run dev
  ```
The application will launch at: `http://localhost:5173`

### Running the Production Build
- Double-click `build.bat`, or
- Run in terminal:
  ```powershell
  npm run build
  ```
The optimized production bundle will be created in `dist/`.

---

## 7. Complete End-to-End Acceptance Workflow

1. **Sign In**: Launch application. On the login page, click any of the Demo profiles (e.g. *Dr. Marcus Vance, Lead Test Engineer*) or input your operator ID.
2. **Dashboard**: View hardware station readiness, live telemetry strip, and summary metrics.
3. **Launch Test**: Click **"Start New Test"** in the top action bar.
4. **Step 1 (Configuration)**: Review or customize MCB ratings (e.g. Schneider Acti9 iC60N, SP, 16A, Curve C) and prospective current (6000A). Observe the real-time calculation box update circuit impedance $Z$, resistance $R$, and inductance $L$. Click **Next Step**.
5. **Step 2 (R-L Matrix)**: Review selected resistor banks and inductor taps. Click **"Auto-Synthesize Optimal Combination"** to engage the optimal switched banks. Click **Next Step**.
6. **Step 3 (CVU Verification)**: Click **"Verify CVU Channels"**. Watch the animated scan verify the 6 diagnostic analog channels (Phase, Neutral, MCB Input, MCB Output, Ground Continuity, Shunt Zero). Click **Next Step**.
7. **Step 4 (Calibration)**: Click **"Start Circuit Calibration"**. The system applies a low-duty probe pulse, compares measured current against reference tolerances, and issues a calibration certificate. Click **Next Step**.
8. **Step 5 (Live MCB Testing)**:
   - Verify safety checklist.
   - Click **"Arm System"** (pneumatic clamp locks at 6.0 bar, bus charges).
   - Click **"TRIGGER TEST SEQUENCE"**.
   - Watch the animated oscilloscope waveform stream in real-time as the short-circuit pulse fires, contacts separate, arc is quenched, and current is interrupted.
   - The evaluated IEC 60898-1 criteria table automatically renders with the final **PASS** or **FAIL** verdict.
   - Click **"Save Test to Database"**.
9. **Waveform Analysis**: Click **"Inspect Analysis"** to view high-resolution oscilloscope markers (Trigger, Contact Lift, Peak Cut-off $I_p$, Arc Extinction, Recovery Voltage TRV) and zoom windows.
10. **Certificate Report**: Click **"Test Reports"** to preview the formal metrology certificate, then click **"Download Official PDF"** to generate and download the PDF.
11. **History Database**: Click **"Test History"** to see your newly saved test alongside seeded historical records. Search, filter by result or brand, and export to CSV.
12. **Settings**: Modify laboratory metadata or sampling rates and click **"Save Settings"** or **"Restore Defaults"**.
