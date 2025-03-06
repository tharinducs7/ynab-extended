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
import { usePage } from "@inertiajs/react";
import { SharedData } from "@/types";
import { useYNABContext } from "@/context/YNABContext";

export function AppBudgets() {
    const { budgetsArrayWithAccounts } = usePage<SharedData>().props;
    const { currentBudget, setCurrentBudget } = useYNABContext();
console.log(currentBudget);

    const handleBudgetChange = (budgetId: string) => {
        const selectedBudget = budgetsArrayWithAccounts.find(b => b.id === budgetId);
        if (selectedBudget) {
            setCurrentBudget({
                id: selectedBudget.id,
                name: selectedBudget.name,
                currency: selectedBudget.currency_format.iso_code,
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
                            {budget.name} ({budget.currency_format.iso_code})
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    );
}
