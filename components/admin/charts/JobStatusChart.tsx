'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { AdminCard } from '../AdminCard';
import { JobStatus } from '@/lib/db/schema/enums';

interface JobStatusChartProps {
  data: Array<{ status: string; count: number }>;
  isLoading?: boolean;
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const STATUS_LABELS: Record<string, string> = {
  [JobStatus.QUEUED]: 'Queued',
  [JobStatus.RUNNING]: 'Running',
  [JobStatus.SUCCEEDED]: 'Succeeded',
  [JobStatus.FAILED]: 'Failed',
  [JobStatus.CANCELED]: 'Canceled',
};

export function JobStatusChart({ data, isLoading }: JobStatusChartProps) {
  if (isLoading) {
    return (
      <AdminCard title="Job Status Distribution">
        <div className="h-64 flex items-center justify-center text-gray-500">
          Loading...
        </div>
      </AdminCard>
    );
  }

  if (!data || data.length === 0) {
    return (
      <AdminCard title="Job Status Distribution">
        <div className="h-64 flex items-center justify-center text-gray-500">
          No data available
        </div>
      </AdminCard>
    );
  }

  const chartData = data.map((item) => ({
    ...item,
    name: STATUS_LABELS[item.status] || item.status,
  }));

  return (
    <AdminCard title="Job Status Distribution">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="count"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number | undefined) => (value ?? 0).toLocaleString()} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </AdminCard>
  );
}
