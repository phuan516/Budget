import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SheetMetadata } from '../google/sheets';

export interface SelectedSheet {
  id: string;
  name: string;
  url: string;
}

export interface Config {
  categories: { id: string; name: string }[];
  cards: { id: string; name: string }[];
  fixedExpenses: { id: string; name: string; amount: number }[];
  monthlyIncome: number;
  fixedExpenseOverrides: { [monthKey: string]: { [expenseName: string]: number } };
  fixedExpenseOverrideNotes: { [monthKey: string]: { [expenseName: string]: string } };
  savingGoals: { id: string; name: string; amount: number; initialAmount: number }[];
}

export interface Transaction {
  id: string;
  tab: string;
  row: number;
  date: string;
  amount: number;
  category: string;
  card: string;
  note: string;
}

export type DashboardTab = 'overview' | 'transactions' | 'config' | 'everything';

interface BudgetStore {
  selectedSheet: SelectedSheet | null;
  setSelectedSheet: (sheet: SelectedSheet | null) => void;
  clearSelectedSheet: () => void;

  availableSheets: SheetMetadata[];
  setAvailableSheets: (sheets: SheetMetadata[]) => void;

  config: Config;
  setConfig: (config: Config) => void;
  updateConfig: (config: Partial<Config>) => void;

  transactions: Transaction[];
  setTransactions: (txns: Transaction[]) => void;

  monthTabKeys: string[];
  setMonthTabKeys: (keys: string[]) => void;

  monthConfigs: Record<string, { income?: number; incomeNote?: string; fixedExpenses: { name: string; amount: number; note?: string }[]; incomeEntries?: { id: string; date: string; amount: number; note?: string }[] }>;
  setMonthConfigs: (configs: Record<string, { income?: number; incomeNote?: string; fixedExpenses: { name: string; amount: number; note?: string }[]; incomeEntries?: { id: string; date: string; amount: number; note?: string }[] }>) => void;

  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
}

const DEFAULT_CONFIG: Config = {
  categories: [],
  cards: [],
  fixedExpenses: [],
  monthlyIncome: 0,
  fixedExpenseOverrides: {},
  fixedExpenseOverrideNotes: {},
  savingGoals: [],
};

export const useStore = create<BudgetStore>()(
  persist(
    (set) => ({
      selectedSheet: null,
      setSelectedSheet: (sheet) => set({ selectedSheet: sheet }),
      clearSelectedSheet: () => set({ selectedSheet: null, config: DEFAULT_CONFIG, transactions: [] }),

      availableSheets: [],
      setAvailableSheets: (sheets) => set({ availableSheets: sheets }),

      config: DEFAULT_CONFIG,
      setConfig: (config) => set({ config }),
      updateConfig: (config) => set((state) => ({ config: { ...state.config, ...config } })),

      transactions: [],
      setTransactions: (transactions) => set({ transactions }),

      monthTabKeys: [],
      setMonthTabKeys: (monthTabKeys) => set({ monthTabKeys }),

      monthConfigs: {},
      setMonthConfigs: (monthConfigs) => set({ monthConfigs }),

      activeTab: 'overview',
      setActiveTab: (activeTab) => set({ activeTab }),
    }),
    {
      name: 'budget-store',
      partialize: (state) => ({ selectedSheet: state.selectedSheet }),
    }
  )
);
