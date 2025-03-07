
import { AgeOfMoneyChart } from '@/components/charts/AgeOfMoneyChart';
import BalanceChart from '@/components/charts/BalanceChart';
import { AccountsWidget } from '@/components/widgets/AccountsWidget';
import { ScheduledTransactionWidget } from '@/components/widgets/ScheduledTransactionWidget';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

export default function Dashboard() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div className="">
                        <AgeOfMoneyChart />
                    </div>
                    <div className="">
                        <AccountsWidget />
                    </div>
                    <div className="">
                        <BalanceChart />
                    </div>
                </div>
                <div className="grid auto-rows-min gap-4 md:grid-cols-2">
                    <div className="">
                        <ScheduledTransactionWidget />
                    </div>
                    <div className="">
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
