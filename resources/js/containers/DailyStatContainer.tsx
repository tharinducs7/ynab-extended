/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react"
import axios from "axios"
import { useYNABContext } from "@/context/YNABContext"
import { Skeleton } from "@/components/ui/skeleton"
import { format, startOfMonth } from "date-fns"
import { DailyTransactionsWidget } from "@/components/widgets/DailyTransactionsWidget"
import { DailyChartv2 } from "@/components/charts/DailyChartv2"

interface DailyAnalyticsData {
  transactions: any[]
  chart_data: {
    date: string
    income: number
    expense: number
  }[]
}

export function DailyStatContainer() {
  const { currentBudget, selectedDate } = useYNABContext()
  const [data, setData] = useState<DailyAnalyticsData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    if (!currentBudget || !selectedDate) return

    const token = sessionStorage.getItem("ynab_access_token")
    if (!token) return

    // Format the selected date to the first day of the month (YYYY-MM-01)
    const monthDate = startOfMonth(selectedDate)
    const formattedMonth = format(monthDate, "yyyy-MM-dd")
    const storedDataKey = `dailyAnalytics-${currentBudget.id}-${formattedMonth}`

    const cachedData = sessionStorage.getItem(storedDataKey)
    if (cachedData) {
      setData(JSON.parse(cachedData))
      setLoading(false)
      return
    }

    // Build the URL: /api/ynab/monthly-analytics/{budgetId}/transactions/{month?}
    axios
      .get(
        `/api/ynab/monthly-analytics/${currentBudget.id}/transactions/${formattedMonth}`,
        { params: { token } }
      )
      .then((response) => {
        setData(response.data)
        sessionStorage.setItem(storedDataKey, JSON.stringify(response.data))
      })
      .catch((error) => {
        console.error("Error fetching daily analytics:", error)
      })
      .finally(() => setLoading(false))
  }, [currentBudget, selectedDate])

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (!data) {
    return <p>No data available.</p>
  }

  return (
    <div className="">
      <div className="grid auto-rows-min gap-4 md:grid-cols-1">
        <div className="">
          <DailyTransactionsWidget transactions={data.transactions} />
        </div>
        <div className="">
          {/* You could add additional components here if needed */}
        </div>
      </div>
      <div className="grid auto-rows-min gap-4 md:grid-cols-1 mt-2">
        {/* <DailyExpenseIncome chartData={data.chart_data} /> */}
        <DailyChartv2 chartData={data.chart_data} />
      </div>
    </div>
  )
}
