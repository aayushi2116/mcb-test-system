import { create } from 'zustand';
import { SystemSettings } from '../types/system';
import { storageService } from '../services/storage/storageService';

interface SettingsState {
  settings: SystemSettings;
  updateSettings: (updates: Partial<SystemSettings>) => void;
  saveSettings: () => void;
  resetDefaults: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: storageService.getSettings(),

  updateSettings: (updates) => {
    set((state) => ({ settings: { ...state.settings, ...updates } }));
  },

  saveSettings: () => {
    storageService.saveSettings(get().settings);
  },

  resetDefaults: () => {
    const defaults = storageService.resetSettingsToDefault();
    set({ settings: defaults });
  },
}));
