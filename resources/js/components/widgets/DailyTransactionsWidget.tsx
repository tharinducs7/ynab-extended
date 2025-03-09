/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import * as React from "react"
import TransactionCard from "../ui/transaction-card"
import { ScrollArea } from "../ui/scroll-area"
import { useYNABContext } from "@/context/YNABContext"
import { DailyPayeeChart } from "../charts/DailyPayeeChart"
import { CategoryBarChart } from "../charts/DailyCategoryChart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatBalance } from "@/lib/utils"

export function DailyTransactionsWidget({ transactions }: { transactions: any[] }) {
    const { selectedDate, currentBudget } = useYNABContext()

    // Filter transactions by selected date (ignoring time) and adjust amount
    const filteredTransactions = React.useMemo(() => {
        if (!selectedDate) return []
        return transactions
            .filter((txn) => {
                const txnDate = new Date(txn.date)
                return txnDate.toDateString() === selectedDate.toDateString()
            })
            .map((txn: any) => ({
                ...txn,
                amount: txn.amount / 1000.0,
            }))
    }, [transactions, selectedDate])

    // Separate transactions into income, expense, and transfers
    const incomeTxns = React.useMemo(
        () =>
            filteredTransactions.filter(
                (txn) => txn.category_id !== null && txn.amount >= 0
            ),
        [filteredTransactions]
    )

    const expenseTxns = React.useMemo(
        () =>
            filteredTransactions.filter(
                (txn) => txn.category_id !== null && txn.amount < 0
            ),
        [filteredTransactions]
    )

    const transferTxns = React.useMemo(
        () => filteredTransactions.filter((txn) => txn.category_id === null),
        [filteredTransactions]
    )

    // We'll use a tab view in the transactions section.
    const [activeTab, setActiveTab] = React.useState<"income" | "expense" | "transfers">("income")

    // Get data for current tab.
    const transactionsForTab = React.useMemo(() => {
        if (activeTab === "income") return incomeTxns
        if (activeTab === "expense") return expenseTxns
        return transferTxns
    }, [activeTab, incomeTxns, expenseTxns, transferTxns])

    // Group transactions by category name (or "Transfers" if no category)
    const groupedTransactions = React.useMemo(() => {
        return transactionsForTab.reduce((acc: Record<string, any[]>, txn) => {
            const groupKey = txn.category_id !== null ? txn.category_name : "Transfers"
            if (!acc[groupKey]) {
                acc[groupKey] = []
            }
            acc[groupKey].push(txn)
            return acc
        }, {} as Record<string, any[]>)
    }, [transactionsForTab])

    return (
        <div className="rounded-lg">
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Left Column: Daily Payee Chart */}
                <div className="w-full sm:w-1/3">
                    <DailyPayeeChart transactions={filteredTransactions} />
                </div>
                {/* Middle Column: Transactions List */}
                <div className="w-full sm:w-1/3">
                    <Card>
                        <CardHeader className="flex flex-col sm:flex-row items-center justify-between">
                            <CardTitle>
                                Transactions {selectedDate.toDateString()}
                            </CardTitle>
                            <Tabs
                                value={activeTab}
                                onValueChange={(val) =>
                                    setActiveTab(val as "income" | "expense" | "transfers")
                                }
                            >
                                <TabsList>
                                    <TabsTrigger value="income">Income</TabsTrigger>
                                    <TabsTrigger value="expense">Expense</TabsTrigger>
                                    <TabsTrigger value="transfers">Transfers</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </CardHeader>
                        <CardContent className="h-[310px]">
                            {transactionsForTab.length === 0 ? (
                                <p className="text-muted-foreground">
                                    No transactions for selected date.
                                </p>
                            ) : (
                                <ScrollArea className="h-full">
                                    {Object.entries(groupedTransactions).map(([groupName, txns]) => {
                                        // Calculate the group's total sum
                                        const totalSum = txns.reduce(
                                            (acc, txn) => acc + txn.amount,
                                            0
                                        )
                                        return (
                                            <div key={groupName} className="mb-4">
                                                <div className="flex justify-between font-semibold mb-2 text-sm">
                                                    <span>{groupName}</span>
                                                </div>
                                                <div className="space-y-2">
                                                    {txns.map((txn) => (
                                                        <TransactionCard
                                                            key={txn.id}
                                                            transaction={txn}
                                                            minimalCard={true}
                                                        />
                                                    ))}
                                                </div>
                                                <div className="flex justify-end font-semibold mb-2 text-sm">
                                                    {txns.length > 1 && (
                                                        <span>{formatBalance(totalSum, currentBudget?.currency)}</span>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </ScrollArea>
                            )}
                        </CardContent>
                    </Card>
                </div>
                {/* Right Column: Category Bar Chart */}
                <div className="w-full sm:w-1/3">
                    <CategoryBarChart transactions={filteredTransactions} />
                </div>
            </div>
        </div>
    )
}
