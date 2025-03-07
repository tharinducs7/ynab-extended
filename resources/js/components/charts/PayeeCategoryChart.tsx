/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import * as React from "react"
import { Pie, PieChart, Cell, Tooltip, Legend } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useYNABContext } from "@/context/YNABContext"

export function PayeeCategoryChart() {
  const { payeeChartData } = useYNABContext()
  const data = payeeChartData || []

  // Use a color palette for up to 5 payees.
  const colors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payee Category Pie Chart</CardTitle>
        <CardDescription>
          Top 5 payees spending for the selected period
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <PieChart width={500} height={300}>
          <Pie
            data={data}
            dataKey="activity"
            nameKey="payee"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label
          >
            {data.map((entry: any, index: number) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </CardContent>
    </Card>
  )
}
