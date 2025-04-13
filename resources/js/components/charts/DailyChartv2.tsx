/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { useYNABContext } from "@/context/YNABContext"

const chartConfig = {
    views: {
        label: "LKR",
    },
    expense: {
        label: "expense",
        color: "#f87171",
    },
    income: {
        label: "Income",
        color: "#2dd4bf",
    },
} satisfies ChartConfig

interface ChartDataItem {
    date: string
    income: number
    expense: number
}


export const DailyChartv2: React.FC = () => {
    const { activeTab, setActiveTab, selectedMonthlyData } = useYNABContext() as {
        selectedDate: Date;
        currentBudget: any;
        activeTab: keyof typeof chartConfig;
        setActiveTab: (tab: keyof typeof chartConfig) => void;
        selectedMonthlyData: any;
    }

    const { chart_data: chartData } = selectedMonthlyData || [];

    const total = React.useMemo(
        () => ({
            expense: chartData?.reduce((acc: any, curr: { expense: any }) => acc + curr.expense, 0),
            income: chartData?.reduce((acc: any, curr: { income: any }) => acc + curr.income, 0),
        }),
        [chartData]
    )

    const handleBarClick = (data: any, index: number) => {
        // data.payload contains the original data item
        const clickedDate = data?.payload?.date
        console.log("Clicked date:", clickedDate)
    }

    return (
        <Card>
            <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
                <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
                    <CardTitle>Bar Chart - Interactive</CardTitle>
                </div>
                <div className="flex">
                    {["expense", "income"].map((key) => {
                        const chart = key as keyof typeof chartConfig
                        return (
                            <button
                                key={chart}
                                data-active={activeTab === chart}
                                className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
                                onClick={() => setActiveTab(chart)}
                            >
                                <span className="text-xs text-muted-foreground">
                                    {chartConfig[chart].label}
                                </span>
                                <span className="text-xs font-bold leading-none">
                                    {total[key as keyof typeof total]?.toLocaleString()}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </CardHeader>
            <CardContent className="px-2 sm:p-6">
                <ChartContainer
                    config={chartConfig}
                    className="aspect-auto h-[250px] w-full"
                >
                    <BarChart
                        accessibilityLayer
                        data={chartData}
                        margin={{
                            left: 12,
                            right: 12,
                        }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={32}
                            tickFormatter={(value) => {
                                const date = new Date(value)
                                return date.toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                })
                            }}
                        />
                        <ChartTooltip
                            content={
                                <ChartTooltipContent
                                    className="w-[150px]"
                                    nameKey="views"
                                    labelFormatter={(value) => {
                                        return new Date(value).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                        })
                                    }}
                                />
                            }
                        />
                        <Bar dataKey={activeTab} fill={`var(--color-${activeTab})`} radius={[4, 4, 0, 0]} onClick={handleBarClick} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
