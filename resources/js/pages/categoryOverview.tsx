import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { CategoryCombobox } from '@/components/category-sidebar';
import HeadingSmall from '@/components/heading-small';

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
          {/* Additional content goes here */}
        </main>
      </div>
    </AppLayout>
  );
};

export default CategoryOverview;
