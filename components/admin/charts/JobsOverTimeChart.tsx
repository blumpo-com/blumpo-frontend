'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AdminCard } from '../AdminCard';

interface JobsOverTimeChartProps {
  data: Array<{ date: string; count: number; succeeded: number; failed: number }>;
  isLoading?: boolean;
}

export function JobsOverTimeChart({ data, isLoading }: JobsOverTimeChartProps) {
  if (isLoading) {
    return (
      <AdminCard title="Jobs Over Time">
        <div className="h-64 flex items-center justify-center text-gray-500">
          Loading...
        </div>
      </AdminCard>
    );
  }

  if (!data || data.length === 0) {
    return (
      <AdminCard title="Jobs Over Time">
        <div className="h-64 flex items-center justify-center text-gray-500">
          No data available
        </div>
      </AdminCard>
    );
  }

  return (
    <AdminCard title="Jobs Over Time">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => {
              try {
                const date = new Date(value);
                if (isNaN(date.getTime())) return value;
                return `${date.getMonth() + 1}/${date.getDate()}`;
              } catch {
                return value;
              }
            }}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            labelFormatter={(value) => {
              try {
                const date = new Date(value);
                if (isNaN(date.getTime())) return value;
                return date.toLocaleDateString();
              } catch {
                return value;
              }
            }}
            formatter={(value: number) => [value.toLocaleString(), 'Jobs']}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="count"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            name="Total"
          />
          <Line
            type="monotone"
            dataKey="succeeded"
            stroke="hsl(var(--chart-2))"
            strokeWidth={2}
            name="Succeeded"
          />
          <Line
            type="monotone"
            dataKey="failed"
            stroke="hsl(var(--chart-3))"
            strokeWidth={2}
            name="Failed"
          />
        </LineChart>
      </ResponsiveContainer>
    </AdminCard>
  );
}
