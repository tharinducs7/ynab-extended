import { useYNABContext } from '@/context/YNABContext';
import { Separator } from "@/components/ui/separator"
import { formatBalance, formatPayeeForUrl } from '@/lib/utils';
import React from 'react';

// Extend the account interface to include a "type" property for grouping
// Also, add a "closed" property since we are filtering those as well.
export interface Account {
    id: string;
    name: string;
    note: string | null;
    deleted: boolean;
    closed: boolean;
    type: string; // Added for grouping
    balance: number;
    // … other properties can be added as needed
}

const typeLabels: Record<string, string> = {
    otherAsset: "Investments & Assets",
    creditCard: "Credit Cards",
    savings: "Savings Accounts",
    checking: "Current Accounts",
    cash: "Cash Accounts",
}

const NavigationSidebar: React.FC = () => {
    // Retrieve the current budget from your context
    const { currentBudget } = useYNABContext();

    // Filter out accounts that are either deleted or closed.
    const accounts: Account[] =
        currentBudget?.accounts.filter((account: Account) => !account.deleted && !account.closed) || [];

    // Group accounts by their "type"
    const groupedAccounts: Record<string, Account[]> = accounts.reduce((acc, account) => {
        if (!acc[account.type]) {
            acc[account.type] = [];
        }
        acc[account.type].push(account);
        return acc;
    }, {} as Record<string, Account[]>);

    // Define the desired group order.
    const groupOrder = ['cash', 'checking', 'creditCard', 'savings', 'otherAsset'];

    return (
        <div className="group flex flex-col gap-4 py-2 data-[collapsed=true]:py-2 w-[240px] md:w-[240px] lg:w-[240px] h-[calc(100vh-4rem)] overflow-y-auto border-r border-r-slate-200 bg-background shadow-sm transition-all duration-300 ease-in-out data-[collapsed=true]:w-0 data-[collapsed=true]:border-0 data-[collapsed=true]:bg-transparent data-[collapsed=true]:shadow-none">
            <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
                {groupOrder.map((type) => {
                    // Only render group header and items if the group has accounts.
                    const groupItems = groupedAccounts[type];
                    if (!groupItems || groupItems.length === 0) return null;
                    return (
                        <div key={type}>
                            {/* Group Header */}
                            <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                {typeLabels[type] || type}
                            </div>
                            {/* Group Items */}
                            {groupItems.map((account) => {
                                // Use the note to form the image name. Fallback to the account name.
                                const imageName = account.note
                                    ? formatPayeeForUrl(account.note)
                                    : formatPayeeForUrl(account.name);
                                // Construct the avatar URL
                                const avatarUrl = `https://ik.imagekit.io/apbypokeqx/tr:di-default.png/${imageName}.png`;

                                return (
                                    <a
                                        key={account.id}
                                        href={`/account-transactions/${account.id}`}
                                        className="my-2 w-full inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_img]:pointer-events-none [&_img]:size-4 [&_img]:shrink-0 hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 justify-start"
                                    >
                                        {/* <img src={avatarUrl} alt={account.note || account.name} className="mr-2 h-4 w-4" /> */}
                                        <div className="flex items-center">
                                            <img src={avatarUrl} alt={account.note || account.name} className="mr-2 h-4 w-4" />
                                            <div>
                                                <p className="text-xs font-medium leading-none">{account.name}</p>
                                                <p className="mt-1 text-xs text-muted-foreground">{formatBalance(account.balance / 1000)}</p>
                                            </div>
                                        </div>
                                    </a>
                                );
                            })}
                              <Separator className="my-1" />
                        </div>
                    );
                })}
            </nav>
        </div>
    );
};

export default NavigationSidebar;
