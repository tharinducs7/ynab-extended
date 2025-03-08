import { useYNABContext } from "@/context/YNABContext"
import * as React from "react"
import {
    BarChart,
    Bar,
    CartesianGrid,
    XAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts"

interface ChartDataItem {
    date: string
    income: number
    expense: number
}

interface ChartComponentProps {
    chartData: ChartDataItem[]
}

export const DailyExpenseIncome: React.FC<ChartComponentProps> = ({ chartData }) => {
    const { currentBudget } = useYNABContext()
    return (
        <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                        dataKey="date"
                        tickFormatter={(date) => {
                            const d = new Date(date)
                            return d.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                            })
                        }}
                    />
                    <Tooltip
                        formatter={(value) => {
                            const formattedValue = new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: currentBudget?.currency,
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }).format(Number(value))
                            return formattedValue
                        }}
                    />
                    <Legend />
                    <Bar dataKey="income" stackId="a" fill="#2dd4bf" name="Income" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="expense" stackId="a" fill="#60a5fa" name="Expense" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
