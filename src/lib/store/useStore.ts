import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SheetMetadata } from '../google/sheets';

interface SelectedSheet {
  id: string;
  name: string;
  url: string;
}

interface Config {
  categories: { id: string; name: string }[];
  cards: { id: string; name: string }[];
  fixedExpenses: { id: string; name: string; amount: number }[];
}

interface BudgetStore {
  selectedSheet: SelectedSheet | null;
  setSelectedSheet: (sheet: SelectedSheet | null) => void;
  clearSelectedSheet: () => void;

  availableSheets: SheetMetadata[];
  setAvailableSheets: (sheets: SheetMetadata[]) => void;

  config: Config;
  setConfig: (config: Config) => void;
  updateConfig: (config: Partial<Config>) => void;

  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

export const useStore = create<BudgetStore>()(
  persist(
    (set) => ({
      selectedSheet: null,
      setSelectedSheet: (sheet) => set({ selectedSheet: sheet }),
      clearSelectedSheet: () => set({ selectedSheet: null }),

      availableSheets: [],
      setAvailableSheets: (sheets) => set({ availableSheets: sheets }),

      config: {
        categories: [],
        cards: [],
        fixedExpenses: [],
      },
      setConfig: (config) => set({ config }),
      updateConfig: (config) => set((state) => ({ config: { ...state.config, ...config } })),

      isSidebarOpen: false,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      closeSidebar: () => set({ isSidebarOpen: false }),
    }),
    {
      name: 'budget-store',
      partialize: (state) => ({ selectedSheet: state.selectedSheet }),
    }
  )
);
