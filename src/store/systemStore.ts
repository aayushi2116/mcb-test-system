import { create } from 'zustand';
import { HardwareStatus } from '../types/system';
import { LiveTelemetry } from '../types/hardware';
import { hardwareService } from '../services/hardware/hardwareService';

interface SystemState {
  hardwareStatus: HardwareStatus;
  telemetry: LiveTelemetry;
  sidebarExpanded: boolean;
  mobileDrawerOpen: boolean;
  toggleSidebar: () => void;
  setMobileDrawerOpen: (open: boolean) => void;
  setInterlockDoor: (closed: boolean) => void;
  setPneumaticClamp: (engaged: boolean) => Promise<boolean>;
  triggerEmergencyStop: () => void;
  resetEmergencyStop: () => void;
  reconnectHardware: () => Promise<boolean>;
}

const initialTelemetry: LiveTelemetry = {
  timestamp: Date.now(),
  currentRmsA: 0,
  voltageRmsV: 240.2,
  instantaneousCurrentA: 0,
  instantaneousVoltageV: 0,
  powerFactor: 1.0,
  frequencyHz: 50.0,
  temperatureTransformerC: 32.4,
  temperatureArcChuteC: 25.8,
  arcPressureBar: 0.01,
  pneumaticClampPressureBar: 6.2,
  mcbContactState: 'OPEN',
  isArcing: false,
  busCharged: true,
};

export const useSystemStore = create<SystemState>((set) => ({
  hardwareStatus: hardwareService.getStatus(),
  telemetry: initialTelemetry,
  sidebarExpanded: true, // Always true by default - full expanded desktop sidebar on load
  mobileDrawerOpen: false,

  toggleSidebar: () => {
    set((state) => ({ sidebarExpanded: !state.sidebarExpanded }));
  },

  setMobileDrawerOpen: (open: boolean) => {
    set({ mobileDrawerOpen: open });
  },

  setInterlockDoor: (closed: boolean) => {
    hardwareService.setInterlockDoor(closed);
    set({ hardwareStatus: hardwareService.getStatus() });
  },

  setPneumaticClamp: async (engaged: boolean) => {
    const res = await hardwareService.setPneumaticClamp(engaged);
    set({ hardwareStatus: hardwareService.getStatus() });
    return res;
  },

  triggerEmergencyStop: () => {
    hardwareService.emergencyStop();
    set({ hardwareStatus: hardwareService.getStatus() });
  },

  resetEmergencyStop: () => {
    hardwareService.resetEmergencyStop();
    set({ hardwareStatus: hardwareService.getStatus() });
  },

  reconnectHardware: async () => {
    const res = await hardwareService.connect();
    set({ hardwareStatus: hardwareService.getStatus() });
    return res;
  },
}));

// Safely subscribe outside the store initializer using setState
hardwareService.subscribeHardwareStatus((status) => {
  useSystemStore.setState({ hardwareStatus: status });
});

hardwareService.subscribeTelemetry((telemetry) => {
  useSystemStore.setState({ telemetry });
});
