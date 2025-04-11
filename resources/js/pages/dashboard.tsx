
import AccountsDisplay from '@/components/widgets/AccountsDisplay';
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
                <div className="grid auto-rows-min gap-4 md:grid-cols-1">
                    <AccountsDisplay />
                </div>
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div className="">
                    {/* <TransactionsSheet /> */}
                    </div>
                    <div className="">

                    </div>
                    <div className="">

                    </div>
                </div>
                <div className="grid auto-rows-min gap-4 md:grid-cols-2">
                    <div className="">

                    </div>
                    <div className="">
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
