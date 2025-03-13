import * as React from "react";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useYNABContext } from "@/context/YNABContext";
import { useYnabStore } from "@/stores/useYnabStore";

export function AppBudgets() {
    const budgetsArrayWithAccounts = useYnabStore(state => state.budgetsArrayWithAccounts);
    console.log(budgetsArrayWithAccounts, "budgetsArrayWithAccounts");

    const { currentBudget, setCurrentBudget } = useYNABContext();

    const handleBudgetChange = (budgetId: string) => {
        const selectedBudget = budgetsArrayWithAccounts?.find(b => b.id === budgetId);
        if (selectedBudget) {
            setCurrentBudget({
                id: selectedBudget.id,
                name: selectedBudget.name,
                currency: selectedBudget?.currency_format?.iso_code || "LKR",
                accounts: selectedBudget.accounts,
            });
        }
    };

    return (
        <Select
            value={currentBudget?.id}
            onValueChange={handleBudgetChange}
        >
            <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select a budget" />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>Budgets</SelectLabel>
                    {budgetsArrayWithAccounts.map(budget => (
                        <SelectItem key={budget.id} value={budget.id}>
                            {budget.name} ({budget?.currency_format?.iso_code})
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    );
}
