import React, { useState } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import { useSystemStore } from '../../store/systemStore';
import { useToastStore } from '../../store/toastStore';
import { Button } from '../../components/common/Button';
import { HardwareHealthCard } from '../../components/telemetry/HardwareHealthCard';
import {
  Settings,
  Save,
  RotateCcw,
  Sliders,
  Shield,
  FileText,
  Cpu,
  Globe,
  Radio,
  Building,
  CheckCircle2,
} from 'lucide-react';
import { clsx } from 'clsx';

type SettingsCategory =
  | 'LABORATORY'
  | 'INSTRUMENTATION'
  | 'SAFETY'
  | 'NETWORK'
  | 'REPORTING';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, saveSettings, resetDefaults } = useSettingsStore();
  const { hardwareStatus } = useSystemStore();
  const toast = useToastStore();

  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('LABORATORY');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings();
    toast.success('Settings Saved', 'Configuration written to persistent station memory.');
  };

  const handleReset = () => {
    if (window.confirm('Restore system settings to factory defaults? All custom calibration offsets and thresholds will reset.')) {
      resetDefaults();
      toast.info('Factory Defaults Restored', 'All settings reset to baseline IEC profiles.');
    }
  };

  const navCategories = [
    { id: 'LABORATORY' as const, label: 'Laboratory & Facility', icon: Building, desc: 'Station ID, NABL accreditation, facility ref' },
    { id: 'INSTRUMENTATION' as const, label: 'Instrumentation & DAQ', icon: ActivityIcon, desc: 'Sampling frequency, window duration, sensors' },
    { id: 'SAFETY' as const, label: 'Safety & Interlocks', icon: Shield, desc: 'Pneumatics, door switches, emergency trip limits' },
    { id: 'NETWORK' as const, label: 'Network & Hardware', icon: Globe, desc: 'Modbus TCP, ESP32 COM port, PLC interface' },
    { id: 'REPORTING' as const, label: 'Reporting & Metrology', icon: FileText, desc: 'Certificate title, inspector stamp, auto-save' },
  ];

  function ActivityIcon(props: any) {
    return <Cpu {...props} />;
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <div className="text-[10px] font-mono text-teal-700 font-bold uppercase tracking-wider">
            STATION 04 • HARDWARE & METROLOGY SYSTEM PARAMETERS
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Engineering Configuration Console
          </h1>
          <p className="text-xs text-slate-500">
            Global laboratory parameters, safety trip thresholds, and instrumentation acquisition options.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Restore Defaults
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={handleSave}
            leftIcon={<Save className="w-3.5 h-3.5" />}
          >
            Save Settings
          </Button>
        </div>
      </div>

      {/* Main Settings Grid with Vertical Section Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left Category Nav (col-span-4) */}
        <div className="md:col-span-4 bg-white border border-slate-200 rounded-md p-2 shadow-2xs space-y-1">
          <div className="px-3 py-2 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            CONFIGURATION SECTIONS
          </div>
          {navCategories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={clsx(
                  'w-full text-left p-2.5 rounded transition-all flex items-start gap-3 cursor-pointer',
                  isSelected
                    ? 'bg-teal-50 border border-teal-200 text-teal-950 font-semibold'
                    : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                )}
              >
                <Icon
                  className={clsx(
                    'w-4 h-4 mt-0.5 flex-shrink-0',
                    isSelected ? 'text-teal-600' : 'text-slate-400'
                  )}
                />
                <div className="min-w-0">
                  <div className="text-xs font-semibold">{cat.label}</div>
                  <div className="text-[10px] text-slate-400 truncate">{cat.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Active Configuration Panel (col-span-8) */}
        <div className="md:col-span-8 bg-white border border-slate-200 rounded-md p-5 shadow-2xs space-y-4">
          {/* Category 1: LABORATORY */}
          {activeCategory === 'LABORATORY' && (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-2">
                <h3 className="text-sm font-bold text-slate-900 font-mono uppercase">
                  Laboratory Facility & Accreditation
                </h3>
                <p className="text-xs text-slate-500">
                  Physical testing institution details printed on ISO/IEC 17025 test certificates.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-mono text-slate-500 uppercase mb-1">
                    Testing Facility Name
                  </label>
                  <input
                    type="text"
                    value={settings.labName}
                    onChange={(e) => updateSettings({ labName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:border-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-500 uppercase mb-1">
                    Station Test Bay ID
                  </label>
                  <input
                    type="text"
                    value={settings.stationId}
                    onChange={(e) => updateSettings({ stationId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:bg-white focus:border-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-500 uppercase mb-1">
                    Accredited Standard Reference
                  </label>
                  <input
                    type="text"
                    value={settings.accreditedStandard}
                    onChange={(e) => updateSettings({ accreditedStandard: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:bg-white focus:border-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-500 uppercase mb-1">
                    Lead Metrology Inspector
                  </label>
                  <input
                    type="text"
                    value={settings.inspectorName}
                    onChange={(e) => updateSettings({ inspectorName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:border-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Category 2: INSTRUMENTATION & DAQ */}
          {activeCategory === 'INSTRUMENTATION' && (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-2">
                <h3 className="text-sm font-bold text-slate-900 font-mono uppercase">
                  High-Speed DAQ & Sensor Digitization
                </h3>
                <p className="text-xs text-slate-500">
                  Transducer digitizer sampling rates, capture window buffer sizes, and baseline voltages.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-mono text-slate-500 uppercase mb-1">
                    Sample Rate (kS/s)
                  </label>
                  <select
                    value={settings.daqSampleRateKhz}
                    onChange={(e) => updateSettings({ daqSampleRateKhz: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:bg-white focus:border-teal-500 focus:outline-hidden"
                  >
                    <option value={20}>20 kS/s (Standard 0.05ms/pt)</option>
                    <option value={50}>50 kS/s (High-rate 0.02ms/pt)</option>
                    <option value={100}>100 kS/s (Rogowski Wideband)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-500 uppercase mb-1">
                    Window Duration (ms)
                  </label>
                  <input
                    type="number"
                    value={settings.waveformDurationMs}
                    onChange={(e) => updateSettings({ waveformDurationMs: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:bg-white focus:border-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-500 uppercase mb-1">
                    Default Supply Voltage (V)
                  </label>
                  <input
                    type="number"
                    value={settings.defaultSystemVoltageV}
                    onChange={(e) => updateSettings({ defaultSystemVoltageV: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:bg-white focus:border-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Category 3: SAFETY */}
          {activeCategory === 'SAFETY' && (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-2">
                <h3 className="text-sm font-bold text-slate-900 font-mono uppercase">
                  Safety Interlock Protocols & Trip Thresholds
                </h3>
                <p className="text-xs text-slate-500">
                  Hardware fault response, pneumatic clamp min pressures, and audible alarm policies.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <label className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded cursor-pointer">
                  <div>
                    <span className="font-semibold text-slate-900 block font-mono">
                      Strict Safety Loop Interlock Enforcement
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      Inhibit pulse arming if door microswitch or blast shield is open
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.strictInterlockEnforced}
                    onChange={(e) => updateSettings({ strictInterlockEnforced: e.target.checked })}
                    className="w-4 h-4 text-teal-600 rounded border-slate-300"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded cursor-pointer">
                  <div>
                    <span className="font-semibold text-slate-900 block font-mono">
                      Simulate High-Voltage Audio Siren & Buzzer
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      Audible 85 dB warning horn during 3-second arming sequence
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.audioBuzzerEnabled}
                    onChange={(e) => updateSettings({ audioBuzzerEnabled: e.target.checked })}
                    className="w-4 h-4 text-teal-600 rounded border-slate-300"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Category 4: NETWORK */}
          {activeCategory === 'NETWORK' && (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-2">
                <h3 className="text-sm font-bold text-slate-900 font-mono uppercase">
                  Network Communications & Fieldbus Interfaces
                </h3>
                <p className="text-xs text-slate-500">
                  Industrial fieldbus endpoints for PLC sequencer and ESP32 conditioning unit.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
                  <span className="text-slate-500 uppercase text-[10px] block">MODBUS TCP SEQUENCER</span>
                  <div className="font-bold text-slate-900">192.168.1.104 : 502</div>
                  <span className="text-[10px] text-emerald-700 font-semibold block">Connected (Ping 2.1ms)</span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
                  <span className="text-slate-500 uppercase text-[10px] block">ESP32 CVU SERIAL LINK</span>
                  <div className="font-bold text-slate-900">COM3 @ 115200 8-N-1</div>
                  <span className="text-[10px] text-emerald-700 font-semibold block">Opto-Isolated UART OK</span>
                </div>
              </div>
            </div>
          )}

          {/* Category 5: REPORTING */}
          {activeCategory === 'REPORTING' && (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-2">
                <h3 className="text-sm font-bold text-slate-900 font-mono uppercase">
                  Reporting & Traceability Policy
                </h3>
                <p className="text-xs text-slate-500">
                  Automatic archiving, PDF format presets, and export schemas.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <label className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded cursor-pointer">
                  <div>
                    <span className="font-semibold text-slate-900 block font-mono">
                      Automatic SQLite Archive on Shot Completion
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      Instantly persist waveform vectors and IEC compliance verdicts
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoSaveTests}
                    onChange={(e) => updateSettings({ autoSaveTests: e.target.checked })}
                    className="w-4 h-4 text-teal-600 rounded border-slate-300"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Station Hardware Summary Sub-panel */}
          <HardwareHealthCard />
        </div>
      </div>
    </div>
  );
};
