'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminCard } from '@/components/admin/AdminCard';
import { AdminTable, AdminTableRow, AdminTableCell } from '@/components/admin/AdminTable';
import { Pagination } from '@/components/admin/Pagination';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdImagesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [userIdFilter, setUserIdFilter] = useState('');
  const [brandIdFilter, setBrandIdFilter] = useState('');
  const [jobIdFilter, setJobIdFilter] = useState('');

  const queryParams = new URLSearchParams();
  queryParams.set('page', page.toString());
  queryParams.set('limit', '50');
  if (userIdFilter) queryParams.set('userId', userIdFilter);
  if (brandIdFilter) queryParams.set('brandId', brandIdFilter);
  if (jobIdFilter) queryParams.set('jobId', jobIdFilter);

  const { data, error, isLoading } = useSWR(
    `/api/admin/ad-images?${queryParams.toString()}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  if (error) {
    return <div className="p-8">Error loading ad images</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Ad Images</h1>

      <AdminCard>
        <div className="mb-6 flex gap-4">
          <input
            type="text"
            placeholder="Filter by User ID..."
            value={userIdFilter}
            onChange={(e) => setUserIdFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />
          <input
            type="text"
            placeholder="Filter by Brand ID..."
            value={brandIdFilter}
            onChange={(e) => setBrandIdFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />
          <input
            type="text"
            placeholder="Filter by Job ID..."
            value={jobIdFilter}
            onChange={(e) => setJobIdFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <>
            <AdminTable
              headers={['Title', 'User', 'Brand', 'Job', 'Dimensions', 'Format', 'Status', 'Created']}
              emptyMessage={data?.adImages?.length === 0 ? 'No ad images found' : undefined}
            >
              {data?.adImages?.map((image: any) => (
                <AdminTableRow
                  key={image.id}
                  onClick={() => router.push(`/admin/ad-images/${image.id}`)}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  <AdminTableCell>
                    {image.title || <span className="text-gray-400 italic">Untitled</span>}
                  </AdminTableCell>
                  <AdminTableCell onClick={(e) => e.stopPropagation()}>
                    <a
                      href={`/admin/users/${image.userId}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/admin/users/${image.userId}`);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {image.userDisplayName || image.userEmail}
                    </a>
                  </AdminTableCell>
                  <AdminTableCell onClick={(e) => e.stopPropagation()}>
                    {image.brandId ? (
                      <a
                        href={`/admin/brands/${image.brandId}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin/brands/${image.brandId}`);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {image.brandName || '-'}
                      </a>
                    ) : (
                      '-'
                    )}
                  </AdminTableCell>
                  <AdminTableCell onClick={(e) => e.stopPropagation()}>
                    <a
                      href={`/admin/jobs/${image.jobId}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/admin/jobs/${image.jobId}`);
                      }}
                      className="text-blue-600 hover:text-blue-800 font-mono text-xs"
                    >
                      {image.jobId.slice(0, 8)}...
                    </a>
                  </AdminTableCell>
                  <AdminTableCell>
                    {image.width} × {image.height}px
                  </AdminTableCell>
                  <AdminTableCell>{image.format}</AdminTableCell>
                  <AdminTableCell>
                    <div className="flex gap-1 flex-wrap">
                      {image.banFlag && (
                        <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800">
                          Banned
                        </span>
                      )}
                      {image.errorFlag && (
                        <span className="px-2 py-1 rounded text-xs bg-orange-100 text-orange-800">
                          Error
                        </span>
                      )}
                      {image.isDeleted && (
                        <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
                          Deleted
                        </span>
                      )}
                      {!image.banFlag && !image.errorFlag && !image.isDeleted && (
                        <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                          Active
                        </span>
                      )}
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    {new Date(image.createdAt).toLocaleString()}
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
