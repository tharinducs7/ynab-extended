/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react"
import { Label, Pie, PieChart, Sector } from "recharts"
import { PieSectorDataItem } from "recharts/types/polar/Pie"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartStyle,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { formatBalance } from "@/lib/utils"

// Account type definition
export interface Account {
    id: string;
    name: string;
    type: string;
    on_budget: boolean;
    closed: boolean;
    note: string | null;
    balance: number;
    cleared_balance: number;
    uncleared_balance: number;
    transfer_payee_id: string;
    direct_import_linked: boolean;
    direct_import_in_error: boolean;
    last_reconciled_at: string | null;
    debt_original_balance: number | null;
    debt_interest_rates: Record<string, number>;
    debt_minimum_payments: Record<string, number>;
    debt_escrow_amounts: any[];
    deleted: boolean;
}

// Map account types to better display names
const typeLabels: Record<string, string> = {
    otherAsset: "Investments & Assets",
    creditCard: "Credit Cards",
    savings: "Savings Accounts",
    checking: "Current Accounts",
    cash: "Cash Accounts",
}

// Generate chart colors (you can replace these with your own CSS variables if desired)
const typeColors: Record<string, string> = {
    otherAsset: "#4CAF50",     // Green (Investments & Assets)
    creditCard: "#E74C3C",     // Red (Credit Cards - debt)
    savings: "#3498DB",        // Blue (Savings Accounts)
    checking: "#F39C12",       // Orange (Current Accounts)
    cash: "#9B59B6",           // Purple (Cash Accounts)
}

// Create a chart config based on the typeLabels
const chartConfig = Object.fromEntries(
    Object.entries(typeLabels).map(([key, label], index) => [
        key,
        {
            label,
            color: `hsl(var(--chart-${index + 1}))`,
        },
    ])
) as ChartConfig

// Component Props now expect accounts and a currency value.
export default function BalancePieChart({
    accounts,
    currency,
}: {
    accounts: Account[];
    currency: string;
}) {
    // Compute chart data from the provided accounts prop.
    const chartData = useMemo(() => {
        // Filter active accounts (excluding deleted or closed)
        const activeAccounts = accounts.filter(account => !account.deleted && !account.closed)

        // Group active accounts by type
        const groupedBalances = activeAccounts.reduce<Record<string, number>>((acc, account) => {
            if (!acc[account.type]) {
                acc[account.type] = 0
            }
            // Divide by 1000 if necessary (adjust as needed)
            acc[account.type] += account.balance / 1000
            return acc
        }, {})

        console.log(groupedBalances, "groupedBalances")

        // Convert grouped data to chart-friendly entries
        return Object.entries(groupedBalances).map(([type, balance]) => ({
            type,
            label: typeLabels[type] || type,
            balance,
            displayBalance: balance,
            fill: typeColors[type] || "gray",
        }))
    }, [accounts])

    // Manage state for the active account type for the chart.
    const [activeType, setActiveType] = useState("creditCard")
    const activeIndex = chartData.findIndex(item => item.type === activeType)
    const types = chartData.map(item => item.type)

    useEffect(() => {
        if (chartData.length > 0) {
            const hasCreditCard = chartData.some(item => item.type === "creditCard")
            setActiveType(hasCreditCard ? "creditCard" : chartData[0].type)
        }
    }, [chartData])

    return (
        <Card data-chart="ynab-balance-pie" className="flex flex-col h-[450px] w-[500px]">
            <ChartStyle id="ynab-balance-pie" config={chartConfig} />
            <CardHeader className="flex-row items-start space-y-0 pb-0">
                <div className="grid gap-1">
                    <CardTitle>Account Balances</CardTitle>
                    <CardDescription>Distribution Across Account Types</CardDescription>
                </div>
                {types.length > 1 && (
                    <Select value={activeType} onValueChange={setActiveType}>
                        <SelectTrigger className="ml-auto h-7 w-[180px] rounded-lg pl-2.5">
                            <SelectValue placeholder="Select Account Type" />
                        </SelectTrigger>
                        <SelectContent align="end" className="rounded-xl">
                            {types.map((type) => (
                                <SelectItem key={type} value={type} className="rounded-lg [&_span]:flex">
                                    <div className="flex items-center gap-2 text-xs">
                                        <span
                                            className="flex h-3 w-3 shrink-0 rounded-sm"
                                            style={{ backgroundColor: typeColors[type] }}
                                        />
                                        {typeLabels[type] || type}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </CardHeader>
            <CardContent className="flex flex-1 justify-center pb-0">
                <ChartContainer
                    id="ynab-balance-pie"
                    config={chartConfig}
                    className="mx-auto aspect-square w-full max-w-[300px]"
                >
                    <PieChart>
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Pie
                            data={chartData}
                            dataKey="balance"
                            nameKey="label"
                            innerRadius={60}
                            strokeWidth={5}
                            activeIndex={activeIndex}
                            activeShape={({ outerRadius = 0, ...props }: PieSectorDataItem) => (
                                <g>
                                    <Sector {...props} outerRadius={outerRadius + 10} />
                                    <Sector
                                        {...props}
                                        outerRadius={outerRadius + 25}
                                        innerRadius={outerRadius + 12}
                                    />
                                </g>
                            )}
                        >
                            <Label
                                content={({ viewBox }) => {
                                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                        return (
                                            <text
                                                x={viewBox.cx}
                                                y={viewBox.cy}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                            >
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={viewBox.cy}
                                                    className="fill-foreground text-SM font-bold"
                                                >
                                                    {formatBalance(chartData[activeIndex]?.balance || 0, currency)}
                                                </tspan>
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) + 24}
                                                    className="fill-muted-foreground text-sx"
                                                >
                                                    {typeLabels[activeType] || activeType}
                                                </tspan>
                                            </text>
                                        )
                                    }
                                }}
                            />
                        </Pie>
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
