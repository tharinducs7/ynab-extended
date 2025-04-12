import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useYNABContext } from "@/context/YNABContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import TransactionCard from "@/components/ui/transaction-card";
import { formatBalance } from "@/lib/utils";
import { ArrowUpCircle, ArrowDownCircle, Repeat } from "lucide-react";
import { MonthlyCategorySpending } from "../charts/MonthlyCategorySpending";
import { PayeeCategoryChart } from "../charts/PayeeCategoryChart";

// Adjust these interfaces as needed to match what your API returns.
interface Transaction {
    id: string;
    date: string;
    amount: number; // store in major units
    memo: string | null;
    payee_name: string;
    category_name: string | null;
    transfer_transaction_id?: string | null;
    subtransactions?: Transaction[]; // if your code unifies subtransactions
}

interface CategoryTransactionResponse {
    transactions: Transaction[];
    // If your API also returns chart data or other analytics,
    // you can store them here. e.g.:
    // payeeChartData: Array<{ payee: string; activity: number }>;
    // monthlyChartData: Array<{ month: string; spending: number }>;
    // ...
}

export function CategoryTransactionSheet() {
    const { currentBudget, selectedCategorySubId } = useYNABContext();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (!currentBudget || !selectedCategorySubId) return;

        const token = sessionStorage.getItem("ynab_access_token");
        if (!token) return;

        setLoading(true);

        // POST request to your "fetchCategoryTransactions" endpoint
        axios
            .post(
                `/api/ynab/${currentBudget.id}/categories/${selectedCategorySubId}/transactions`,
                { token }
            )
            .then((response) => {
                const data: CategoryTransactionResponse = response.data;
                // We assume data.transactions is an array of transactions (and maybe subtransactions).
                setTransactions(data.transactions || []);
            })
            .catch((error) => {
                console.error("Failed to fetch transactions by category:", error);
            })
            .finally(() => setLoading(false));
    }, [currentBudget, selectedCategorySubId]);

    const currencyIso = currentBudget?.currency ?? "USD";

    // ---------------------------
    // Group transactions by "YYYY-MM"
    // ---------------------------
    const groupedTransactions = useMemo(() => {
        const map: Record<string, Transaction[]> = {};
        transactions.forEach((txn) => {
            const monthKey = txn.date.slice(0, 7); // e.g. "2025-04"
            if (!map[monthKey]) {
                map[monthKey] = [];
            }
            map[monthKey].push(txn);
        });
        return map;
    }, [transactions]);

    // Sort month keys descending
    const monthKeys = Object.keys(groupedTransactions).sort((a, b) => b.localeCompare(a));

    return (
        <div className="flex w-full h-[750px]">
            {/* Left side: monthly transaction list */}
            <div className="w-3/5">
                <ScrollArea className="h-full p-4">
                    {loading ? (
                        <p>Loading transactions...</p>
                    ) : monthKeys.length ? (
                        monthKeys.map((month) => {
                            const monthTxns = groupedTransactions[month];

                            // Summaries for this month
                            let income = 0;
                            let expense = 0;
                            let transfers = 0;

                            monthTxns.forEach((txn) => {
                                if (txn.transfer_transaction_id) {
                                    transfers += txn.amount;
                                } else if (txn.amount > 0) {
                                    income += txn.amount;
                                } else {
                                    expense += txn.amount; // negative
                                }
                            });

                            return (
                                <div key={month}>
                                    {/* Month header */}
                                    <div className="flex justify-between items-center my-4">
                                        <h2 className="text-xl font-bold">{month}</h2>
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

                                    {/* Transactions for this month */}
                                    {monthTxns.map((txn) => {
                                        // If transaction has subtransactions, show them
                                        if (txn.subtransactions && txn.subtransactions.length > 0) {
                                            return (
                                                <div key={txn.id}>
                                                    {/* Parent transaction */}
                                                    <TransactionCard
                                                        transaction={{
                                                            ...txn,
                                                            memo: txn.memo ?? "",
                                                            category_name: txn.category_name ?? "Uncategorized",
                                                            amountDisplay: formatBalance(txn.amount / 1000, currencyIso),
                                                        }}
                                                    />

                                                    {txn.subtransactions.map((sub) => (
                                                        <div
                                                            key={sub.id}
                                                            className="ml-6 border-l border-gray-300 pl-4"
                                                        >
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
                                            // Normal single transaction
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
                        <p>No transactions found for this category.</p>
                    )}
                </ScrollArea>
            </div>

            {/* Right side: overall totals (Spent, Received, Net) or other analytics */}
            <div className="w-2/5 p-4 border-l border-gray-300">
                <ScrollArea className="h-full p-4 mr-2 gap-4">
                    <MonthlyCategorySpending />

                    <PayeeCategoryChart />
                </ScrollArea>
                {/* If your endpoint returns extra analytics, you could display them here.
            e.g., monthlyChartData, payeeChartData, etc. */}
            </div>
        </div>
    );
}
