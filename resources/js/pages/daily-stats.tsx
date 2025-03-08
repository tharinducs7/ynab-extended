import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import HeadingSmall from '@/components/heading-small';
import { DatePicker } from '@/components/ui/date-picker';
import { DailyStatContainer } from '@/containers/DailyStatContainer';

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
                            title="Comprehensive Category Overview"
                            description="Explore detailed insights including category transactions, payee information, and more."
                        />
                        <DatePicker />
                    </div>
                    <DailyStatContainer />
                </main>
            </div>
        </AppLayout>
    );
};

export default DailyStats;
