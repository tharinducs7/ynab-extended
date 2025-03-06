import { useEffect, useState } from "react"
import axios from "axios"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useYNABContext } from "@/context/YNABContext"
import { Skeleton } from "@/components/ui/skeleton"

interface Transaction {
    id: string
    payee_name: string
    amount: number
    date: string
    category_name: string
    status: "Paid" | "To Be Paid"
    payee_logo?: string // Optional logo URL
}

function getInitials(name: string) {
    const parts = name.split(" ")
    return parts.map((p) => p[0]).join("").toUpperCase()
}

function TransactionCard({ transaction }: { transaction: Transaction }) {
    const isPaid = transaction.status === "Paid"

    return (
        <Card className="w-full border border-border shadow-sm overflow-hidden">
            <CardContent className="flex gap-4 p-4 items-center">
                <div className="w-12 h-12 flex items-center justify-center bg-muted rounded-full text-primary font-bold text-lg shrink-0">
                    {transaction.payee_logo ? (
                        <img
                            src={transaction.payee_logo}
                            alt={transaction.payee_name}
                            className="w-full h-full rounded-full object-cover"
                        />
                    ) : (
                        getInitials(transaction.payee_name)
                    )}
                </div>

                <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-center">
                        <span className="font-semibold text-sm truncate">{transaction.payee_name}</span>
                        {isPaid ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                            <AlertCircle className="h-5 w-5 text-yellow-500" />
                        )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {new Date(transaction.date).toLocaleDateString()}
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{transaction.category_name}</span>
                        <span className={cn(
                            "text-sm font-semibold",
                            isPaid ? "text-green-600" : "text-yellow-600"
                        )}>
                            LKR {transaction.amount.toLocaleString()}
                        </span>
                    </div>
                    <Badge
                        variant={isPaid ? "outline" : "secondary"}
                        className={cn(
                            isPaid ? "border-green-500 text-green-600" : "border-yellow-500 text-yellow-600"
                        )}
                    >
                        {transaction.status}
                    </Badge>
                </div>
            </CardContent>
        </Card>
    )
}

export function ScheduledTransactionWidget() {
    const { currentBudget } = useYNABContext()
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!currentBudget) return

        const storedDataKey = `scheduledTransactions-${currentBudget.id}`
        const cachedData = sessionStorage.getItem(storedDataKey)

        if (cachedData) {
            const parsedData = JSON.parse(cachedData)
            setTransactions(parsedData)
            setLoading(false)
        } else {
            fetchTransactions(storedDataKey)
        }
    }, [currentBudget])

    const fetchTransactions = (storageKey: string) => {
        const accessToken = sessionStorage.getItem('ynab_access_token')
        if (!accessToken || !currentBudget) return

        axios.post(`/api/ynab/${currentBudget.id}/scheduled-transactions`, { token: accessToken })
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

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Scheduled Transactions</h3>

            {loading ? (
                <div className="space-y-2">
                    {[1, 2, 3].map((_, idx) => (
                        <Skeleton key={idx} className="w-full h-[80px] rounded-lg" />
                    ))}
                </div>
            ) : (
                <>
                    {transactions.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No scheduled transactions found.</p>
                    ) : (
                        transactions.map((txn) => (
                            <TransactionCard key={txn.id} transaction={txn} />
                        ))
                    )}
                </>
            )}
        </div>
    )
}
