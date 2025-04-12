"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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

export function MonthlyCategorySpending() {
  // Expect monthlyChartData in context, which should be an array of objects like:
  // [ { month: "24 Jan", spending: 120 }, { month: "24 Feb", spending: 200 }, ... ]
  const { monthlyChartData } = useYNABContext()
  const chartData = monthlyChartData || []

  const chartConfig = {
    spending: {
      label: "Spending",
      color: "hsl(var(--chart-1))",
    },
    label: {
      color: "hsl(var(--background))",
    },
  } satisfies ChartConfig

  return (
    <Card className="h-auto">
      <CardHeader>
        <CardTitle>Monthly Spending</CardTitle>
        <CardDescription>
          {chartData.length > 0
            ? `From ${chartData[0].month} to ${chartData[chartData.length - 1].month}`
            : "No data available"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart data={chartData} margin={{ right: 16 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              // Labels are already in short form, e.g. "24 Jan"
            />
            <YAxis hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Bar
              dataKey="spending"
              fill="var(--chart-1)"
              radius={2}    // slim bars for a cute look
              barSize={20}  // adjust width as needed
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Total spending for the selected 1-year period.
        </div>
      </CardFooter>
    </Card>
  )
}
