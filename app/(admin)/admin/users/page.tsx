'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminCard } from '@/components/admin/AdminCard';
import { AdminTable, AdminTableRow, AdminTableCell } from '@/components/admin/AdminTable';
import { Pagination } from '@/components/admin/Pagination';
import { UserRole } from '@/lib/db/schema/enums';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function UsersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [bannedFilter, setBannedFilter] = useState<string>('all');

  const { data, error, isLoading, mutate } = useSWR(
    `/api/admin/users?page=${page}&limit=50${search ? `&search=${encodeURIComponent(search)}` : ''}${roleFilter !== 'all' ? `&role=${roleFilter}` : ''}${bannedFilter !== 'all' ? `&banned=${bannedFilter === 'banned'}` : ''}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
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
    } catch (error) {
      console.error('Error updating role:', error);
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
                <AdminTableRow key={user.id}>
                  <AdminTableCell>{user.email}</AdminTableCell>
                  <AdminTableCell>{user.displayName || '-'}</AdminTableCell>
                  <AdminTableCell>
                    <select
                      value={user.role}
                      onChange={(e) => handleUpdateRole(user.id, e.target.value as UserRole)}
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
                  <AdminTableCell>
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
    </div>
  );
}
