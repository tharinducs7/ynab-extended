import { useEffect, useState } from "react"
import axios from "axios"
import { TrendingUp } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

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
    ChartTooltipContent
} from "@/components/ui/chart"

interface AgeOfMoneyData {
    month: string
    age_of_money: number
}

// Use the same chart color config
const chartConfig = {
    age_of_money: {
        label: "Age of Money (Days) :",
        color: "#2563eb",
    },
} satisfies ChartConfig

export function AgeOfMoneyChart({ budgetId }: { budgetId: string }) {
    const [chartData, setChartData] = useState<AgeOfMoneyData[]>([])
    const [currentAgeOfMoney, setCurrentAgeOfMoney] = useState<number | null>(null);
    const [trendPercentage, setTrendPercentage] = useState<number | null>(null);
    const [trendDirection, setTrendDirection] = useState<'up' | 'down' | 'neutral' | null>(null);

    useEffect(() => {
        console.log(budgetId, "budgetId");

        if (!budgetId) return;

        const storedDataKey = `ageOfMoneyData-${budgetId}`;
        const storedData = sessionStorage.getItem(storedDataKey);

        if (storedData) {
            const parsed = JSON.parse(storedData);
            setChartData(parsed.chart_data);
            setCurrentAgeOfMoney(parsed.current_age_of_money);
            setTrendPercentage(parsed.trend_percentage);
            setTrendDirection(parsed.trend_direction);
        } else {
            const accessToken = sessionStorage.getItem('ynab_access_token');

            axios.post(`/api/ynab/${budgetId}/age-of-money`, { token: accessToken })
                .then((response) => {
                    const { chart_data, current_age_of_money, trend_percentage, trend_direction } = response.data;

                    setChartData(chart_data);
                    setCurrentAgeOfMoney(current_age_of_money);
                    setTrendPercentage(trend_percentage);
                    setTrendDirection(trend_direction);

                    sessionStorage.setItem(storedDataKey, JSON.stringify(response.data));
                })
                .catch((error) => console.error("Failed to fetch Age of Money data:", error));
        }
    }, []);

    return (
        <Card className="h-[450px] w-[500px]">
            <CardHeader>
                <CardTitle>Age of Money</CardTitle>
                <CardDescription>Tracking Age of Money over the Last 6 Months</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig}>
                    <LineChart
                        accessibilityLayer
                        width={300}
                        height={100}
                        data={chartData}
                        margin={{
                            left: 12,
                            right: 12,
                        }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => value.slice(0, 3)} // Shorten month names
                        />
                        <YAxis />
                        <ChartTooltip
                            cursor={true}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Line
                            type="natural"
                            dataKey="age_of_money"
                            stroke="#2563eb"
                            strokeWidth={2}
                            dot={{
                                fill: "hsl(var(--chart-1))",
                            }}
                        />
                    </LineChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-1 font-medium leading-none">
                    Age of Money <strong>{currentAgeOfMoney} days</strong>
                </div>
                <div className="leading-none text-muted-foreground">

                    {trendDirection === 'up' && (
                        <span className="flex items-center gap-1">
                            an increase of <strong>{trendPercentage}%</strong> compared to the previous month
                            <TrendingUp className="h-4 w-4 text-green-600" />
                        </span>
                    )}

                    {trendDirection === 'down' && (
                        <span className="flex items-center gap-1">
                            a decrease of <strong>{trendPercentage}%</strong> compared to the previous month
                            <TrendingUp className="h-4 w-4 rotate-180 text-red-600" />
                        </span>
                    )}

                    {trendDirection === 'neutral' && (
                        <span className="flex items-center gap-1">
                            with no significant change compared to the previous month
                            <TrendingUp className="h-4 w-4 text-gray-400" />
                        </span>
                    )}
                </div>
            </CardFooter>
        </Card>
    )
}
