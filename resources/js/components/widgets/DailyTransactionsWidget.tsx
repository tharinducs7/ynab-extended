/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import * as React from "react"
import TransactionCard from "../ui/transaction-card"
import { ScrollArea } from "../ui/scroll-area"
import { useYNABContext } from "@/context/YNABContext"
import { DailyPayeeChart } from "../charts/DailyPayeeChart"
import { CategoryBarChart } from "../charts/DailyCategoryChart"


export function DailyTransactionsWidget({ transactions }: { transactions: any[] }) {
    const { selectedDate } = useYNABContext()

    // Filter transactions whose date matches the selected date (ignoring time)
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
    console.log(filteredTransactions, "filteredTransactions");

    return (
        <div className="rounded-lg">
            <div className="flex flex-row gap-4">
                {/* Calendar Section */}
                <div className="w-1/3">
                    <DailyPayeeChart transactions={filteredTransactions} />
                </div>
                {/* Transactions Section */}
                <div className="w-1/3">
                    {filteredTransactions.length === 0 ? (
                        <p className="text-muted-foreground">No transactions for selected date.</p>
                    ) : (
                        <ScrollArea className="h-[410px]">
                            {filteredTransactions.map((txn) => (
                                <TransactionCard key={txn.id} transaction={txn} minimalCard={true} />
                            ))}
                        </ScrollArea>
                    )}
                </div>

                <div className="w-1/3">
                    <CategoryBarChart transactions={filteredTransactions} />
                </div>
            </div>
        </div>
    )
}
