import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import * as ScrollArea from "@radix-ui/react-scroll-area";
import { formatPayeeForUrl } from "@/lib/utils";
import { useYNABContext } from "@/context/YNABContext";

interface Payee {
  id: string;
  name: string;
  deleted: boolean;
  // Extend this interface with a logo URL if provided by the API.
}

export function PayeesList() {
  const [payees, setPayees] = useState<Payee[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const { currentBudget } = useYNABContext()

  useEffect(() => {
    if (!currentBudget) return;

    const token = sessionStorage.getItem("ynab_access_token");
    if (!token) {
      setError("Access token not found.");
      return;
    }

    setLoading(true);
    axios
      .post(`/api/ynab/${currentBudget.id}/payees`, { token })
      .then((response) => {
        const data = response.data;
        if (data && data.payees) {
          setPayees(data.payees);
        } else {
          setError("No payees data received.");
        }
      })
      .catch((err) => {
        console.error("Error fetching payees:", err);
        setError("Error fetching payees.");
      })
      .finally(() => setLoading(false));
  }, [currentBudget]);

  // Compute grouped payees after filtering by the search term
  const groupedPayees = useMemo(() => {
    // First, filter payees based on the search term (case-insensitive)
    const filtered = payees.filter((payee) =>
      payee.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const groups: { [letter: string]: Payee[] } = {};
    filtered.forEach((payee) => {
      const firstLetter = payee.name?.charAt(0).toUpperCase() || "#";
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(payee);
    });
    // Sort each group alphabetically
    for (const letter in groups) {
      groups[letter].sort((a, b) => a.name.localeCompare(b.name));
    }
    // Return sorted groups (by key)
    return Object.keys(groups)
      .sort()
      .reduce((acc, letter) => {
        acc[letter] = groups[letter];
        return acc;
      }, {} as { [letter: string]: Payee[] });
  }, [payees, searchTerm]);

  return (
    <div className="p-4">
      {/* Search bar for instant filtering */}
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search Payees..."
        className="mb-4 w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {loading && <p>Loading payees...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && payees.length === 0 && <p>No payees found.</p>}
      <ScrollArea.Root className="relative h-[650px] w-full rounded overflow-hidden">
        <ScrollArea.Viewport className="w-full h-full p-2">
          {!loading &&
            !error &&
            Object.keys(groupedPayees).map((letter) => (
              <div key={letter}>
                <h2 className="text-xl font-semibold my-4">{letter}</h2>
                <ul className="space-y-2">
                  {groupedPayees[letter].map((payee) => (
                    <li
                      key={payee.id}
                      className="flex items-center space-x-4 p-2 border rounded-md"
                    >
                      <Avatar  className="size-8 rounded-lg">
                        <AvatarImage src={`https://ik.imagekit.io/apbypokeqx/tr:di-default.png/${formatPayeeForUrl(payee?.name)}.png`} alt={payee.name} />
                        <AvatarFallback>
                          {payee.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-md tracking-tight max-w-[180px] truncate">{payee.name}</span>
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
