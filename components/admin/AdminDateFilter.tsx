'use client';

import { usePathname, useSearchParams } from 'next/navigation';

export function AdminDateFilter() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dateFrom = searchParams.get('dateFrom') ?? '';
  const dateTo = searchParams.get('dateTo') ?? '';

  const otherParams: { name: string; value: string }[] = [];
  searchParams.forEach((value, key) => {
    if (key !== 'dateFrom' && key !== 'dateTo') {
      otherParams.push({ name: key, value });
    }
  });

  return (
    <form method="get" action={pathname} className="flex items-center gap-2 flex-wrap">
      {otherParams.map((p) => (
        <input key={p.name} type="hidden" name={p.name} value={p.value} />
      ))}
      <label htmlFor="dateFrom" className="text-sm font-medium text-gray-700">
        From
      </label>
      <input
        id="dateFrom"
        type="date"
        name="dateFrom"
        defaultValue={dateFrom}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
      />
      <label htmlFor="dateTo" className="text-sm font-medium text-gray-700">
        To
      </label>
      <input
        id="dateTo"
        type="date"
        name="dateTo"
        defaultValue={dateTo}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
      />
      <button
        type="submit"
        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
      >
        Apply
      </button>
    </form>
  );
}
