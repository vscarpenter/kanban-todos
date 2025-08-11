import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Settings } from '@/lib/types';
import { taskDB } from '@/lib/utils/database';
import { exportSettings, ExportData } from '@/lib/utils/exportImport';

interface SettingsState {
  settings: Settings;
  isLoading: boolean;
  error: string | null;
}

interface SettingsActions {
  // State management
  setSettings: (settings: Settings) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Settings operations
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  
  // Import/Export operations
  exportSettings: () => ExportData;
  importSettings: (settings: Settings) => Promise<void>;
  
  // Store initialization
  initializeSettings: () => Promise<void>;
}

const defaultSettings: Settings = {
  theme: 'system',
  autoArchiveDays: 30,
  enableNotifications: true,
  enableKeyboardShortcuts: true,
  enableDebugMode: false,
  accessibility: {
    highContrast: false,
    reduceMotion: false,
    fontSize: 'medium',
  },
};

const initialState: SettingsState = {
  settings: defaultSettings,
  isLoading: false,
  error: null,
};

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setSettings: (settings) => set({ settings }),
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),

        updateSettings: async (updates) => {
          try {
            set({ isLoading: true, error: null });
            
            const updatedSettings = {
              ...get().settings,
              ...updates,
            };

            await taskDB.updateSettings(updatedSettings);
            
            set({ 
              settings: updatedSettings,
              isLoading: false 
            });

            // Theme changes are now handled by next-themes
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to update settings',
              isLoading: false 
            });
          }
        },

        resetSettings: async () => {
          try {
            set({ isLoading: true, error: null });
            
            await taskDB.updateSettings(defaultSettings);
            
            set({ 
              settings: defaultSettings,
              isLoading: false 
            });

            // Theme reset is now handled by next-themes
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to reset settings',
              isLoading: false 
            });
          }
        },

        // Export/Import operations
        exportSettings: () => {
          const { settings } = get();
          return exportSettings(settings);
        },

        importSettings: async (settings: Settings) => {
          try {
            set({ isLoading: true, error: null });
            
            // Update settings in database
            await taskDB.updateSettings(settings);
            
            // Update store state
            set({ 
              settings,
              isLoading: false 
            });

            // Theme changes are now handled by next-themes
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to import settings',
              isLoading: false 
            });
            throw error;
          }
        },

        initializeSettings: async () => {
          try {
            set({ isLoading: true, error: null });
            
            // Only initialize if we're in a browser environment
            if (typeof window === 'undefined') {
              set({ isLoading: false });
              return;
            }
            
            await taskDB.init();
            const storedSettings = await taskDB.getSettings();
            
            const settings = storedSettings || defaultSettings;
            
            set({ 
              settings,
              isLoading: false 
            });

            // Theme initialization is now handled by next-themes
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to initialize settings',
              isLoading: false 
            });
          }
        },
      }),
      {
        name: 'cascade-settings',
        partialize: (state) => ({ 
          settings: state.settings 
        }),
      }
    )
  )
);

