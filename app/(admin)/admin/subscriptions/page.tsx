'use client';

import { AdminCard } from '@/components/admin/AdminCard';
import { AdminTable, AdminTableRow, AdminTableCell } from '@/components/admin/AdminTable';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SubscriptionsPage() {
  const { data, error, isLoading } = useSWR('/api/admin/subscriptions', fetcher, {
    revalidateOnFocus: false,
  });

  if (error) {
    return <div className="p-8">Error loading subscriptions</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Subscription Management</h1>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="space-y-6">
          <AdminCard title="Subscription Plans">
            <AdminTable headers={['Code', 'Name', 'Monthly Tokens', 'Active', 'Default']}>
              {data?.subscriptionPlans?.map((plan: any) => (
                <AdminTableRow key={plan.planCode}>
                  <AdminTableCell>{plan.planCode}</AdminTableCell>
                  <AdminTableCell>{plan.displayName}</AdminTableCell>
                  <AdminTableCell>{plan.monthlyTokens?.toLocaleString() || 0}</AdminTableCell>
                  <AdminTableCell>
                    <span className={`px-2 py-1 rounded text-xs ${plan.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {plan.isActive ? 'Yes' : 'No'}
                    </span>
                  </AdminTableCell>
                  <AdminTableCell>
                    {plan.isDefault ? 'Yes' : 'No'}
                  </AdminTableCell>
                </AdminTableRow>
              ))}
            </AdminTable>
          </AdminCard>

          <AdminCard title="Topup Plans">
            <AdminTable headers={['SKU', 'Name', 'Tokens', 'Active']}>
              {data?.topupPlans?.map((topup: any) => (
                <AdminTableRow key={topup.topupSku}>
                  <AdminTableCell>{topup.topupSku}</AdminTableCell>
                  <AdminTableCell>{topup.displayName}</AdminTableCell>
                  <AdminTableCell>{topup.tokensAmount?.toLocaleString() || 0}</AdminTableCell>
                  <AdminTableCell>
                    <span className={`px-2 py-1 rounded text-xs ${topup.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {topup.isActive ? 'Yes' : 'No'}
                    </span>
                  </AdminTableCell>
                </AdminTableRow>
              ))}
            </AdminTable>
          </AdminCard>
        </div>
      )}
    </div>
  );
}
