import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface BudgetAccount {
    id: string;
    name: string;
    currency_format?: { iso_code: string };
    accounts: { id: string; name: string }[];
}

interface YnabState {
    token: string | null;
    authenticated: boolean;
    budgetsArrayWithAccounts: BudgetAccount[];
    defaultBudgetId: string | null;

    setToken: (token: string) => void;
    setAuthenticated: (authenticated: boolean) => void;
    setBudgets: (budgetsArrayWithAccounts: BudgetAccount[]) => void;
    setDefaultBudgetId: (budgetId: string | null) => void;
    reset: () => void;
}

export const useYnabStore = create<YnabState>()(
    persist(
        (set) => ({
            token: null,
            authenticated: false,
            budgetsArrayWithAccounts: [],
            defaultBudgetId: null,

            setToken: (token) => set({ token }),
            setAuthenticated: (authenticated) => set({ authenticated }),
            setBudgets: (budgetsArrayWithAccounts) => set({ budgetsArrayWithAccounts }),
            setDefaultBudgetId: (defaultBudgetId) => set({ defaultBudgetId }),

            reset: () => set({
                token: null,
                authenticated: false,
                budgetsArrayWithAccounts: [],
                defaultBudgetId: null,
            }),
        }),
        {
            name: 'ynab-storage', // storage key
            storage: createJSONStorage(() => sessionStorage),
        }
    )
);
