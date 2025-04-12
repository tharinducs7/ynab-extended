/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { useYNABContext } from "@/context/YNABContext";
import { formatBalance, formatPayeeForUrl } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { ScrollArea } from "../ui/scroll-area";
import TransactionCard from "../ui/transaction-card";
import { ArrowUpCircle, ArrowDownCircle, Repeat } from "lucide-react";

interface Transaction {
    id: string;
    date: string;
    amount: number;
    memo: string | null;
    cleared: string;
    approved: boolean;
    flag_color: string | null;
    flag_name: string | null;
    account_id: string;
    account_name: string;
    payee_id: string;
    payee_name: string;
    category_id: string | null;
    category_name: string;
    transfer_account_id: string | null;
    transfer_transaction_id: string | null;
    matched_transaction_id: string | null;
    import_id: string | null;
    import_payee_name: string | null;
    import_payee_name_original: string | null;
    debt_transaction_type: string | null;
    deleted: boolean;
    subtransactions: any[];
}

// Define a type for transactions grouped by month.
interface TransactionsByMonth {
    [month: string]: Transaction[];
}

export function TransactionsSheet() {
    const { isSheetOpen, setIsSheetOpen, selectedAccount, selectedBudget } = useYNABContext();
    const avatarUrl = selectedAccount
        ? `https://ik.imagekit.io/apbypokeqx/tr:di-default.png/${formatPayeeForUrl(selectedAccount?.note)}.png`
        : "";

    const [transactions, setTransactions] = useState<TransactionsByMonth>({});
    const [loading, setLoading] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>("");

    useEffect(() => {
        if (!selectedAccount || !selectedBudget) return;

        const accessToken = sessionStorage.getItem("ynab_access_token");
        if (!accessToken) return;

        setLoading(true);
        axios
            .post(
                `/api/ynab/${selectedBudget.id}/accounts/${selectedAccount.id}/transactions`,
                { token: accessToken }
            )
            .then((response) => {
                // Assume API responds with an object like:
                // { transactions: { "2025-03": [ ... ], "2025-02": [ ... ], ... } }
                const { transactions }: any = response.data;
                const formattedTransactions: TransactionsByMonth = {};

                if (transactions && typeof transactions === "object") {
                    Object.keys(transactions).forEach((month) => {
                        formattedTransactions[month] = transactions[month].map((txn: any) => ({
                            ...txn,
                            amount: txn.amount / 1000.0, // Adjust the amount if required
                        }));
                    });
                }
                setTransactions(formattedTransactions);
            })
            .catch((error) => {
                console.error("Failed to fetch transactions by account:", error);
            })
            .finally(() => setLoading(false));
    }, [selectedAccount, selectedBudget]);

    // Filter transactions based on searchTerm
    const filteredTransactions: TransactionsByMonth = useMemo(() => {
        if (!searchTerm.trim()) return transactions;

        const lowerSearch = searchTerm.toLowerCase();
        const filtered: TransactionsByMonth = {};

        Object.keys(transactions).forEach((month) => {
            const filteredTxns = transactions[month].filter((txn) => {
                return (
                    String(txn.amount).toLowerCase().includes(lowerSearch) ||
                    (txn.date && txn.date.toLowerCase().includes(lowerSearch)) ||
                    (txn.memo && txn.memo.toLowerCase().includes(lowerSearch)) ||
                    (txn.payee_name && txn.payee_name.toLowerCase().includes(lowerSearch)) ||
                    (txn.category_name && txn.category_name.toLowerCase().includes(lowerSearch))
                );
            });
            if (filteredTxns.length > 0) {
                filtered[month] = filteredTxns;
            }
        });
        return filtered;
    }, [searchTerm, transactions]);

    return (
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetContent style={{ width: "700px", maxWidth: "none" }}>
                <SheetHeader>
                    <SheetTitle className="flex items-center space-x-2">
                        <Avatar className="size-8 rounded-lg">
                            <AvatarImage src={avatarUrl} alt={selectedAccount?.name} />
                            <AvatarFallback>
                                {selectedAccount?.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <span>
                            {selectedAccount?.name} - {selectedBudget?.currency_format?.iso_code}
                        </span>
                    </SheetTitle>
                </SheetHeader>

                {/* Search Input */}
                <div className="px-4">
                    <input
                        type="text"
                        placeholder="Search by amount, date, memo, payee, category..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border p-2 rounded w-full"
                    />
                </div>

                <ScrollArea className="h-[760px] px-4">
                    {loading ? (
                        <p>Loading transactions...</p>
                    ) : Object.keys(filteredTransactions).length ? (
                        // Sort month keys descending so that latest month appears first.
                        Object.keys(filteredTransactions)
                            .sort((a: string, b: string) => b.localeCompare(a))
                            .map((month: string) => {
                                const monthTxns = filteredTransactions[month];

                                // Compute summary values for the month:
                                const income = monthTxns.reduce((acc, txn) => {
                                    // Only count non-transfer income
                                    if (!txn.transfer_transaction_id && txn.amount > 0) {
                                        return acc + txn.amount;
                                    }
                                    return acc;
                                }, 0);
                                const expense = monthTxns.reduce((acc, txn) => {
                                    // Only count non-transfer expenses
                                    if (!txn.transfer_transaction_id && txn.amount < 0) {
                                        return acc + txn.amount;
                                    }
                                    return acc;
                                }, 0);
                                const transfers = monthTxns.reduce((acc, txn) => {
                                    if (txn.transfer_transaction_id) {
                                        return acc + txn.amount;
                                    }
                                    return acc;
                                }, 0);

                                return (
                                    <div key={month}>
                                        <div className="flex justify-between items-center my-4">
                                            {/* Month on the left */}
                                            <h2 className="text-xl font-bold">{month}</h2>

                                            {/* Summary on the right */}
                                            <div className="flex items-center justify-end text-sm font-semibold">
                                                <span className="text-green-700 flex items-center mr-2">
                                                    <ArrowUpCircle className="w-4 h-4 mr-1" />
                                                    {formatBalance(income, selectedBudget?.currency_format?.iso_code)}
                                                </span>
                                                <span className="text-red-700 flex items-center mr-2 font-semibold">
                                                    <ArrowDownCircle className="w-4 h-4 mr-1" />
                                                    {formatBalance(Math.abs(expense), selectedBudget?.currency_format?.iso_code)}
                                                </span>
                                                <span className="text-yellow-700 flex items-center font-semibold">
                                                    <Repeat className="w-4 h-4 mr-1" />
                                                    {formatBalance(transfers, selectedBudget?.currency_format?.iso_code)}
                                                </span>
                                            </div>
                                        </div>

                                        {monthTxns.map((txn: any) => (
                                            <div key={txn.id}>
                                                <TransactionCard
                                                    minimalCard
                                                    key={txn.id}
                                                    transaction={{
                                                        ...txn,
                                                        amountDisplay: formatBalance(txn.amount, selectedBudget?.currency_format?.iso_code),
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                );
                            })
                    ) : (
                        <p>No transactions found.</p>
                    )}
                </ScrollArea>

                <SheetFooter>
                    <SheetClose asChild>
                        <Button type="submit">Save changes</Button>
                    </SheetClose>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
