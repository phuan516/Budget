import { create } from 'zustand';
import { SheetMetadata } from '../google/sheets';

interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
}

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
  // User state
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;

  // Sheet selection state
  selectedSheet: SelectedSheet | null;
  setSelectedSheet: (sheet: SelectedSheet | null) => void;
  clearSelectedSheet: () => void;

  // Sheets list
  availableSheets: SheetMetadata[];
  setAvailableSheets: (sheets: SheetMetadata[]) => void;

  // Config state
  config: Config;
  setConfig: (config: Config) => void;
  updateConfig: (config: Partial<Config>) => void;

  // UI state
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

export const useStore = create<BudgetStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => {
    localStorage.removeItem('budget_user');
    localStorage.removeItem('budget_access_token');
    set({ user: null, selectedSheet: null });
  },

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
}));
