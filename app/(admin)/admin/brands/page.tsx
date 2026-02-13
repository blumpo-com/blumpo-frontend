'use client';

import { useState } from 'react';
import { AdminCard } from '@/components/admin/AdminCard';
import { AdminTable, AdminTableRow, AdminTableCell } from '@/components/admin/AdminTable';
import { Pagination } from '@/components/admin/Pagination';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function BrandsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, error, isLoading } = useSWR(
    `/api/admin/brands?page=${page}&limit=50${search ? `&search=${encodeURIComponent(search)}` : ''}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  if (error) {
    return <div className="p-8">Error loading brands</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Brands Management</h1>

      <AdminCard>
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by name or website..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <>
            <AdminTable
              headers={['Name', 'Website', 'Owner', 'Created', 'Updated']}
              emptyMessage={data?.brands?.length === 0 ? 'No brands found' : undefined}
            >
              {data?.brands?.map((brand: any) => (
                <AdminTableRow key={brand.id}>
                  <AdminTableCell>{brand.name}</AdminTableCell>
                  <AdminTableCell>
                    <a
                      href={brand.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {brand.websiteUrl}
                    </a>
                  </AdminTableCell>
                  <AdminTableCell>
                    {brand.userDisplayName || brand.userEmail}
                  </AdminTableCell>
                  <AdminTableCell>
                    {new Date(brand.createdAt).toLocaleDateString()}
                  </AdminTableCell>
                  <AdminTableCell>
                    {new Date(brand.updatedAt).toLocaleDateString()}
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
