import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { PayeesList } from '@/components/widgets/PayeesList';
import { PayeeTransactionsSheet } from '@/components/widgets/PayeeTransactionsSheet';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Payee Overview',
        href: '/payee-overview',
    },
];

const PayeeOverview = () => {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payee Overview" />
            <div className="flex">
                <main className="flex-1 p-4">
                    {/* Replace the grid with a simple flex container */}
                    <div className="flex gap-4">
                        {/* Left side at ~15% width */}
                        <div className="w-[25%] min-w-[250px]">
                            <PayeesList />
                        </div>
                        {/* Right side fills remaining space */}
                        <div className="flex-1">
                            <PayeeTransactionsSheet />
                        </div>
                    </div>
                </main>
            </div>
        </AppLayout>
    );
};

export default PayeeOverview;
