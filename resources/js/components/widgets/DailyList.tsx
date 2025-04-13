/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import axios from "axios";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useYNABContext } from "@/context/YNABContext";
import { formatBalance } from "@/lib/utils";

interface DailySummary {
    date: string;
    sum_income: number;
    sum_expenses: number;
    net_value: number;
    active_categories: {
        id: string;
        name: string;
        sum_income: number;
        sum_expense: number;
    }[];
    active_payees: {
        id: string;
        name: string;
        sum_income: number;
        sum_expense: number;
    }[];
    active_accounts: {
        id: string;
        name: string;
        note: string;
        sum_income: number;
        sum_expense: number;
    }[];
}

export function DailyList() {
    const { currentBudget, selectedBudgetMonth, setMonthlyData, setSelectedDate } = useYNABContext();
    const [dailySummary, setDailySummary] = useState<DailySummary[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!currentBudget || !selectedBudgetMonth) return;

        const token = sessionStorage.getItem("ynab_access_token");
        if (!token) {
            setError("Access token not found.");
            return;
        }

        const url = `/api/ynab/monthly-analytics/${currentBudget.id}/transactions/${selectedBudgetMonth}`;

        axios
            .post(url, { token })
            .then((response) => {
                if (response.data) {
                    setDailySummary(response.data.daily_summary);
                    setMonthlyData(response.data);
                    console.log(response.data, "response.data");

                } else {
                    setError("No daily summary data received.");
                }
            })
            .catch((err) => {
                console.error("Failed to fetch daily transactions summary:", err);
                setError("Failed to fetch daily transactions summary.");
            })
            .finally(() => setLoading(false));
    }, [currentBudget, selectedBudgetMonth]);

    if (loading) return <div>Loading Daily Summaries...</div>;
    if (error) return <div className="text-red-500">{error}</div>;
    if (dailySummary.length === 0) return <div>No daily summary data found.</div>;

    const currencyIso = currentBudget?.currency ?? "USD";

    // Helper: Get Monday (start of week) from a date (using Monday as the week start)
    const getMonday = (date: Date): Date => {
        const d = new Date(date);
        const day = d.getDay();
        // Adjust when the day is Sunday (0): treat it as 7 so Monday comes before
        const diff = d.getDate() - (day === 0 ? 6 : day - 1);
        return new Date(d.setDate(diff));
    };

    // Helper: Compute the ISO week number for a given date
    const getISOWeekNumber = (date: Date): number => {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    };

    // Group daily summaries by week (using the Monday date as the group key)
    const groupedData = dailySummary.reduce((acc: Record<string, DailySummary[]>, day) => {
        const dateObj = new Date(day.date);
        const monday = getMonday(dateObj);
        const weekKey = monday.toISOString().split("T")[0];
        if (!acc[weekKey]) {
            acc[weekKey] = [];
        }
        acc[weekKey].push(day);
        return acc;
    }, {});

    // Sort weeks in ascending order (from earliest to latest)
    const sortedWeeks = Object.keys(groupedData).sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    return (
        <div className="">
            <ScrollArea.Root className="relative h-[650px] w-full rounded overflow-auto">
                <ScrollArea.Viewport className="w-full">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Income</TableHead>
                                <TableHead className="text-right">Expenses</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedWeeks.map((weekKey) => {
                                const weekStart = new Date(weekKey);
                                const weekStartFormatted = weekStart.toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                });
                                const weekNumber = getISOWeekNumber(weekStart);
                                // Sort each week’s days chronologically
                                const sortedDays = groupedData[weekKey].sort(
                                    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
                                );
                                return (
                                    <React.Fragment key={weekKey}>
                                        {/* Week header row including week number */}
                                        <TableRow className="bg-blue-50 font-bold">
                                            <TableCell colSpan={3}>
                                                Week of {weekStartFormatted} (Week {weekNumber})
                                            </TableCell>
                                        </TableRow>
                                        {sortedDays.map((day) => {
                                            const dateObj = new Date(day.date);
                                            const bothZero = day.sum_income === 0 && day.sum_expenses === 0;
                                            // Create the date card: abbreviated weekday and day number
                                            const weekdayShort = dateObj
                                                .toLocaleDateString("en-US", { weekday: "short" })
                                                .toUpperCase();
                                            const dayNumber = dateObj.getDate();
                                            // Highlight weekend rows (Saturday [6] and Sunday [0])
                                            const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                                            // Check if this date is today's date
                                            const today = new Date();
                                            const isToday =
                                                dateObj.getFullYear() === today.getFullYear() &&
                                                dateObj.getMonth() === today.getMonth() &&
                                                dateObj.getDate() === today.getDate();
                                            return (
                                                <TableRow
                                                    key={day.date}
                                                    className={isWeekend ? "bg-gray-50 cursor-pointer" : "cursor-pointer"}
                                                    onClick={() => {
                                                        setSelectedDate(day.date);
                                                        window.scrollTo({ top: 0, behavior: "smooth" });
                                                    }}
                                                >
                                                    <TableCell>
                                                        <div
                                                            className={`flex flex-col items-center px-2 py-1 rounded ${isToday
                                                                    ? "bg-blue-500 text-white"
                                                                    : ""
                                                                }`}
                                                        >
                                                            <span className="text-xs font-medium">
                                                                {weekdayShort}
                                                            </span>
                                                            <span className="text-sm font-bold">
                                                                {dayNumber}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell
                                                        className={`text-right font-semibold ${bothZero
                                                                ? "text-gray-700"
                                                                : "text-green-700"
                                                            }`}
                                                    >
                                                        {formatBalance(day.sum_income, currencyIso)}
                                                    </TableCell>
                                                    <TableCell
                                                        className={`text-right font-semibold ${bothZero
                                                                ? "text-gray-700"
                                                                : "text-red-700"
                                                            }`}
                                                    >
                                                        {formatBalance(day.sum_expenses, currencyIso)}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </React.Fragment>
                                );
                            })}
                        </TableBody>
                    </Table>
                </ScrollArea.Viewport>
                <ScrollArea.Scrollbar
                    orientation="vertical"
                    className="flex select-none touch-none p-2"
                >
                    <ScrollArea.Thumb className="bg-gray-500 rounded" />
                </ScrollArea.Scrollbar>
                <ScrollArea.Corner />
            </ScrollArea.Root>
        </div>
    );
}

export default DailyList;
