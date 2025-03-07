/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react"
import axios from "axios"
import { useYNABContext } from "@/context/YNABContext"
import { Skeleton } from "@/components/ui/skeleton"
import TransactionCard from "../ui/transaction-card"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "../ui/scroll-area"
import { formatBalance } from "@/lib/utils"

interface Transaction {
    id: string
    payee_name: string
    amount: number
    date: string
    category_name: string
    memo: string
    account_name?: string
}

export function CategoryTransactionWidget() {
    const { currentBudget, selectedCategorySubId, setPayeeChartData, setMonthlyChartData } = useYNABContext()
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!currentBudget || !selectedCategorySubId) return

        const storedDataKey = `categoryTransactions-${currentBudget.id}-${selectedCategorySubId}`
        const cachedData = sessionStorage.getItem(storedDataKey)

        if (cachedData) {
            const parsedData = JSON.parse(cachedData)
            setTransactions(parsedData.transactions)
            setPayeeChartData(parsedData.payeeChartData)
            setMonthlyChartData(parsedData.monthlyChartData)
            setLoading(false)
        } else {
            fetchTransactions(storedDataKey)
        }
    }, [currentBudget, selectedCategorySubId])

    const fetchTransactions = (storageKey: string) => {
        const accessToken = sessionStorage.getItem("ynab_access_token")
        if (!accessToken || !currentBudget || !selectedCategorySubId) return

        axios
            .post(
                `/api/ynab/${currentBudget.id}/categories/${selectedCategorySubId}/transactions`,
                { token: accessToken }
            )
            .then((response) => {
                // The backend now returns { transactions, payeeChartData, monthlyChartData }
                const { transactions, payeeChartData, monthlyChartData } = response.data
                // Convert transaction amounts from minor units to main units
                const formattedTransactions = transactions.map((txn: any) => ({
                    ...txn,
                    amount: txn.amount / 1000.0,
                }))
                setTransactions(formattedTransactions)
                setPayeeChartData(payeeChartData)
                setMonthlyChartData(monthlyChartData)
                // Cache all data in session storage
                sessionStorage.setItem(storageKey, JSON.stringify({
                    transactions: formattedTransactions,
                    payeeChartData,
                    monthlyChartData,
                }))
            })
            .catch((error) => {
                console.error("Failed to fetch category transactions:", error)
            })
            .finally(() => setLoading(false))
    }

    // Group transactions by month (based on transaction date) and compute monthly total
    const groupTransactionsByMonth = (txns: Transaction[]) => {
        const groups: {
            [key: string]: { display: string; transactions: Transaction[]; total: number }
        } = {}

        txns.forEach((txn) => {
            const dateObj = new Date(txn.date)
            const year = dateObj.getFullYear()
            const month = (dateObj.getMonth() + 1).toString().padStart(2, "0")
            const key = `${year}-${month}`
            const display = dateObj.toLocaleDateString("default", {
                month: "long",
                year: "numeric",
            })

            if (!groups[key]) {
                groups[key] = { display, transactions: [], total: 0 }
            }
            groups[key].transactions.push(txn)
            groups[key].total += txn.amount
        })

        // Convert groups object to an array and sort descending by date (latest first)
        const groupArray = Object.entries(groups).map(([key, group]) => ({
            key,
            ...group,
            // Sort transactions within each group by date descending
            transactions: group.transactions.sort((a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            ),
        }))

        groupArray.sort((a, b) => {
            const [ay, am] = a.key.split("-").map(Number)
            const [by, bm] = b.key.split("-").map(Number)
            if (ay !== by) return by - ay
            return bm - am
        })

        return groupArray
    }


    const groups = groupTransactionsByMonth(transactions)
    const overallTotal = transactions.reduce((acc, txn) => acc + txn.amount, 0)

    // Utility to format amount with color
    const getFormattedAmount = (amount: number) => {
        const isIncome = amount > 0
        return (
            <span className={isIncome ? "text-green-600" : "text-red-600"}>
                {formatBalance(amount, currentBudget?.currency)}
            </span>
        )
    }

    return (
        <Card className="h-[650px]">
            <CardHeader>
                <CardTitle>Category Transactions</CardTitle>
                <CardDescription>
                    Transactions for the selected category grouped by month.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="space-y-2">
                        {[1, 2, 3].map((_, idx) => (
                            <Skeleton key={idx} className="w-full h-[80px] rounded-lg" />
                        ))}
                    </div>
                ) : (
                    <ScrollArea className="h-[510px]">
                        {groups.length === 0 ? (
                            <p className="text-muted-foreground text-sm">No transactions found.</p>
                        ) : (
                            groups.map((group) => (
                                <div key={group.key} className="mb-4">
                                    <div className="flex justify-between items-center mb-2 pb-1">
                                        <div className="font-semibold">{getFormattedAmount(group.total)}</div>
                                        <h3 className="font-bold">{group.display}</h3>
                                    </div>
                                    <div className="space-y-2">
                                        {group.transactions.map((txn) => (
                                            <TransactionCard
                                                key={txn.id}
                                                transaction={{
                                                    ...txn,
                                                    amountDisplay: getFormattedAmount(txn.amount),
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </ScrollArea>
                )}
            </CardContent>
            <CardFooter className="flex justify-end text-sm font-semibold">
                Overall Total: {getFormattedAmount(overallTotal)}
            </CardFooter>
        </Card>
    )
}
