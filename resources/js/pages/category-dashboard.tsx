import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { CategoryList } from '@/components/widgets/CategoryList';
import { CategoryTransactionSheet } from '@/components/widgets/CategoryTransactionSheet';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Category Dashboard',
        href: '/category-dashboard',
    },
];

const CategoryDashboard = () => {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Category Dashboard" />
            <div className="flex">
                <main className="flex-1 p-4">
                    {/* Replace the grid with a simple flex container */}
                    <div className="flex gap-4">
                        {/* Left side at ~15% width */}
                        <div className="w-[25%] min-w-[250px]">
                            <CategoryList />
                        </div>
                        {/* Right side fills remaining space */}
                        <div className="flex-1">
                            <CategoryTransactionSheet />
                        </div>
                    </div>
                </main>
            </div>
        </AppLayout>
    );
};

export default CategoryDashboard;
