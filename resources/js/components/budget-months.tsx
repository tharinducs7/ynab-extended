/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useYNABContext } from "@/context/YNABContext";

// Helper to get current month in "YYYY-MM-01" format
function getCurrentMonthString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // JavaScript months: 0-11
  const monthPadded = month < 10 ? `0${month}` : month;
  return `${year}-${monthPadded}-01`;
}

// Helper to format a month string as "YYYY MonthName", e.g. "2025 April"
function formatMonth(monthStr: string): string {
  const date = new Date(monthStr);
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long" }).format(date);
}

export function BudgetMonths() {
  const {
    currentBudget,
    selectedBudgetMonth,
    setSelectedBudgetMonth,
  } = useYNABContext();
  const [months, setMonths] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!currentBudget) return;
    const token = sessionStorage.getItem("ynab_access_token");
    if (!token) {
      setError("Access token not found.");
      return;
    }

    // Build a sessionStorage key unique for this budget's months data
    const storedDataKey = `budgetMonths-${currentBudget.id}`;
    const cachedData = sessionStorage.getItem(storedDataKey);

    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        // Assume API structure is { data: { months: [...] } }
        const monthsData = parsed.data.months;
        setMonths(monthsData);
        setLoading(false);

        // Always select current system month by default
        const currentMonthStr = getCurrentMonthString();
        setSelectedBudgetMonth(currentMonthStr);
        sessionStorage.setItem("selectedBudgetMonth", currentMonthStr);
      } catch (err) {
        console.error("Failed to parse cached months:", err);
        fetchMonths(token, storedDataKey);
      }
    } else {
      fetchMonths(token, storedDataKey);
    }
  }, [currentBudget, setSelectedBudgetMonth]);

  const fetchMonths = (token: string, storedDataKey: string) => {
    axios
      .post(`/api/ynab/${currentBudget!.id}/months`, { token })
      .then((response) => {
        const data = response.data;
        if (data && data.data && data.data.months) {
          setMonths(data.data.months);
          sessionStorage.setItem(storedDataKey, JSON.stringify(data));
          // Always select current system month by default
          const currentMonthStr = getCurrentMonthString();
          setSelectedBudgetMonth(currentMonthStr);
          sessionStorage.setItem("selectedBudgetMonth", currentMonthStr);
        } else {
          setError("No months data received.");
        }
      })
      .catch((err) => {
        console.error("Error fetching budget months:", err);
        setError("Error fetching budget months.");
      })
      .finally(() => setLoading(false));
  };

  // Auto-scroll to selected month when the dropdown opens.
  useEffect(() => {
    if (open && selectedBudgetMonth) {
      const el = document.getElementById(`budget-month-${selectedBudgetMonth}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [open, selectedBudgetMonth]);

  if (loading) return <div>Loading Months...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full md:w-[300px] justify-between"
        >
          {selectedBudgetMonth ? formatMonth(selectedBudgetMonth) : "Select Month..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full md:w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search months..." className="h-9" />
          <CommandList>
            <CommandEmpty>No months found.</CommandEmpty>
            <CommandGroup>
              {months.map((m) => (
                <CommandItem
                  key={m.month}
                  className={selectedBudgetMonth === m.month ? "bg-blue-200 hover:bg-blue-100" : ""}
                  id={`budget-month-${m.month}`}
                  onSelect={() => {
                    setSelectedBudgetMonth(m.month);
                    sessionStorage.setItem("selectedBudgetMonth", m.month);
                    setOpen(false);
                  }}
                >
                  {formatMonth(m.month)}
                  {selectedBudgetMonth === m.month && <Check className="ml-auto" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default BudgetMonths;
