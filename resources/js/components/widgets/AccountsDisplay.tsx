/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { useYnabStore } from '@/stores/useYnabStore';
import BankAccount from '../ui/bank-account';
import { formatBalance } from '@/lib/utils';
import { AgeOfMoneyChart } from '../charts/AgeOfMoneyChart';
import BalancePieChart from '../charts/BalanceChart';
import { ScheduledTransactionWidget } from './ScheduledTransactionWidget';

// Define TypeScript types for your data
interface Account {
    id: string;
    name: string;
    type: string;
    on_budget: boolean;
    closed: boolean;
    note: string | null;
    balance: number;
    cleared_balance: number;
    uncleared_balance: number;
    transfer_payee_id: string;
    direct_import_linked: boolean;
    direct_import_in_error: boolean;
    last_reconciled_at: string | null;
    debt_original_balance: number | null;
    debt_interest_rates: Record<string, number>;
    debt_minimum_payments: Record<string, number>;
    debt_escrow_amounts: any[];
    deleted: boolean;
}

interface Budget {
    id: string;
    name: string;
    last_modified_on: string;
    first_month: string;
    last_month: string;
    date_format: { format: string };
    currency_format: {
        iso_code: string;
        example_format: string;
        decimal_digits: number;
        decimal_separator: string;
        symbol_first: boolean;
        group_separator: string;
        currency_symbol: string;
        display_symbol: boolean;
    };
    accounts: Account[];
}

// Map account types to better display names
const typeLabels: Record<string, string> = {
    cash: 'Cash Accounts',
    checking: 'Current Accounts',
    creditCard: 'Credit Cards',
    savings: 'Savings Accounts',
    otherAsset: 'Investments & Assets',
};

// Define the desired order for account types
const typeSortOrder = ['cash', 'checking', 'creditCard', 'savings', 'otherAsset'];

const AccountsDisplay: React.FC = () => {
    // Assert that the data coming from the store conforms to our Budget[] interface.
    const budgetsArrayWithAccounts = useYnabStore(
        (state) => state.budgetsArrayWithAccounts
    ) as Budget[];

    // Define the desired sort order for budgets.
    const budgetOrder = [
        'ef90840e-87dd-4846-be3c-e47ab0965393', // 1st
        'c313c4d9-ae31-48b5-98b3-d75120d30f48', // 2nd
        '817f72da-29fa-482d-bfef-075e5c9e4acf', // 3rd
    ];

    // Create a sorted copy of the budgets array based on the budgetOrder.
    const sortedBudgets = [...budgetsArrayWithAccounts].sort((a, b) => {
        const indexA = budgetOrder.indexOf(a.id);
        const indexB = budgetOrder.indexOf(b.id);
        return indexA - indexB;
    });

    return (
        <div>
            {sortedBudgets.map((budget) => {
                // Filter out deleted or closed accounts
                const activeAccounts = (budget.accounts as Account[]).filter(
                    (account) => !account.deleted && !account.closed
                );

                // Compute the total balance for the whole budget.
                const budgetTotal = activeAccounts.reduce(
                    (total, account) => total + account.balance,
                    0
                );

                // Group the active accounts by their type.
                const accountsByType = activeAccounts.reduce<Record<string, Account[]>>(
                    (groups, account) => {
                        if (!groups[account.type]) {
                            groups[account.type] = [];
                        }
                        groups[account.type].push(account);
                        return groups;
                    },
                    {}
                );

                // Sort the account types using the custom order.
                const sortedTypes = Object.keys(accountsByType).sort((a, b) => {
                    const orderA = typeSortOrder.indexOf(a);
                    const orderB = typeSortOrder.indexOf(b);
                    return orderA - orderB;
                });

                return (
                    <div key={budget.id} className="mb-6">
                        {/* Main two-column layout */}
                        <div className="flex items-start justify-between gap-6 mb-6 border-b pb-4">
                            {/* Left Column: Budget's Accounts */}
                            <div className="w-2/3">
                                {sortedTypes.map((type) => {
                                    // Sort the accounts in descending order of balance.
                                    const accounts = accountsByType[type].sort((a, b) => b.balance - a.balance);
                                    // Compute total for this account type group.
                                    const groupTotal = accounts.reduce(
                                        (total, account) => total + account.balance,
                                        0
                                    );

                                    return (
                                        <div key={type} className="mb-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <h3 className="text-md font-medium">
                                                    {typeLabels[type] ||
                                                        type.charAt(0).toUpperCase() + type.slice(1)}
                                                </h3>
                                                <span className="text-sm text-muted-foreground">
                                                    {formatBalance(
                                                        groupTotal / 1000,
                                                        budget.currency_format.iso_code
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {accounts.map((account) => (
                                                    <div className="w-[250px]">
                                                        <BankAccount account={account} budget={budget} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                                {/* Balance Pie Chart within left column */}


                                <div className="grid auto-rows-min gap-4 md:grid-cols-2">
                                    <div className="">
                                        <BalancePieChart
                                            accounts={activeAccounts}
                                            currency={budget.currency_format.iso_code}
                                        />
                                    </div>
                                    <div className="">
                                        <AgeOfMoneyChart budgetId={budget.id} />
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Budget Summary / Stats */}
                            <div className="w-1/3 bg-white rounded-md p-4 shadow-sm border h-auto">
                                <h4 className="text-lg font-semibold mb-2">Budget Summary</h4>
                                <div className="text-sm text-muted-foreground mb-2">
                                    <p className="mb-1">
                                        <span className="font-medium text-gray-700">Total Balance:</span>{' '}
                                        {formatBalance(budgetTotal / 1000, budget.currency_format.iso_code)}
                                    </p>
                                    <p>
                                        <span className="font-medium text-gray-700"># of Accounts:</span>{' '}
                                        {activeAccounts.length}
                                    </p>
                                </div>
                                <ScheduledTransactionWidget budgetId={budget.id} />
                                <div className="text-sm text-gray-600 mt-4">
                                    <p>Last Modified: {new Date(budget.last_modified_on).toLocaleString()}</p>
                                    <p>First Month: {budget.first_month}</p>
                                    <p>Last Month: {budget.last_month}</p>
                                </div>
                            </div>
                        </div>
                        {/* Full width row below the budget's main columns */}
                    </div>
                );
            })}
        </div>
    );
};

export default AccountsDisplay;
