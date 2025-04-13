import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import HeadingSmall from '@/components/heading-small';
import BudgetMonths from '@/components/budget-months';
import DailyList from '@/components/widgets/DailyList';
import MonthlyTransactionsList from '@/components/widgets/MonthlyTransactionsList';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Daily Stats',
        href: '/daily-stats',
    },
];

const DailyStats = () => {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Daily Stats" />
            <div className="flex">
                <main className="flex-1 p-4">
                    <div className="flex flex-col md:flex-row items-center justify-between mb-4 space-y-4 md:space-y-0">
                        <HeadingSmall
                            title="Daily Analytics"
                            description="Explore detailed insights including category transactions, payee information, and more."
                        />
                        <BudgetMonths />
                    </div>

                    <div className="flex">
                        <main className="flex-1 p-4">
                            {/* Replace the grid with a simple flex container */}
                            <div className="flex gap-4">
                                {/* Left side at ~15% width */}
                                <div className="w-[25%] min-w-[250px]">
                                    <DailyList />
                                </div>
                                {/* Right side fills remaining space */}
                                <div className="flex-1">
                                    <MonthlyTransactionsList />
                                </div>
                            </div>
                        </main>
                    </div>
                </main>
            </div>
        </AppLayout>
    );
};

export default DailyStats;
