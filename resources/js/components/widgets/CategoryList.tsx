/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import { useYNABContext } from "@/context/YNABContext";

interface YnabCategory {
  id: string;
  name: string;
  hidden: boolean;
  deleted: boolean;
}

interface YnabCategoryGroup {
  id: string;
  name: string;
  hidden: boolean;
  deleted: boolean;
  categories: YnabCategory[];
}

export function CategoryList() {
  const {
    currentBudget,
    setSelectedCategorySubId,
    // We assume these exist in your YNABContext:
    setPayeeChartData,
    setMonthlyChartData,
    // Possibly a "setTransactions" if needed, or you can store them in your context
  } = useYNABContext();

  const [categoryGroups, setCategoryGroups] = useState<YnabCategoryGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    if (!currentBudget) return;

    const token = sessionStorage.getItem("ynab_access_token");
    if (!token) {
      setError("Access token not found.");
      return;
    }

    // Build a sessionStorage key unique to this budget
    const storedDataKey = `categories-${currentBudget.id}`;
    const cachedData = sessionStorage.getItem(storedDataKey);

    if (cachedData) {
      // We have cached data in sessionStorage, parse and use it
      try {
        const parsed = JSON.parse(cachedData);
        setCategoryGroups(parsed);
      } catch (err) {
        console.error("Failed to parse cached categories:", err);
        // If parse fails, fall through and fetch from API
        fetchCategories(token, storedDataKey);
      }
    } else {
      // If there's no cached data, fetch from the API
      fetchCategories(token, storedDataKey);
    }
  }, [currentBudget]);

  /**
   * Fetch categories from the API and store in state + session storage.
   */
  const fetchCategories = (token: string, storedDataKey: string) => {
    setLoading(true);

    axios
      .post(`/api/ynab/${currentBudget!.id}/fetch-categories`, { token })
      .then((response) => {
        const data = response.data;
        let fetchedGroups: YnabCategoryGroup[] = [];

        if (Array.isArray(data)) {
          // Directly an array of category groups
          fetchedGroups = data;
        } else if (data?.data?.category_groups) {
          fetchedGroups = data.data.category_groups;
        } else if (data?.category_groups) {
          fetchedGroups = data.category_groups;
        } else {
          setError("No category data found in response.");
          return;
        }

        setCategoryGroups(fetchedGroups);
        sessionStorage.setItem(storedDataKey, JSON.stringify(fetchedGroups));
      })
      .catch((err) => {
        console.error("Error fetching categories:", err);
        setError("Error fetching categories.");
      })
      .finally(() => setLoading(false));
  };

  /**
   * When a category is clicked, we:
   *   1. Set the selectedCategorySubId in context (for other components if needed).
   *   2. Optionally fetch that category's transactions (and chart data) from the server,
   *      if not already cached in sessionStorage.
   */
  const handleCategoryClick = async (catId: string, catName: string) => {
    setSelectedCategorySubId(catId);

    // Then fetch transactions if you want to do it here:
    const token = sessionStorage.getItem("ynab_access_token");
    if (!token) return;

    const storedDataKey = `categoryTransactions-${currentBudget!.id}-${catId}`;
    const cachedData = sessionStorage.getItem(storedDataKey);

    if (cachedData) {
      // If we have it cached, parse and set context states
      try {
        const parsedData = JSON.parse(cachedData);
        // e.g. { transactions, payeeChartData, monthlyChartData }
        setPayeeChartData(parsedData.payeeChartData);
        setMonthlyChartData(parsedData.monthlyChartData);
        // if you also store transactions in context or local state, do that here
        // setTransactions(parsedData.transactions) ...
      } catch (err) {
        console.error("Failed to parse cached category transactions:", err);
        // If parse fails, fetch from the server
        fetchCategoryTransactions(token, catId, storedDataKey);
      }
    } else {
      // If no cache, fetch from server
      fetchCategoryTransactions(token, catId, storedDataKey);
    }

    console.log("Selected category:", catName);
  };

  /**
   * This function fetches transaction data for a specific category,
   * plus any chart data (payeeChartData, monthlyChartData).
   * We store them in sessionStorage and update context states.
   */
  const fetchCategoryTransactions = (
    token: string,
    categoryId: string,
    storageKey: string
  ) => {
    axios
      .post(
        `/api/ynab/${currentBudget!.id}/categories/${categoryId}/transactions`,
        { token }
      )
      .then((response) => {
        // The backend returns { transactions, payeeChartData, monthlyChartData }
        const { transactions, payeeChartData, monthlyChartData } = response.data;

        // Convert transaction amounts from minor units to main units if needed
        const formattedTransactions = transactions.map((txn: any) => ({
          ...txn,
          amount: txn.amount / 1000.0,
        }));

        // Update context states
        setPayeeChartData(payeeChartData);
        setMonthlyChartData(monthlyChartData);
        // If you also store these transactions in context or local state, do so here

        // Cache all data in session storage
        sessionStorage.setItem(
          storageKey,
          JSON.stringify({
            transactions: formattedTransactions,
            payeeChartData,
            monthlyChartData,
          })
        );
      })
      .catch((error) => {
        console.error("Failed to fetch category transactions:", error);
      });
  };

  // Filter categories by search term
  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) {
      return categoryGroups;
    }

    const lowerSearch = searchTerm.toLowerCase();

    return categoryGroups
      .map((group) => {
        const filteredCats = group.categories.filter((cat) =>
          cat.name.toLowerCase().includes(lowerSearch)
        );
        return { ...group, categories: filteredCats };
      })
      .filter((group) => group.categories.length > 0);
  }, [categoryGroups, searchTerm]);

  return (
    <div className="p-4">
      {/* Search bar for instant filtering */}
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search Categories..."
        className="mb-4 w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {loading && <p>Loading categories...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && categoryGroups.length === 0 && (
        <p>No categories found.</p>
      )}

      <ScrollArea.Root className="relative h-[650px] w-full rounded overflow-hidden">
        <ScrollArea.Viewport className="w-full h-full p-2">
          {filteredGroups.map((group) => (
            <div key={group.id} className="mb-6">
              <h2 className="text-md font-semibold my-4">{group.name}</h2>
              <ul className="space-y-2">
                {group.categories.map((cat) => (
                  <li
                    key={cat.id}
                    className="p-2 border rounded-md hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleCategoryClick(cat.id, cat.name)}
                  >
                    {cat.name}
                  </li>
                ))}
              </ul>
            </div>
          ))}
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
