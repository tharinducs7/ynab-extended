/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/rules-of-hooks */
import React, { useMemo } from "react";
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

// Define the DailySummary interface (based on your sample)
interface DailySummary {
  date: string;
  sum_income: number;
  sum_expenses: number;
  net_value: number;
  active_categories: { id: string; name: string; sum_income: number; sum_expense: number }[];
  active_payees: { id: string; name: string; sum_income: number; sum_expense: number }[];
  active_accounts: { id: string; name: string; note: string; sum_income: number; sum_expense: number }[];
}

export function MonthlyTransactionsList() {
  // Get current budget, selectedMonthlyData, and selectedDate from context.
  const { currentBudget, selectedMonthlyData, selectedDate } = useYNABContext();
  const currencyIso = currentBudget?.currency ?? "USD";

  if (!selectedMonthlyData || !selectedMonthlyData.transactions) {
    return <div>No monthly data available.</div>;
  }

  const transactions: Transaction[] = selectedMonthlyData.transactions;
  const dailySummaries: DailySummary[] = selectedMonthlyData.daily_summary || [];

  // If a selected date is provided, filter transactions by that date.
  const filteredTransactions = useMemo(() => {
    if (selectedDate) {
      return transactions.filter((txn) => txn.date === selectedDate);
    }
    return transactions;
  }, [transactions, selectedDate]);

  // Group transactions by month using the first 7 characters ("YYYY-MM")
  const groupedTransactions = useMemo(() => {
    const map: Record<string, Transaction[]> = {};
    filteredTransactions.forEach((txn) => {
      const monthKey = txn.date.slice(0, 7); // e.g. "2025-04"
      if (!map[monthKey]) {
        map[monthKey] = [];
      }
      map[monthKey].push(txn);
    });
    return map;
  }, [filteredTransactions]);

  // Sort month keys descending (most recent month first)
  const monthKeys = Object.keys(groupedTransactions).sort((a, b) =>
    b.localeCompare(a)
  );

  // ----- DAILY SUMMARY STATS (Right Panel) -----

 // Filter daily summaries based on selectedDate (if set), otherwise use all summaries.
  const filteredDailySummaries = useMemo(() => {
    if (selectedDate) {
      return dailySummaries.filter((ds) => ds.date === selectedDate);
    }
    return dailySummaries;
  }, [dailySummaries, selectedDate]);

  // Highest/lowest spending/income dates from daily summaries.
  const highestSpendingDay = useMemo(() => {
    return dailySummaries.length
      ? dailySummaries.reduce((acc, curr) =>
          curr.sum_expenses > acc.sum_expenses ? curr : acc
        )
      : null;
  }, [dailySummaries]);

  const lowestSpendingDay = useMemo(() => {
    return dailySummaries.length
      ? dailySummaries.reduce((acc, curr) =>
          curr.sum_expenses < acc.sum_expenses ? curr : acc
        )
      : null;
  }, [dailySummaries]);

  const highestIncomeDay = useMemo(() => {
    return dailySummaries.length
      ? dailySummaries.reduce((acc, curr) =>
          curr.sum_income > acc.sum_income ? curr : acc
        )
      : null;
  }, [dailySummaries]);

  const lowestIncomeDay = useMemo(() => {
    return dailySummaries.length
      ? dailySummaries.reduce((acc, curr) =>
          curr.sum_income < acc.sum_income ? curr : acc
        )
      : null;
  }, [dailySummaries]);

  // Count number of days with expense/income
  const numExpenseDays = useMemo(() => {
    return dailySummaries.filter((ds) => ds.sum_expenses > 0).length;
  }, [dailySummaries]);
  const numIncomeDays = useMemo(() => {
    return dailySummaries.filter((ds) => ds.sum_income > 0).length;
  }, [dailySummaries]);

  // Aggregate active payees across daily summaries
  const aggregatedPayees = useMemo(() => {
    const map: Record<string, { id: string; name: string; sum_income: number; sum_expense: number }> = {};
    dailySummaries.forEach((ds) => {
      ds.active_payees.forEach((p) => {
        if (!map[p.id]) {
          map[p.id] = { ...p };
        } else {
          map[p.id].sum_income += p.sum_income;
          map[p.id].sum_expense += p.sum_expense;
        }
      });
    });
    return Object.values(map);
  }, [dailySummaries]);

  const highestExpensePayee = useMemo(() => {
    return aggregatedPayees.length
      ? aggregatedPayees.reduce((acc, curr) =>
          curr.sum_expense > acc.sum_expense ? curr : acc
        )
      : null;
  }, [aggregatedPayees]);

  const lowestExpensePayee = useMemo(() => {
    return aggregatedPayees.length
      ? aggregatedPayees.reduce((acc, curr) =>
          curr.sum_expense < acc.sum_expense ? curr : acc
        )
      : null;
  }, [aggregatedPayees]);

  const highestIncomePayee = useMemo(() => {
    return aggregatedPayees.length
      ? aggregatedPayees.reduce((acc, curr) =>
          curr.sum_income > acc.sum_income ? curr : acc
        )
      : null;
  }, [aggregatedPayees]);

  const lowestIncomePayee = useMemo(() => {
    return aggregatedPayees.length
      ? aggregatedPayees.reduce((acc, curr) =>
          curr.sum_income < acc.sum_income ? curr : acc
        )
      : null;
  }, [aggregatedPayees]);

  // Aggregate active categories across daily summaries
  const aggregatedCategories = useMemo(() => {
    const map: Record<string, { id: string; name: string; sum_income: number; sum_expense: number }> = {};
    dailySummaries.forEach((ds) => {
      ds.active_categories.forEach((cat) => {
        if (!map[cat.id]) {
          map[cat.id] = { ...cat };
        } else {
          map[cat.id].sum_income += cat.sum_income;
          map[cat.id].sum_expense += cat.sum_expense;
        }
      });
    });
    return Object.values(map);
  }, [dailySummaries]);

  const highestExpenseCategory = useMemo(() => {
    return aggregatedCategories.length
      ? aggregatedCategories.reduce((acc, curr) =>
          curr.sum_expense > acc.sum_expense ? curr : acc
        )
      : null;
  }, [aggregatedCategories]);

  const lowestExpenseCategory = useMemo(() => {
    return aggregatedCategories.length
      ? aggregatedCategories.reduce((acc, curr) =>
          curr.sum_expense < acc.sum_expense ? curr : acc
        )
      : null;
  }, [aggregatedCategories]);

  console.log(filteredDailySummaries, "filteredDailySummaries");

  return (
    <div className="flex w-full h-[650px]">
      {/* Left side: Transaction list by month */}
      <div className="w-3/5">
        <ScrollArea className="h-full px-4">
          {monthKeys.length ? (
            monthKeys.map((month) => {
              const monthTxns = groupedTransactions[month];

              // Compute summaries for the month.
              let income = 0;
              let expense = 0;
              let transfers = 0;
              monthTxns.forEach((txn) => {
                if (txn.transfer_transaction_id) {
                  transfers += txn.amount;
                } else if (txn.amount > 0) {
                  income += txn.amount;
                } else {
                  expense += txn.amount; // expenses will be negative
                }
              });

              // Use the month string from the transaction date (e.g. "2025-04")
              // Create a Date from the first day of the month for header display.
              const monthDate = new Date(selectedDate);
              // Derive a “date card” style header.
              const weekdayShort = monthDate.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
              const dayNumber = monthDate.getDate();
              const monthName = monthDate.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
              const year = monthDate.getFullYear();

              return (
                <div key={month}>
                  {/* Month header rendered as a date card */}
                  <div className="flex justify-between items-center my-4">
                    <div className="flex flex-col items-center px-2 py-1 rounded bg-gray-100">
                      <span className="text-xs font-medium">{weekdayShort}</span>
                      <span className="text-sm font-bold">{dayNumber}</span>
                      <span className="text-xs">{monthName} {year}</span>
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

                  {/* List transactions for this month */}
                  {monthTxns.map((txn) => {
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
            <p>No transactions found for this month.</p>
          )}
        </ScrollArea>
      </div>

      {/* Right side: Daily Summary and Aggregated Statistics */}
      <div className="w-2/5 p-4 border-l border-gray-300">
        <DailyChartv2 />
        <ScrollArea className="h-full p-4">
          <h3 className="text-xl font-bold mb-4">Daily Summary & Stats</h3>
          {dailySummaries.length ? (
            <>
              <div className="mt-6 p-4 border rounded bg-gray-50">
                {highestSpendingDay && (
                  <div>
                    <strong>Highest Spending Day: </strong>
                    {highestSpendingDay.date} (
                    {formatBalance(highestSpendingDay.sum_expenses, currencyIso)})
                  </div>
                )}
                {lowestSpendingDay && (
                  <div>
                    <strong>Lowest Spending Day: </strong>
                    {lowestSpendingDay.date} (
                    {formatBalance(lowestSpendingDay.sum_expenses, currencyIso)})
                  </div>
                )}
                {highestIncomeDay && (
                  <div>
                    <strong>Highest Income Day: </strong>
                    {highestIncomeDay.date} (
                    {formatBalance(highestIncomeDay.sum_income, currencyIso)})
                  </div>
                )}
                {lowestIncomeDay && (
                  <div>
                    <strong>Lowest Income Day: </strong>
                    {lowestIncomeDay.date} (
                    {formatBalance(lowestIncomeDay.sum_income, currencyIso)})
                  </div>
                )}

                <div className="mt-4">
                  <strong>Expense Days:</strong> {numExpenseDays} &nbsp;
                  <strong>Income Days:</strong> {numIncomeDays}
                </div>

                {highestExpensePayee && (
                  <div className="mt-4">
                    <strong>Highest Expense Payee:</strong> {highestExpensePayee.name} (
                    {formatBalance(highestExpensePayee.sum_expense, currencyIso)})
                  </div>
                )}
                {lowestExpensePayee && (
                  <div>
                    <strong>Lowest Expense Payee:</strong> {lowestExpensePayee.name} (
                    {formatBalance(lowestExpensePayee.sum_expense, currencyIso)})
                  </div>
                )}
                {highestIncomePayee && (
                  <div className="mt-4">
                    <strong>Highest Income Payee:</strong> {highestIncomePayee.name} (
                    {formatBalance(highestIncomePayee.sum_income, currencyIso)})
                  </div>
                )}
                {lowestIncomePayee && (
                  <div>
                    <strong>Lowest Income Payee:</strong> {lowestIncomePayee.name} (
                    {formatBalance(lowestIncomePayee.sum_income, currencyIso)})
                  </div>
                )}

                {highestExpenseCategory && (
                  <div className="mt-4">
                    <strong>Highest Expense Category:</strong> {highestExpenseCategory.name} (
                    {formatBalance(highestExpenseCategory.sum_expense, currencyIso)})
                  </div>
                )}
                {lowestExpenseCategory && (
                  <div>
                    <strong>Lowest Expense Category:</strong> {lowestExpenseCategory.name} (
                    {formatBalance(lowestExpenseCategory.sum_expense, currencyIso)})
                  </div>
                )}
              </div>
            </>
          ) : (
            <p>No daily summary data for the selected date.</p>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}

export default MonthlyTransactionsList;
