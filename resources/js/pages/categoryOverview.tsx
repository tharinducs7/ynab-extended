import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { CategoryCombobox } from '@/components/category-sidebar';
import HeadingSmall from '@/components/heading-small';
import { CategoryTransactionWidget } from '@/components/widgets/CategoryTransactionWidget';
import { PayeeCategoryChart } from '@/components/charts/PayeeCategoryChart';
import { MonthlyCategorySpending } from '@/components/charts/MonthlyCategorySpending';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Category Overview',
        href: '/category-overview',
    },
];

const CategoryOverview = () => {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Category Overview" />
            <div className="flex">
                <main className="flex-1 p-4">
                    <div className="flex flex-col md:flex-row items-center justify-between mb-4 space-y-4 md:space-y-0">
                        <HeadingSmall
                            title="Comprehensive Category Overview"
                            description="Explore detailed insights including category transactions, payee information, and more."
                        />
                        <CategoryCombobox />
                    </div>
                    <div className="grid auto-rows-min gap-4 md:grid-cols-2">
                        <div className="">

                            <CategoryTransactionWidget />
                        </div>
                        <div className="">
                            <MonthlyCategorySpending />
                        </div>
                    </div>
                    <div className="grid auto-rows-min gap-4 md:grid-cols-2 mt-2">
                        <div className="">
                            <PayeeCategoryChart />
                        </div>
                        <div className="">

                        </div>
                        <div className="">

                        </div>
                    </div>
                </main>
            </div>
        </AppLayout>
    );
};

export default CategoryOverview;
