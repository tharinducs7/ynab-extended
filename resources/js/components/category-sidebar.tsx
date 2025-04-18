/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react"
import axios from "axios"
import { Check, ChevronsUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useYNABContext } from "@/context/YNABContext"

export function CategoryCombobox() {
  const {
    currentBudget,
    selectedCategoryGroupId,
    setSelectedCategoryGroupId,
    selectedCategorySubId,
    setSelectedCategorySubId,
  } = useYNABContext()
  const [categoryGroups, setCategoryGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Control Popover open state for each combobox
  const [groupOpen, setGroupOpen] = useState(false)
  const [subOpen, setSubOpen] = useState(false)

  // On mount, check session storage for stored IDs and set defaults if not available.
  useEffect(() => {
    const storedGroupId = sessionStorage.getItem("selectedCategoryGroupId")
    const storedSubId = sessionStorage.getItem("selectedCategorySubId")

    if (storedGroupId) {
      setSelectedCategoryGroupId(storedGroupId)
    } else {
      setSelectedCategoryGroupId("c48a0ad1-3ce2-4ace-afd3-9640ec95a41c")
      sessionStorage.setItem("selectedCategoryGroupId", "c48a0ad1-3ce2-4ace-afd3-9640ec95a41c")
    }

    if (storedSubId) {
      setSelectedCategorySubId(storedSubId)
    } else {
      setSelectedCategorySubId("c84a5aae-80b8-4120-b483-30ba823c563c")
      sessionStorage.setItem("selectedCategorySubId", "c84a5aae-80b8-4120-b483-30ba823c563c")
    }
  }, [setSelectedCategoryGroupId, setSelectedCategorySubId])

  // Compute selected group and subcategory objects based on stored IDs.
  const selectedGroup = categoryGroups.find(
    (group) => group.id === selectedCategoryGroupId
  )
  const selectedSubCategory =
    selectedGroup && selectedCategorySubId
      ? selectedGroup.categories.find((cat: any) => cat.id === selectedCategorySubId)
      : { name: "all" }

  // Fetch category groups when currentBudget changes
  useEffect(() => {
    if (!currentBudget) return

    const storedDataKey = `categories-${currentBudget.id}`
    const cachedData = sessionStorage.getItem(storedDataKey)

    if (cachedData) {
      setCategoryGroups(JSON.parse(cachedData))
      setLoading(false)
    } else {
      fetchCategories(storedDataKey)
    }
  }, [currentBudget])

  const fetchCategories = (storageKey: string) => {
    const accessToken = sessionStorage.getItem("ynab_access_token")
    if (!accessToken || !currentBudget) return

    axios
      .post(`/api/ynab/${currentBudget.id}/fetch-categories`, { token: accessToken })
      .then((response) => {
        // Assuming the response structure is: { data: { category_groups: [...] } }
        const groups = response.data.data.category_groups
        setCategoryGroups(groups)
        sessionStorage.setItem(storageKey, JSON.stringify(groups))
      })
      .catch((error) => {
        console.error("Failed to fetch categories:", error)
      })
      .finally(() => setLoading(false))
  }

  if (loading) return <div>Loading Categories...</div>

  return (
    <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
      {/* Main Category Groups Combobox */}
      <Popover open={groupOpen} onOpenChange={setGroupOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={groupOpen}
            className="w-full md:w-[300px] justify-between"
          >
            {selectedGroup ? selectedGroup.name : "Select Category Group..."}
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full md:w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Search category groups..." className="h-9" />
            <CommandList>
              <CommandEmpty>No category groups found.</CommandEmpty>
              <CommandGroup>
                {categoryGroups.map((group) => (
                  <CommandItem
                    key={group.id}
                    onSelect={() => {
                      setSelectedCategoryGroupId(group.id)
                      sessionStorage.setItem("selectedCategoryGroupId", group.id)
                      // Reset subcategory selection when a new group is selected
                      setSelectedCategorySubId(null)
                      sessionStorage.removeItem("selectedCategorySubId")
                      setGroupOpen(false)
                    }}
                  >
                    {group.name}
                    {selectedGroup && selectedGroup.id === group.id && (
                      <Check className="ml-auto" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Subcategories Combobox – only shown when a group is selected */}
      {selectedGroup && (
        <Popover open={subOpen} onOpenChange={setSubOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={subOpen}
              className="w-full md:w-[300px] justify-between"
            >
              {selectedSubCategory.name}
              <ChevronsUpDown className="opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full md:w-[300px] p-0">
            <Command>
              <CommandInput placeholder="Search subcategories..." className="h-9" />
              <CommandList>
                <CommandEmpty>No subcategories found.</CommandEmpty>
                <CommandGroup>
                  {selectedGroup.categories &&
                    selectedGroup.categories.map((cat: any) => (
                      <CommandItem
                        key={cat.id}
                        onSelect={() => {
                          setSelectedCategorySubId(cat.id)
                          sessionStorage.setItem("selectedCategorySubId", cat.id)
                          setSubOpen(false)
                        }}
                      >
                        {cat.name}
                        {selectedCategorySubId === cat.id && (
                          <Check className="ml-auto" />
                        )}
                      </CommandItem>
                    ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}

export default CategoryCombobox
