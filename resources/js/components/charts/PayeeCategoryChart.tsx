/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react"
import { Label, Pie, PieChart, Sector, Cell } from "recharts"
import { PieSectorDataItem } from "recharts/types/polar/Pie"

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
import { useYNABContext } from "@/context/YNABContext"

// Default hex colors for up to 5 payees.
const defaultColors = [
  "#4338ca", // a red-orange color
  "#4f46e5", // a bright green
  "#6366f1", // a vivid blue
  "#818cf8", // a hot pink
  "#a5b4fc", // a rich purple
]

export function PayeeCategoryChart() {
  const { payeeChartData, selectedCategoryGroupId } = useYNABContext()
  const [activeIndex, setActiveIndex] = React.useState(-1)
  const data = payeeChartData || []

  // Generate dynamic chart config based on payee data.
  const dynamicChartConfig = React.useMemo(() => {
    return data.reduce((acc: Record<string, { label: string; color: string }>, cur: { payee: string }, idx: number) => {
      acc[cur.payee] = {
        label: cur.payee,
        color: defaultColors[idx % defaultColors.length],
      }
      return acc
    }, {} as Record<string, { label: string; color: string }>)
  }, [data])

  console.log(data[0]?.payee, "payee");

  // Set the first payee as active by default if available.
  const [activePayee, setActivePayee] = React.useState(data[0]?.payee || "")

  const handleSelect = (payee: string) => {
    setActivePayee(payee)
    setActiveIndex(data.findIndex((item: any) => item.payee === payee))
  }

  React.useEffect(() => {
    if (data.length > 0) {
      const payeeToSelect = data[0].payee
      setActivePayee(payeeToSelect)
      setActiveIndex(data.findIndex((item: any) => item.payee === payeeToSelect))
    } else {
      setActivePayee("")
      setActiveIndex(-1)
    }
  }, [data, selectedCategoryGroupId])

console.log(activeIndex, "index");

  return (
    <Card data-chart="pie-interactive" className="flex flex-col">
      <ChartStyle id="pie-interactive" config={dynamicChartConfig as ChartConfig} />
      <CardHeader className="flex-row items-start space-y-0 pb-0">
        <div className="grid gap-1">
          <CardTitle>Payee Category Pie Chart - Interactive</CardTitle>
          <CardDescription>Select a payee to highlight activity</CardDescription>
        </div>
        <Select value={activePayee} onValueChange={handleSelect}>
          <SelectTrigger
            className="ml-auto h-7 w-[230px] rounded-lg pl-2.5"
            aria-label="Select a payee"
          >
            <SelectValue placeholder="Select payee" />
          </SelectTrigger>
          <SelectContent align="end" className="rounded-xl">
            {data.map((item: any) => {
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
      </CardHeader>
      <CardContent className="flex flex-1 justify-center pb-0">
        <ChartContainer
          id="pie-interactive"
          config={dynamicChartConfig as ChartConfig}
          className="mx-auto aspect-square w-full max-w-[300px]"
        >
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={data}
              dataKey="activity"
              nameKey="payee"
              innerRadius={60}
              strokeWidth={5}
              activeIndex={activeIndex}
              activeShape={({
                outerRadius = 0,
                ...props
              }: PieSectorDataItem) => (
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
              {data.map((entry: any, index: any) => (
                <Cell key={`cell-${index}`} fill={dynamicChartConfig[entry.payee].color} />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox && activeIndex !== -1) {
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
                          className="fill-foreground text-sm font-bold"
                        >
                          {data[activeIndex].activity.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          {data[activeIndex].payee}
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
