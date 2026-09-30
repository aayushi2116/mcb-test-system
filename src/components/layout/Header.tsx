import React, { useState, useEffect } from 'react';
import { useSystemStore } from '../../store/systemStore';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import {
  ShieldCheck,
  ShieldAlert,
  AlertOctagon,
  Clock,
  ChevronDown,
  LogOut,
  Sliders,
  CheckCircle2,
  Lock,
  Unlock,
} from 'lucide-react';
import { clsx } from 'clsx';

export const Header: React.FC = () => {
  const {
    hardwareStatus,
    triggerEmergencyStop,
    resetEmergencyStop,
    setInterlockDoor,
  } = useSystemStore();

  const { currentOperator, logout } = useAuthStore();
  const toast = useToastStore();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [showInterlockModal, setShowInterlockModal] = useState(false);
  const [showOperatorMenu, setShowOperatorMenu] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const day = now.getDate().toString().padStart(2, '0');
      const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const month = monthNames[now.getMonth()];
      const year = now.getFullYear();
      const hours = now.getHours().toString().padStart(2, '0');
      const mins = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${day} ${month} ${year} ${hours}:${mins}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleEStopToggle = () => {
    if (hardwareStatus.emergencyStopActive) {
      resetEmergencyStop();
      toast.info('Emergency Stop Reset', 'Safety loop restored. High-voltage circuits in safe idle state.');
    } else {
      triggerEmergencyStop();
      toast.error('EMERGENCY STOP ENGAGED', 'Power source disconnected. Capacitor bus grounded.');
    }
  };

  return (
    <>
      <header className="h-14 bg-white border-b border-slate-200 px-3 md:px-5 flex items-center justify-between sticky top-0 z-30 flex-shrink-0">
        {/* Left Section: Status Badges (matches Figma) */}
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          {/* Standard & Rig Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded text-[11px] font-mono font-medium text-slate-700 flex-shrink-0">
            <span className="font-semibold text-slate-900">IEC 60898-1:2015</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">BENCH #04</span>
          </div>

          {/* Mode Badge */}
          <div className="hidden lg:flex items-center gap-1 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded text-[11px] font-mono text-slate-600 flex-shrink-0">
            <span className="text-slate-400">MODE:</span>
            <span className="font-semibold text-teal-700">CALIBRATED AUTO</span>
          </div>

          {/* Timestamp */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded text-[11px] font-mono text-slate-600 flex-shrink-0">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{currentTime || 'SYNCHRONIZING...'}</span>
          </div>

            {/* Safety Interlock Pill */}
            <button
              type="button"
              onClick={() => setShowInterlockModal(true)}
              className={clsx(
                'flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono font-semibold border transition-all cursor-pointer flex-shrink-0',
                hardwareStatus.interlockClosed
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-red-50 text-red-800 border-red-300 hover:bg-red-100 animate-pulse'
              )}
              title="Safety Loop: Click to toggle interlock simulator"
            >
              {hardwareStatus.interlockClosed ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">INTERLOCK OK</span>
                  <span className="sm:hidden">INTL OK</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5 text-red-600" />
                  <span>INTERLOCK OPEN</span>
                </>
              )}
            </button>

            {/* System State Badge */}
            <div className="flex items-center flex-shrink-0">
              {hardwareStatus.emergencyStopActive ? (
                <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-100 border border-red-300 text-red-700 text-[11px] font-mono font-bold animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-red-600" />
                  E-STOP TRIPPED
                </span>
              ) : hardwareStatus.systemMode === 'TESTING' ? (
                <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-mono font-bold animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-amber-600" />
                  TEST IN PROGRESS
                </span>
              ) : hardwareStatus.systemMode === 'ARMED' ? (
                <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-50 border border-amber-300 text-amber-800 text-[11px] font-mono font-bold">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  ARMED & ENERGIZED
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-50 border border-emerald-300 text-emerald-700 text-[11px] font-mono font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  READY
                </span>
              )}
            </div>
        </div>

        {/* Flexible spacer */}
        <div className="flex-1 min-w-2" />

        {/* Right Section: Safety E-STOP Button & Operator Identity */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* CRITICAL EMERGENCY STOP BUTTON (Safety-Critical HMI Element) */}
          <button
            onClick={handleEStopToggle}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded font-mono font-bold text-xs tracking-wider transition-all shadow-xs cursor-pointer select-none active:scale-95',
              hardwareStatus.emergencyStopActive
                ? 'bg-amber-600 hover:bg-amber-700 text-white ring-2 ring-amber-400'
                : 'bg-red-600 hover:bg-red-700 text-white ring-2 ring-red-400'
            )}
            title="Direct Hardware Trip: De-energize high-voltage power transformer"
          >
            <AlertOctagon className="w-4 h-4 text-white" />
            <span>{hardwareStatus.emergencyStopActive ? 'RESET E-STOP' : 'E-STOP'}</span>
          </button>

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          {/* Operator Profile Menu (matches Figma 'Er. Sharma / Admin / Certifier') */}
          <div className="relative">
            <button
              onClick={() => setShowOperatorMenu(!showOperatorMenu)}
              className="flex items-center gap-2 py-1 px-1.5 rounded hover:bg-slate-100 transition-colors text-left cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                {currentOperator?.name?.charAt(0) || 'E'}
              </div>
              <div className="hidden sm:block text-right">
                <div className="text-xs font-semibold text-slate-800 leading-tight">
                  {currentOperator?.name || 'Er. Sharma'}
                </div>
                <div className="text-[10px] text-slate-500 font-mono leading-tight">
                  {currentOperator?.role === 'ADMIN'
                    ? 'Admin / Certifier'
                    : currentOperator?.role === 'QUALITY_AUDITOR'
                    ? 'Lead Auditor'
                    : 'Test Engineer'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {showOperatorMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white border border-slate-200 py-1 z-50 divide-y divide-slate-100">
                <div className="px-3 py-2 text-xs">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Authenticated Session</div>
                  <div className="font-semibold text-slate-800">{currentOperator?.name || 'Er. Sharma'}</div>
                  <div className="text-[11px] text-teal-700 font-mono">{currentOperator?.badgeNumber || 'OP-4829'}</div>
                </div>
                <div className="px-3 py-2 text-xs text-slate-600">
                  <div className="text-[10px] text-slate-400">ASSIGNED BAY</div>
                  <div className="font-mono text-slate-700">{currentOperator?.labStation || 'Station 02 - High-Current Rig'}</div>
                </div>
                <div className="p-1">
                  <button
                    onClick={() => {
                      setShowOperatorMenu(false);
                      logout();
                      toast.info('Signed Out', 'Operator session closed.');
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out / Switch Operator
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Safety Interlock Simulation Dialog */}
      <Modal
        isOpen={showInterlockModal}
        onClose={() => setShowInterlockModal(false)}
        title={
          <div className="flex items-center gap-2 text-slate-900 font-mono text-sm">
            <Sliders className="w-4 h-4 text-teal-600" />
            <span>Hardware Safety Loop Interlock Simulator</span>
          </div>
        }
        maxWidth="md"
        footer={<Button size="sm" onClick={() => setShowInterlockModal(false)}>Close Simulator</Button>}
      >
        <div className="space-y-3 text-xs text-slate-600">
          <p>
            In a physical IEC 60898-1 high-current test station, hardwired dual-channel safety relays monitor the test cell enclosure door, blast gate, and nitrogen purge pressure. You can toggle the primary safety circuit below:
          </p>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-900">Enclosure Blast Door & Polycarbonate Shield</div>
                <div className="text-slate-500 text-[11px]">SIL-3 dual-redundant safety microswitch</div>
              </div>
              <Button
                size="sm"
                variant={hardwareStatus.interlockClosed ? 'danger' : 'success'}
                onClick={() => {
                  setInterlockDoor(!hardwareStatus.interlockClosed);
                  toast.info(
                    hardwareStatus.interlockClosed ? 'Blast Door Opened' : 'Blast Door Closed & Latched',
                    hardwareStatus.interlockClosed ? 'Safety loop open. High-current charging inhibited.' : 'Safety loop verified.'
                  );
                }}
              >
                {hardwareStatus.interlockClosed ? 'Trip Loop (Open Door)' : 'Lock & Verify Door'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};
