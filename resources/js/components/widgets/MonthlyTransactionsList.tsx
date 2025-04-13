/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/rules-of-hooks */
import React, { useState, useMemo } from "react";
import { useYNABContext } from "@/context/YNABContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import TransactionCard from "@/components/ui/transaction-card";
import { formatBalance } from "@/lib/utils";
import { ArrowUpCircle, ArrowDownCircle, Repeat } from "lucide-react";
import { DailyChartv2 } from "../charts/DailyChartv2";

// Define the Transaction interface
interface Transaction {
  id: string;
  date: string;
  amount: number; // stored in major units (e.g. cents or k units as per your usage)
  memo: string | null;
  payee_name: string;
  category_name: string | null;
  transfer_transaction_id?: string | null;
  subtransactions?: Transaction[];
}

export function MonthlyTransactionsList() {
  // Get current budget, selectedMonthlyData, and selectedDate from context.
  const { currentBudget, selectedMonthlyData, selectedDate } = useYNABContext();
  const currencyIso = currentBudget?.currency ?? "USD";

  if (!selectedMonthlyData || !selectedMonthlyData.transactions) {
    return <div>No monthly data available.</div>;
  }

  const transactions: Transaction[] = selectedMonthlyData.transactions;

  // ===============================
  // 1. SUPER FAST SEARCH FILTER
  // ===============================
  // useState for search query to filter by amount, payee, memo, category (or account)
  const [searchQuery, setSearchQuery] = useState("");

  // Filter transactions based on selectedDate (if provided) and search query.
  const filteredTransactions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return transactions.filter((txn) => {
      // Filter by date if selectedDate exists
      let matchesDate = true;
      if (selectedDate) {
        matchesDate = txn.date === selectedDate;
      }
      // Filter by search query across multiple fields: amount, payee, memo, category.
      let matchesSearch = true;
      if (query) {
        const amountStr = txn.amount.toString();
        // Check if any of these fields contain the search query substring (case-insensitive)
        matchesSearch =
          txn.payee_name.toLowerCase().includes(query) ||
          (txn.memo && txn.memo.toLowerCase().includes(query)) ||
          (txn.category_name && txn.category_name.toLowerCase().includes(query)) ||
          amountStr.includes(query);
        // If additional fields (like account) are added to the interface, include similar checks here.
      }
      return matchesDate && matchesSearch;
    });
  }, [transactions, selectedDate, searchQuery]);

  // ===============================
  // 2. GROUPING BY CATEGORY
  // ===============================
  // Instead of grouping transactions by month, group them by category.
  const groupedByCategory = useMemo(() => {
    const group: Record<string, Transaction[]> = {};
    filteredTransactions.forEach((txn) => {
      // Use the category name or default to "Uncategorized"
      const catKey = txn.category_name ? txn.category_name : "Uncategorized";
      if (!group[catKey]) {
        group[catKey] = [];
      }
      group[catKey].push(txn);
    });
    return group;
  }, [filteredTransactions]);

  // Get sorted category keys (alphabetically)
  const categoryKeys = Object.keys(groupedByCategory).sort();

  return (
    <div className="flex w-full h-[650px]">
      {/* Left side: Transaction list by Category */}
      <div className="w-3/5">
        {/* Search input for super fast filtering */}
        <div className="px-4 py-2">
          <input
            type="text"
            placeholder="Search by amount, payee, memo, category or account"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        <ScrollArea className="h-full px-4">
          {categoryKeys.length ? (
            categoryKeys.map((category) => {
              const categoryTxns = groupedByCategory[category];

              // Compute aggregated summaries for the category.
              let income = 0;
              let expense = 0;
              let transfers = 0;
              categoryTxns.forEach((txn) => {
                if (txn.transfer_transaction_id) {
                  transfers += txn.amount;
                } else if (txn.amount > 0) {
                  income += txn.amount;
                } else {
                  expense += txn.amount; // expenses are negative amounts
                }
              });

              return (
                <div key={category} className="mb-6">
                  {/* Category header with aggregated statistics */}
                  <div className="flex justify-between items-center my-4">
                    <div className="flex items-center font-bold text-lg">
                      {category}
                    </div>
                    <div className="flex items-center justify-end text-sm font-semibold">
                      <span className="text-green-700 flex items-center mr-2">
                        <ArrowUpCircle className="w-4 h-4 mr-1" />
                        {formatBalance(income / 1000, currencyIso)}
                      </span>
                      <span className="text-red-700 flex items-center mr-2">
                        <ArrowDownCircle className="w-4 h-4 mr-1" />
                        {formatBalance(Math.abs(expense) / 1000, currencyIso)}
                      </span>
                      <span className="text-yellow-700 flex items-center">
                        <Repeat className="w-4 h-4 mr-1" />
                        {formatBalance(transfers / 1000, currencyIso)}
                      </span>
                    </div>
                  </div>

                  {/* List transactions for this category */}
                  {categoryTxns.map((txn) => {
                    // If the transaction has subtransactions, display them indented.
                    if (txn.subtransactions && txn.subtransactions.length > 0) {
                      return (
                        <div key={txn.id}>
                          <TransactionCard
                            transaction={{
                              ...txn,
                              memo: txn.memo ?? "",
                              category_name: txn.category_name ?? "Uncategorized",
                              amountDisplay: formatBalance(txn.amount / 1000, currencyIso),
                            }}
                          />
                          {txn.subtransactions.map((sub) => (
                            <div key={sub.id} className="ml-6 border-l border-gray-300 pl-4">
                              <TransactionCard
                                transaction={{
                                  ...sub,
                                  memo: sub.memo ?? "",
                                  category_name: sub.category_name ?? "Uncategorized",
                                  amountDisplay: formatBalance(sub.amount / 1000, currencyIso),
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      );
                    } else {
                      return (
                        <TransactionCard
                          key={txn.id}
                          transaction={{
                            ...txn,
                            memo: txn.memo ?? "",
                            category_name: txn.category_name ?? "Uncategorized",
                            amountDisplay: formatBalance(txn.amount / 1000, currencyIso),
                          }}
                        />
                      );
                    }
                  })}
                </div>
              );
            })
          ) : (
            <p className="py-4">No transactions found matching the criteria.</p>
          )}
        </ScrollArea>
      </div>

      {/* Right side: Daily Summary and Aggregated Statistics */}
      <div className="w-2/5 p-4 border-l border-gray-300">
        <DailyChartv2 />
      </div>
    </div>
  );
}

export default MonthlyTransactionsList;
