import { useEffect, useState } from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

import { useYNABContext } from "@/context/YNABContext"
import BankAccount from "../ui/bank-account"
import { ScrollArea, ScrollBar } from "../ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { useYnabStore } from "@/stores/useYnabStore"

interface Account {
    id: string
    name: string
    type: string
    on_budget: boolean
    closed: boolean
    balance: number
    deleted: boolean
    note: string
}

// Type label mapping for better display names
const typeLabels: Record<string, string> = {
    otherAsset: "Investments & Assets",
    creditCard: "Credit Cards",
    savings: "Savings Accounts",
    checking: "Current Accounts",
    cash: "Cash Accounts",
}

// Utility to filter, group & sort accounts
function filterAndGroupAccounts(accounts: Account[]) {
    const filteredAccounts = accounts.filter(account => !account.closed && !account.deleted)

    const grouped = filteredAccounts.reduce<Record<string, Account[]>>((acc, account) => {
        if (!acc[account.type]) {
            acc[account.type] = []
        }
        acc[account.type].push(account)
        return acc
    }, {})

    // Sort each group by balance (ascending)
    for (const type in grouped) {
        grouped[type].sort((a, b) => a.balance - b.balance)
    }

    return grouped
}

// Helper function to calculate total balance for a set of accounts
function calculateTotal(accounts: Account[]): number {
    return accounts.reduce((sum, account) => sum + account.balance, 0)
}

export function AccountsWidget() {
    const { currentBudget } = useYNABContext()
    const budgetsArrayWithAccounts = useYnabStore(state => state.budgetsArrayWithAccounts);
    console.log(budgetsArrayWithAccounts, "budgetsArrayWithAccounts");
    const [groupedAccounts, setGroupedAccounts] = useState<Record<string, Account[]>>({})
    const [accountTypes, setAccountTypes] = useState<string[]>([])
    const [selectedTab, setSelectedTab] = useState<string | undefined>(undefined)

    // When the budget or accounts change, group the accounts and select the first tab
    useEffect(() => {
        console.log(currentBudget, "currentBudget?.accounts");

        if (currentBudget?.accounts) {
            const grouped = filterAndGroupAccounts(currentBudget.accounts)
            setGroupedAccounts(grouped)

            const types = Object.keys(grouped)
            setAccountTypes(types)

            // Always select the first type when accounts change
            setSelectedTab(types[0] ?? undefined)
        }
    }, [currentBudget])

    const handleTabChange = (tab: string) => {
        setSelectedTab(tab)
    }

    const totalBalance = selectedTab ? calculateTotal(groupedAccounts[selectedTab] || []) : 0

    // Format balance with currency (example assumes LKR, adjust for actual currency if needed)
    const formattedTotal = new Intl.NumberFormat('en-LK', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(totalBalance / 1000) + " LKR"

    return (
        <Card className="h-[450px]">
            <CardHeader>
                <CardTitle>Accounts</CardTitle>
                <CardDescription>
                    Overview of all your accounts, with current balances and details.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {accountTypes.length > 0 && selectedTab && (
                    <Tabs value={selectedTab} onValueChange={handleTabChange} className="w-full">
                        {/* TabsList with scrollable tabs */}
                        <ScrollArea className="w-full whitespace-nowrap">
                            <TabsList className="mb-4 flex overflow-x-auto space-x-2 w-full scrollbar-hide">
                                {accountTypes.map((type) => (
                                    <TabsTrigger
                                        key={type}
                                        value={type}
                                        className="shrink-0 px-3 py-2 text-sm font-medium whitespace-nowrap"
                                    >
                                        {typeLabels[type] || type}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>

                        {/* TabsContent for each type */}
                        {accountTypes.map((type) => (
                            <TabsContent key={type} value={type}>
                                <ScrollArea className="h-[210px]">
                                    <div className="space-y-2">
                                        {(groupedAccounts[type] || []).map(account => (
                                            <BankAccount key={account.id} account={account} />
                                        ))}
                                    </div>
                                </ScrollArea>
                            </TabsContent>
                        ))}
                    </Tabs>
                )}
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex justify-between w-full font-medium leading-none">
                    Total Balance: <strong>{formattedTotal}</strong>
                </div>
            </CardFooter>
        </Card>
    )
}
