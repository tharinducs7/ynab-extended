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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { ScrollArea } from "../ui/scroll-area"
import { formatBalance } from "@/lib/utils"

interface Transaction {
    id: string
    payee_name: string
    amount: number
    date: string
    category_name: string
    status: "Paid" | "To Be Paid"
    payee_logo?: string
    memo: string
}

export function ScheduledTransactionWidget({ budgetId }: { budgetId: string }) {
    const { currentBudget } = useYNABContext()
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!budgetId) return

        const storedDataKey = `scheduledTransactions-${budgetId}`
        const cachedData = sessionStorage.getItem(storedDataKey)

        if (cachedData) {
            const parsedData = JSON.parse(cachedData)
            setTransactions(parsedData)
            setLoading(false)
        } else {
            fetchTransactions(storedDataKey)
        }
    }, [])

    const fetchTransactions = (storageKey: string) => {
        const accessToken = sessionStorage.getItem('ynab_access_token')
        if (!accessToken || !budgetId) return

        axios.post(`/api/ynab/${budgetId}/scheduled-transactions`, { token: accessToken })
            .then((response) => {
                const { scheduledTransactions } = response.data
                setTransactions(scheduledTransactions)

                // Cache in session storage
                sessionStorage.setItem(storageKey, JSON.stringify(scheduledTransactions))
            })
            .catch((error) => {
                console.error("Failed to fetch scheduled transactions:", error)
            })
            .finally(() => setLoading(false))
    }

    const paidTransactions = transactions
        .filter(txn => txn.status === "Paid")
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const toBePaidTransactions = transactions.filter(txn => txn.status === "To Be Paid")

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
        <Card className={transactions.length > 5 ? 'h-[1100px]' : 'h-[370px]'}>
            <CardHeader>
                <CardTitle>Scheduled Transactions</CardTitle>
                <CardDescription>
                    Overview of all your scheduled transactions.
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
                    <Tabs defaultValue="to-be-paid" className="w-full">
                        <TabsList className="w-full grid grid-cols-2">
                            <TabsTrigger value="paid">Paid</TabsTrigger>
                            <TabsTrigger value="to-be-paid">To Be Paid</TabsTrigger>
                        </TabsList>

                        <TabsContent value="paid">
                            {paidTransactions.length === 0 ? (
                                <p className="text-muted-foreground text-sm">No paid transactions found.</p>
                            ) : (
                                <ScrollArea className={paidTransactions.length > 5 ? 'h-[910px]' : 'h-[300px]'}>
                                    {paidTransactions.map((txn) => (
                                        <TransactionCard minimalCard key={txn.id} transaction={{
                                            ...txn,
                                            amountDisplay: getFormattedAmount(txn.amount)
                                        }} />
                                    ))}
                                </ScrollArea>
                            )}
                        </TabsContent>

                        <TabsContent value="to-be-paid">
                            {toBePaidTransactions.length === 0 ? (
                                <p className="text-muted-foreground text-sm">No transactions to be paid found.</p>
                            ) : (
                                <ScrollArea className={toBePaidTransactions.length > 5 ? 'h-[910px]' : 'h-[300px]'}>
                                    {toBePaidTransactions.map((txn) => (
                                        <TransactionCard key={txn.id} transaction={{
                                            ...txn,
                                            amountDisplay: getFormattedAmount(txn.amount)
                                        }}
                                        minimalCard />
                                    ))}
                                </ScrollArea>
                            )}
                        </TabsContent>
                    </Tabs>
                )}
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
                {/* You can add summary information here if needed */}
            </CardFooter>
        </Card>
    )
}
