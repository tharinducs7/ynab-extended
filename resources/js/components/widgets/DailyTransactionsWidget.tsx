/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import TransactionCard from "../ui/transaction-card"
import { ScrollArea } from "../ui/scroll-area"
import { useYNABContext } from "@/context/YNABContext"

export function DailyTransactionsWidget({ transactions }: { transactions: any[] }) {
  const [localSelectedDate, setLocalSelectedDate] = React.useState<Date | undefined>(new Date())
  const { selectedDate } = useYNABContext()

  // Filter transactions whose date matches the selected date (ignoring time)
  const filteredTransactions = React.useMemo(() => {
    if (!localSelectedDate) return []
    return transactions
      .filter((txn) => {
        const txnDate = new Date(txn.date)
        return txnDate.toDateString() === localSelectedDate.toDateString()
      })
      .map((txn: any) => ({
        ...txn,
        amount: txn.amount / 1000.0,
      }))
  }, [transactions, localSelectedDate])

  return (
    <div className="rounded-lg">
      <div className="flex flex-row gap-4">
        {/* Calendar Section */}
        <div className="w-1/3">
          <Calendar
            mode="single"
            selected={localSelectedDate}
            onSelect={setLocalSelectedDate}
            className="rounded-md border shadow"
            defaultMonth={localSelectedDate}
            // Hides the navigation bar so that the user cannot move to another month
            navbarElement={() => null}
          />
        </div>
        {/* Transactions Section */}
        <div className="w-2/3">
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
      </div>
    </div>
  )
}
