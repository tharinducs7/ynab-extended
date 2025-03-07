/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { SharedData } from '@/types'; // Make sure this matches your types

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
  setPayeeChartData: (data: any) => void;
  payeeChartData: any;
  setMonthlyChartData: (data: any) => void;
  monthlyChartData: any;
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

  const [currentBudget, setCurrentBudget] = useState<Budget | null>(null);
  const [selectedCategoryGroupId, setSelectedCategoryGroupId] = useState<string | null>(null);
  const [selectedCategorySubId, setSelectedCategorySubId] = useState<string | null>(null);
  const [payeeChartData, setPayeeChartData] = useState<any | null>(null);
  const [monthlyChartData, setMonthlyChartData] = useState<any | null>(null);

  useEffect(() => {
    if (!currentBudget) {
      const defaultBudget = budgetsArrayWithAccounts.find(b => b.id === defaultBudgetId);
      if (defaultBudget) {
        setCurrentBudget({
          id: defaultBudget.id,
          name: defaultBudget.name,
          currency: defaultBudget.currency_format.iso_code,
          accounts: defaultBudget.accounts,
        });
      }
    }
  }, [currentBudget, budgetsArrayWithAccounts, defaultBudgetId]);

  return (
    <YNABContext.Provider
      value={{
        currentBudget,
        setCurrentBudget,
        selectedCategoryGroupId,
        setSelectedCategoryGroupId,
        selectedCategorySubId,
        setSelectedCategorySubId,
        setPayeeChartData,
        payeeChartData,
        monthlyChartData,
        setMonthlyChartData
      }}
    >
      {children}
    </YNABContext.Provider>
  );
};
