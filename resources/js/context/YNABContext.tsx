/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { SharedData } from '@/types'; // Ensure this matches your types

interface Budget {
    id: string;
    name: string;
    currency: string;
    accounts: any[];
}

interface YNABContextType {
    currentBudget: Budget | null;
    setCurrentBudget: (budget: Budget | null) => void;
    selectedCategoryGroupId: string | null;
    setSelectedCategoryGroupId: (id: string | null) => void;
    selectedCategorySubId: string | null;
    setSelectedCategorySubId: (id: string | null) => void;
    payeeChartData: any;
    setPayeeChartData: (data: any) => void;
    monthlyChartData: any;
    setMonthlyChartData: (data: any) => void;
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
    activeTab: "income" | "expense" | "transfers";
    setActiveTab: (tab: "income" | "expense" | "transfers") => void;
    isSheetOpen: boolean;
    setIsSheetOpen: React.Dispatch<React.SetStateAction<boolean>>;
    selectedAccount: any | null;
    setSelectedAccount: React.Dispatch<React.SetStateAction<any | null>>;
    selectedBudget: any | null;
    setSelectedBudget: React.Dispatch<React.SetStateAction<any | null>>;
}

const YNABContext = createContext<YNABContextType | undefined>(undefined);

export const useYNABContext = () => {
    const context = useContext(YNABContext);
    if (!context) {
        throw new Error('useYNABContext must be used within a YNABProvider');
    }
    return context;
};

export const YNABProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { budgetsArrayWithAccounts, defaultBudgetId } = usePage<SharedData>().props;

    const [currentBudget, setCurrentBudgetState] = useState<Budget | null>(() => {
        const storedBudget = sessionStorage.getItem("currentBudget");
        return storedBudget ? JSON.parse(storedBudget) : null;
    });

    const setCurrentBudget = (budget: Budget | null) => {
        if (budget) {
            sessionStorage.setItem("currentBudget", JSON.stringify(budget));
        } else {
            sessionStorage.removeItem("currentBudget");
        }
        setCurrentBudgetState(budget);
    };

    const [selectedCategoryGroupId, setSelectedCategoryGroupId] = useState<string | null>(null);
    const [selectedCategorySubId, setSelectedCategorySubId] = useState<string | null>(null);
    const [payeeChartData, setPayeeChartData] = useState<any | null>(null);
    const [monthlyChartData, setMonthlyChartData] = useState<any | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    const [activeTab, setActiveTab] = useState<"income" | "expense" | "transfers">(() => {
        return (sessionStorage.getItem("activeTab") as "income" | "expense" | "transfers") || "income";
      });

      useEffect(() => {
        sessionStorage.setItem("activeTab", activeTab);
      }, [activeTab]);

    useEffect(() => {
        const storedBudget = sessionStorage.getItem("currentBudget");
        if (storedBudget) {
          setCurrentBudgetState(JSON.parse(storedBudget));
        } else if (defaultBudgetId && budgetsArrayWithAccounts) {
          const defaultBudget = budgetsArrayWithAccounts.find((b: any) => b.id === defaultBudgetId);
          if (defaultBudget) {
            setCurrentBudget({
              id: defaultBudget.id,
              name: defaultBudget.name,
              currency: defaultBudget.currency_format.iso_code,
              accounts: defaultBudget.accounts,
            });
          }
        }
      }, [budgetsArrayWithAccounts, defaultBudgetId]);

      const [isSheetOpen, setIsSheetOpen] = useState(false);
      const [selectedAccount, setSelectedAccount] = useState<any | null>(null);
      const [selectedBudget, setSelectedBudget] = useState<any | null>(null);

    return (
        <YNABContext.Provider
            value={{
                currentBudget,
                setCurrentBudget,
                selectedCategoryGroupId,
                setSelectedCategoryGroupId,
                selectedCategorySubId,
                setSelectedCategorySubId,
                payeeChartData,
                setPayeeChartData,
                monthlyChartData,
                setMonthlyChartData,
                selectedDate,
                setSelectedDate,
                activeTab,
                setActiveTab,
                isSheetOpen,
                setIsSheetOpen,
                selectedAccount,
                setSelectedAccount,
                setSelectedBudget,
                selectedBudget
            }}
        >
            {children}
        </YNABContext.Provider>
    );
};
