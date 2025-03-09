/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import * as React from "react"
import { BarChart, Bar, Cell, CartesianGrid, XAxis, YAxis } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import noDataImg from "../../../../public/no_data.jpg";

// Define income and expense color scales (from lowest to highest intensity)
const incomeColors = ["#86efac", "#4ade80", "#22c55e", "#16a34a", "#15803d"]
const expenseColors = ["#f87171", "#ef4444", "#dc2626", "#dc2626", "#b91c1c"]

interface CategoryDataItem {
    category: string
    total: number
}

interface CategoryBarChartProps {
    transactions: any[]
}

export function CategoryBarChart({ transactions }: CategoryBarChartProps) {

    // Filter out transactions with a null category_id.
    const validTransactions = React.useMemo(() => {
        return transactions.filter((txn) => txn.category_id !== null)
    }, [transactions])

    // Aggregate income data (only transactions with amount >= 0)
    const aggregatedIncomeData: CategoryDataItem[] = React.useMemo(() => {
        const agg: Record<string, number> = {}
        validTransactions.forEach((txn) => {
            // Use category_name from your data
            if (txn.category_name && txn.amount >= 0) {
                agg[txn.category_name] = (agg[txn.category_name] || 0) + txn.amount
            }
        })
        const result = Object.entries(agg).map(([category, total]) => ({ category, total }))
        result.sort((a, b) => b.total - a.total)
        return result.slice(0, 5)
    }, [validTransactions])

    // Aggregate expense data (only transactions with amount < 0; using absolute value)
    const aggregatedExpenseData: CategoryDataItem[] = React.useMemo(() => {
        const agg: Record<string, number> = {}
        validTransactions.forEach((txn) => {
            if (txn.category_name && txn.amount < 0) {
                const absAmount = Math.abs(txn.amount)
                agg[txn.category_name] = (agg[txn.category_name] || 0) + absAmount
            }
        })
        const result = Object.entries(agg).map(([category, total]) => ({ category, total }))
        result.sort((a, b) => b.total - a.total)
        return result.slice(0, 5)
    }, [validTransactions])

    console.log(aggregatedIncomeData, "aggregatedExpenseData", aggregatedExpenseData)
    // Always show both tabs. Default to "income".
    const [activeTab, setActiveTab] = React.useState<"income" | "expense">("income")

    // Select the data and color scale based on the active tab.
    const data = activeTab === "income" ? aggregatedIncomeData : aggregatedExpenseData
    const colorScale = activeTab === "income" ? incomeColors : expenseColors

    // Build dynamic chart configuration mapping each category to its color.
    const dynamicChartConfig = React.useMemo(() => {
        let colorIndex = 0
        return data.reduce((acc: Record<string, { label: string; color: string }>, item: CategoryDataItem) => {
            acc[item.category] = {
                label: item.category,
                color: colorScale[colorIndex % colorScale.length],
            }
            colorIndex++
            return acc
        }, {} as Record<string, { label: string; color: string }>)
    }, [data, colorScale])

    return (
        <Card>
            <CardHeader className="flex flex-col sm:flex-row items-center justify-between">
                <CardTitle>
                    {activeTab === "income" ? "Top Income Categories" : "Top Expense Categories"}
                </CardTitle>
                <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as "income" | "expense")}>
                    <TabsList>
                        <TabsTrigger value="income">Income</TabsTrigger>
                        <TabsTrigger value="expense">Expense</TabsTrigger>
                    </TabsList>
                </Tabs>
            </CardHeader>
            <CardContent>
                <ChartContainer config={dynamicChartConfig}>
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
                        <BarChart data={data} width={300} height={250}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" />
                            <XAxis dataKey="category" tickLine={false} />
                            <YAxis />
                            <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
                            <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={colorScale[index % colorScale.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    )}
                </ChartContainer>
            </CardContent>
            <CardFooter>
                <CardDescription>
                    {activeTab === "income" ? "Total income per category" : "Total expenses per category"}
                </CardDescription>
            </CardFooter>
        </Card>
    )
}
