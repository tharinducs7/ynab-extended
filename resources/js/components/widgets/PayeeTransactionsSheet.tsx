
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useYNABContext } from "@/context/YNABContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import TransactionCard from "@/components/ui/transaction-card";
import { formatBalance } from "@/lib/utils";
import { ArrowUpCircle, ArrowDownCircle, Repeat } from "lucide-react";

interface Transaction {
    id: string;
    date: string;
    amount: number; // we'll store it in major units
    memo: string | null;
    payee_name: string;
    category_name: string | null;
    transfer_transaction_id?: string | null;
    // If your Laravel code unifies subtransactions under each parent:
    subtransactions?: Transaction[]; // same structure as parent, or partial
}

interface CategoryBreakdown {
    [categoryName: string]: {
        spent: number;
        received: number;
    };
}

interface PayeeAnalytics {
    totalSpent: number;
    totalReceived: number;
    categoryBreakdown: CategoryBreakdown;
}

interface FetchPayeeTransactionsResponse {
    transactions: Transaction[];
    analytics: PayeeAnalytics;
}

interface GroupedTransactions {
    [month: string]: Transaction[];
}

export function PayeeTransactionsSheet() {
    const { currentBudget, selectedPayee } = useYNABContext();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [analytics, setAnalytics] = useState<PayeeAnalytics>({
        totalSpent: 0,
        totalReceived: 0,
        categoryBreakdown: {},
    });
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (!currentBudget || !selectedPayee) return;

        const accessToken = sessionStorage.getItem("ynab_access_token");
        if (!accessToken) return;

        setLoading(true);

        axios
            .post(
                `/api/ynab/${currentBudget.id}/payees/${selectedPayee.id}/transactions`,
                { token: accessToken }
            )
            .then((response) => {
                const { transactions, analytics }: FetchPayeeTransactionsResponse = response.data;
                setTransactions(transactions);
                setAnalytics(analytics);
            })
            .catch((error) => {
                console.error("Failed to fetch transactions by payee:", error);
            })
            .finally(() => setLoading(false));
    }, [currentBudget, selectedPayee]);

    const currencyIso = currentBudget?.currency ?? "USD";

    // ---------------------------
    // Group transactions by month
    // ---------------------------
    const groupedTransactions: GroupedTransactions = useMemo(() => {
        const map: GroupedTransactions = {};
        transactions.forEach((txn) => {
            const monthKey = txn.date.slice(0, 7); // "YYYY-MM"
            if (!map[monthKey]) {
                map[monthKey] = [];
            }
            map[monthKey].push(txn);
        });
        return map;
    }, [transactions]);

    // Sort month keys descending
    const monthKeys = Object.keys(groupedTransactions).sort((a, b) => b.localeCompare(a));

    // Compute net
    const net = analytics.totalReceived - analytics.totalSpent;
    let netClass = "text-gray-700";
    if (net > 0) {
        netClass = "text-green-700";
    } else if (net < 0) {
        netClass = "text-red-700";
    }
    const netFormatted = net > 0
        ? `+${formatBalance(net, currencyIso)}`
        : net < 0
            ? `-${formatBalance(Math.abs(net), currencyIso)}`
            : "0.00";

    return (
        <div className="flex w-full h-[750px]">
            {/* Left side: scrollable transactions by month */}
            <div className="w-2/3">
                <ScrollArea className="h-full p-4">
                    {loading ? (
                        <p>Loading transactions...</p>
                    ) : monthKeys.length ? (
                        monthKeys.map((month) => {
                            const monthTxns = groupedTransactions[month];

                            // Compute month-level sums
                            let income = 0;
                            let expense = 0;
                            let transfers = 0;

                            monthTxns.forEach((txn) => {
                                const amount = txn.amount;
                                if (txn.transfer_transaction_id) {
                                    transfers += amount;
                                } else if (amount > 0) {
                                    income += amount;
                                } else {
                                    expense += amount;
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
                                                {formatBalance(income, currencyIso)}
                                            </span>
                                            <span className="text-red-700 flex items-center mr-2">
                                                <ArrowDownCircle className="w-4 h-4 mr-1" />
                                                {formatBalance(Math.abs(expense), currencyIso)}
                                            </span>
                                            <span className="text-yellow-700 flex items-center">
                                                <Repeat className="w-4 h-4 mr-1" />
                                                {formatBalance(transfers, currencyIso)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Transactions */}
                                    {monthTxns.map((txn) => {
                                        // If the transaction has subtransactions, display them below the parent
                                        if (txn.subtransactions && txn.subtransactions.length > 0) {
                                            return (
                                                <div key={txn.id}>
                                                    {/* Parent transaction card */}
                                                    <TransactionCard
                                                        transaction={{
                                                            ...txn,
                                                            // e.g., "Orphaned subtransaction(s)" might be the parent's memo
                                                            memo: txn.memo ?? "",
                                                            category_name: txn.category_name ?? "Uncategorized",
                                                            amountDisplay: formatBalance(txn.amount, currencyIso),
                                                        }}
                                                    />
                                                    {/* Render each subtransaction as well */}
                                                    {txn.subtransactions.map((sub) => (
                                                        <div key={sub.id} className="ml-6 border-l border-gray-300 pl-4">
                                                            <TransactionCard
                                                                transaction={{
                                                                    ...sub,
                                                                    memo: sub.memo ?? "",
                                                                    category_name: sub.category_name ?? "Uncategorized",
                                                                    amountDisplay: formatBalance(sub.amount, currencyIso),
                                                                }}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        } else {
                                            // Normal transaction
                                            return (
                                                <TransactionCard
                                                    key={txn.id}
                                                    transaction={{
                                                        ...txn,
                                                        category_name: txn.category_name ?? "Uncategorized",
                                                        memo: txn.memo ?? "",
                                                        amountDisplay: formatBalance(txn.amount, currencyIso),
                                                    }}
                                                />
                                            );
                                        }
                                    })}
                                </div>
                            );
                        })
                    ) : (
                        <p>No transactions found for this payee.</p>
                    )}
                </ScrollArea>
            </div>

            {/* Right side: overall analytics */}
            <div className="w-1/3 p-4 border-l border-gray-300">
                <h2 className="text-xl font-bold mb-4">Analytics (All-Time for Payee)</h2>

                {/* Totals row (Spent, Received, Net) */}
                <div className="mb-4 text-sm font-semibold space-y-2">
                    <div className="flex items-center text-green-700 justify-between">
                        <span> Income </span>
                        {formatBalance(analytics.totalReceived, currencyIso)}
                    </div>
                    <div className="flex items-center text-red-700 justify-between">
                        <span> Expenses </span>
                        {formatBalance(analytics.totalSpent, currencyIso)}
                    </div>
                    <div className={`flex items-center ${netClass} justify-between`}>
                        <span> Net Amount </span>
                        {netFormatted}
                    </div>
                </div>

                {/* Category breakdown */}
                <div>
                    <h3 className="text-lg font-semibold mb-2">By Category</h3>
                    {Object.entries(analytics.categoryBreakdown).length ? (
                        Object.entries(analytics.categoryBreakdown).map(
                            ([categoryName, { spent, received }]) => (
                                <div key={categoryName} className="mb-3">
                                    <p className="text-sm font-medium">{categoryName}</p>
                                    <p className="text-xs">
                                        Spent: {formatBalance(spent, currencyIso)} | Received:{" "}
                                        {formatBalance(received, currencyIso)}
                                    </p>
                                </div>
                            )
                        )
                    ) : (
                        <p className="text-sm">No category data found.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
