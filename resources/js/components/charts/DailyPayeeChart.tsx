/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import * as React from "react"
import { Label, Pie, PieChart, Sector, Cell } from "recharts"

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
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
import { Avatar, AvatarImage } from "../ui/avatar"
import { formatPayeeForUrl } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import noDataImg from "../../../../public/no_data.png";
// Define income and expense color scales (from lowest to highest intensity)
const incomeColors = ["#86efac", "#4ade80", "#22c55e", "#16a34a", "#15803d"]
const expenseColors = ["#f87171", "#ef4444", "#dc2626", "#dc2626", "#b91c1c"]

interface PayeeDataItem {
    payee: string
    activity: number
}

interface PayeeCategoryChartProps {
    transactions: any[]
}

export function DailyPayeeChart({ transactions }: PayeeCategoryChartProps) {
    // First, filter out transactions that have a null category_id.
    const validTransactions = React.useMemo(() => {
        return transactions.filter((txn) => txn.category_id !== null)
    }, [transactions])

    // Aggregate income data (only transactions with amount >= 0)
    const aggregatedIncomeData: PayeeDataItem[] = React.useMemo(() => {
        const agg: Record<string, number> = {}
        validTransactions.forEach((txn) => {
            if (txn.payee_name && txn.amount >= 0) {
                agg[txn.payee_name] = (agg[txn.payee_name] || 0) + txn.amount
            }
        })
        const result = Object.entries(agg).map(([payee, activity]) => ({
            payee,
            activity,
        }))
        result.sort((a, b) => b.activity - a.activity)
        return result.slice(0, 5)
    }, [validTransactions])

    // Aggregate expense data (only transactions with amount < 0; use absolute value)
    const aggregatedExpenseData: PayeeDataItem[] = React.useMemo(() => {
        const agg: Record<string, number> = {}
        validTransactions.forEach((txn) => {
            if (txn.payee_name && txn.amount < 0) {
                const amt = Math.abs(txn.amount)
                agg[txn.payee_name] = (agg[txn.payee_name] || 0) + amt
            }
        })
        const result = Object.entries(agg).map(([payee, activity]) => ({
            payee,
            activity,
        }))
        result.sort((a, b) => b.activity - a.activity)
        return result.slice(0, 5)
    }, [validTransactions])

    // Determine if we have both income and expense data.
    const hasIncome = aggregatedIncomeData.length > 0
    const hasExpense = aggregatedExpenseData.length > 0

    // We'll use tabs only if we have both.
    const [activeTab, setActiveTab] = React.useState<"income" | "expense">(
        hasIncome && !hasExpense ? "income" : hasExpense && !hasIncome ? "expense" : "income"
    )

    // Use the appropriate data and color scale depending on the active tab.
    const data: PayeeDataItem[] = activeTab === "income" ? aggregatedIncomeData : aggregatedExpenseData
    const colorScale = activeTab === "income" ? incomeColors : expenseColors

    // Build dynamic chart config mapping each payee to a color.
    const dynamicChartConfig = React.useMemo(() => {
        let colorIndex = 0
        return data.reduce((acc: Record<string, { label: string; color: string }>, cur: PayeeDataItem) => {
            acc[cur.payee] = {
                label: cur.payee,
                color: colorScale[colorIndex % colorScale.length],
            }
            colorIndex++
            return acc
        }, {} as Record<string, { label: string; color: string }>)
    }, [data, colorScale])

    // Active payee state for highlighting in the chart.
    const [activeIndex, setActiveIndex] = React.useState<number>(0)
    const [activePayee, setActivePayee] = React.useState<string>(data[0]?.payee || "")

    const handleSelect = (payee: string) => {
        setActivePayee(payee)
        const idx = data.findIndex((item) => item.payee === payee)
        setActiveIndex(idx)
    }

    React.useEffect(() => {
        if (data.length > 0) {
            setActivePayee(data[0].payee)
            setActiveIndex(0)
        } else {
            setActivePayee("")
            setActiveIndex(-1)
        }
    }, [data])

    return (
        <Card data-chart="pie-interactive" className="flex flex-col">
            <ChartStyle id="pie-interactive" config={dynamicChartConfig as ChartConfig} />
            <CardHeader className="flex flex-col sm:flex-row items-center justify-between">
                <CardTitle>
                    {activeTab === "income" ? "Top Income Categories" : "Top Expense Categories"}
                    <div className="flex items-center space-x-4 mt-2">
                        {activeIndex >= 0 && data[activeIndex] && (
                            <Avatar className="size-6 rounded-lg">
                                <AvatarImage
                                    src={`https://ik.imagekit.io/apbypokeqx/tr:di-default.png/${formatPayeeForUrl(
                                        data[activeIndex]?.payee
                                    )}.png`}
                                    alt={data[activeIndex]?.payee}
                                />
                            </Avatar>
                        )}
                        {data.length !== 0 && (
                            <Select value={activePayee} onValueChange={handleSelect}>
                                <SelectTrigger className="h-7 w-full rounded-lg pl-2.5" aria-label="Select a payee">
                                    <SelectValue placeholder="Select payee" />
                                </SelectTrigger>
                                <SelectContent align="end" className="rounded-xl">
                                    {data.map((item) => {
                                        const config = dynamicChartConfig[item.payee]
                                        if (!config) return null
                                        return (
                                            <SelectItem
                                                key={item.payee}
                                                value={item.payee}
                                                className="rounded-lg [&_span]:flex"
                                            >
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span
                                                        className="flex h-3 w-3 shrink-0 rounded-sm"
                                                        style={{ backgroundColor: config.color }}
                                                    />
                                                    {config.label}
                                                </div>
                                            </SelectItem>
                                        )
                                    })}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </CardTitle>
                <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as "income" | "expense")}>
                    <TabsList>
                        <TabsTrigger value="income">Income</TabsTrigger>
                        <TabsTrigger value="expense">Expense</TabsTrigger>
                    </TabsList>
                </Tabs>
            </CardHeader>
            <CardContent className="flex flex-1 justify-center pb-0">
                <ChartContainer
                    id="pie-interactive"
                    config={dynamicChartConfig as ChartConfig}
                    className="mx-auto aspect-square w-full max-w-[300px]"
                >
                    {data.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            {/* Replace '/no-data.png' with the correct path to your no-data image */}
                            <img
                                src={noDataImg}
                                alt="No Data Available"
                                className="w-full max-w-[300px] aspect-square object-contain"
                            />
                        </div>
                    ) : (
                        <PieChart>
                            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                            <Pie
                                data={data}
                                dataKey="activity"
                                nameKey="payee"
                                innerRadius={60}
                                strokeWidth={5}
                                activeIndex={activeIndex}
                                activeShape={({ outerRadius = 0, ...props }) => (
                                    <g>
                                        <Sector {...props} outerRadius={outerRadius + 10} />
                                        <Sector {...props} outerRadius={outerRadius + 25} innerRadius={outerRadius + 12} />
                                    </g>
                                )}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={dynamicChartConfig[entry.payee].color} />
                                ))}
                                <Label
                                    content={({ viewBox }) => {
                                        if (viewBox && "cx" in viewBox && "cy" in viewBox && activeIndex !== -1) {
                                            return (
                                                <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                                    <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-sm font-bold">
                                                        {data[activeIndex].activity.toLocaleString()}
                                                    </tspan>
                                                    <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-muted-foreground">
                                                        {data[activeIndex].payee}
                                                    </tspan>
                                                </text>
                                            )
                                        }
                                    }}
                                />
                            </Pie>
                        </PieChart>
                    )}
                </ChartContainer>

            </CardContent>
        </Card>
    )
}
