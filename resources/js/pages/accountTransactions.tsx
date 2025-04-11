/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/rules-of-hooks */
import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import AccountsSidebar from '@/components/widgets/AccountsSidebar';

const AccountTransactions = () => {
  const { accountId }: any = usePage().props;
  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: "Account Transactions",
      href: '/account-transactions',
    },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={accountId} />
      {/* Use a flex container with full viewport height */}
      <div className="flex h-screen">
        {/* Sidebar section with fixed width of 240px and scrollable content */}
        <div className="w-60 overflow-y-auto">
          <AccountsSidebar />
        </div>

        {/* Main content area filling the rest of the space and with fixed viewport height */}
        <div className="flex-1">
          {/* Your main content goes here */}
        </div>
      </div>
    </AppLayout>
  );
};

export default AccountTransactions;
