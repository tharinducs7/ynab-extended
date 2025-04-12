import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { PayeesList } from '@/components/widgets/PayeesList';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Payee Overview',
        href: '/payee-overview',
    },
];

const PayeeOverview = () => {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Category Overview" />
            <div className="flex">
                <main className="flex-1 p-4">
                    {/* <div className="flex flex-col md:flex-row items-center justify-between mb-4 space-y-4 md:space-y-0">
                        <HeadingSmall
                            title="Comprehensive Payee Overview"
                            description="Explore detailed insights including category transactions, payee information, and more."
                        />
                        <CategoryCombobox />
                    </div> */}
                    <div className="grid auto-rows-min gap-4 md:grid-cols-2">
                        <div className="w-[400px]">
                            <PayeesList budgetId='ef90840e-87dd-4846-be3c-e47ab0965393' />
                        </div>
                        <div className="">
                            {/* <MonthlyCategorySpending /> */}
                        </div>
                    </div>
                </main>
            </div>
        </AppLayout>
    );
};

export default PayeeOverview;
