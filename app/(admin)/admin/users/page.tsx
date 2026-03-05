'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminCard } from '@/components/admin/AdminCard';
import { AdminTable, AdminTableRow, AdminTableCell } from '@/components/admin/AdminTable';
import { Pagination } from '@/components/admin/Pagination';
import { Dialog } from '@/components/ui/dialog';
import { UserRole } from '@/lib/db/schema/enums';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type PendingRoleChange = {
  userId: string;
  userEmail: string;
  displayName: string | null;
  currentRole: UserRole;
  newRole: UserRole;
};

export default function UsersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [bannedFilter, setBannedFilter] = useState<string>('all');
  const [paidFilter, setPaidFilter] = useState<string>('all');
  const [pendingRoleChange, setPendingRoleChange] = useState<PendingRoleChange | null>(null);

  const { data, error, isLoading, mutate } = useSWR(
    `/api/admin/users?page=${page}&limit=50${search ? `&search=${encodeURIComponent(search)}` : ''}${roleFilter !== 'all' ? `&role=${roleFilter}` : ''}${bannedFilter !== 'all' ? `&banned=${bannedFilter === 'banned'}` : ''}${paidFilter === 'paid' ? '&paid=true' : ''}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const handleRoleSelectChange = (user: { id: string; email: string; displayName?: string | null; role: UserRole }, newRole: UserRole) => {
    if (newRole === user.role) return;
    setPendingRoleChange({
      userId: user.id,
      userEmail: user.email,
      displayName: user.displayName ?? null,
      currentRole: user.role,
      newRole: newRole as UserRole,
    });
  };

  const handleConfirmRoleChange = async () => {
    if (!pendingRoleChange) return;
    const { userId, newRole } = pendingRoleChange;
    setPendingRoleChange(null);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (response.ok) {
        mutate();
      } else {
        alert('Failed to update user role');
      }
    } catch (err) {
      console.error('Error updating role:', err);
      alert('Error updating user role');
    }
  };

  const handleToggleBan = async (userId: string, currentlyBanned: boolean) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, banned: !currentlyBanned }),
      });

      if (response.ok) {
        mutate();
      } else {
        alert('Failed to update ban status');
      }
    } catch (error) {
      console.error('Error updating ban status:', error);
      alert('Error updating ban status');
    }
  };

  if (error) {
    return <div className="p-8">Error loading users</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Users Management</h1>

      <AdminCard>
        <div className="mb-6 flex gap-4">
          <input
            type="text"
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Roles</option>
            <option value={UserRole.USER}>User</option>
            <option value={UserRole.ADMIN}>Admin</option>
          </select>
          <select
            value={bannedFilter}
            onChange={(e) => setBannedFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="banned">Banned</option>
            <option value="active">Active</option>
          </select>
          <select
            value={paidFilter}
            onChange={(e) => setPaidFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All users</option>
            <option value="paid">Paid only</option>
          </select>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <>
            <AdminTable
              headers={['Email', 'Name', 'Role', 'Status', 'Brands', 'Jobs', 'Balance', 'Actions']}
              emptyMessage={data?.users?.length === 0 ? 'No users found' : undefined}
            >
              {data?.users?.map((user: any) => (
                <AdminTableRow
                  key={user.id}
                  onClick={() => router.push(`/admin/users/${user.id}`)}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  <AdminTableCell>{user.email}</AdminTableCell>
                  <AdminTableCell>{user.displayName || '-'}</AdminTableCell>
                  <AdminTableCell onClick={(e) => e.stopPropagation()}>
                    <select
                      value={pendingRoleChange && pendingRoleChange.userId === user.id ? pendingRoleChange.newRole : user.role}
                      onChange={(e) => handleRoleSelectChange(user, e.target.value as UserRole)}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value={UserRole.USER}>User</option>
                      <option value={UserRole.ADMIN}>Admin</option>
                    </select>
                  </AdminTableCell>
                  <AdminTableCell>
                    <span className={`px-2 py-1 rounded text-xs ${user.banFlag ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {user.banFlag ? 'Banned' : 'Active'}
                    </span>
                  </AdminTableCell>
                  <AdminTableCell>{user.brandsCount}</AdminTableCell>
                  <AdminTableCell>{user.jobsCount}</AdminTableCell>
                  <AdminTableCell>
                    {user.tokenAccount ? `${user.tokenAccount.balance.toLocaleString()} (${user.tokenAccount.planCode})` : '-'}
                  </AdminTableCell>
                  <AdminTableCell onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleToggleBan(user.id, user.banFlag)}
                      className={`px-3 py-1 rounded text-sm ${user.banFlag ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                    >
                      {user.banFlag ? 'Unban' : 'Ban'}
                    </button>
                    <button
                      onClick={() => router.push(`/admin/users/${user.id}`)}
                      className="ml-2 px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                    >
                      View
                    </button>
                  </AdminTableCell>
                </AdminTableRow>
              ))}
            </AdminTable>

            {data && data.totalPages > 1 && (
              <Pagination
                page={data.page}
                totalPages={data.totalPages}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </AdminCard>

      <Dialog
        open={!!pendingRoleChange}
        onClose={() => setPendingRoleChange(null)}
        contentClassName="bg-white rounded-xl shadow-xl p-6 w-[90%] max-w-md text-left"
      >
        {pendingRoleChange && (
          <>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Change user role</h3>
            <p className="text-sm text-gray-600 mb-4">
              Change role for <strong>{pendingRoleChange.displayName || pendingRoleChange.userEmail}</strong>
              {pendingRoleChange.displayName && (
                <span className="text-gray-500"> ({pendingRoleChange.userEmail})</span>
              )}{' '}
              from <strong>{pendingRoleChange.currentRole}</strong> to <strong>{pendingRoleChange.newRole}</strong>?
            </p>
            <p className="text-xs text-gray-500 mb-6">
              Admin users can access the admin panel. Only change roles for users you trust.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingRoleChange(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRoleChange}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Confirm
              </button>
            </div>
          </>
        )}
      </Dialog>
    </div>
  );
}
