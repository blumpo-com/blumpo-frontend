'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AdminCard } from '../AdminCard';

interface TokenUsageChartProps {
  data: Array<{ date: string; credits: number; debits: number; net: number }>;
  isLoading?: boolean;
}

export function TokenUsageChart({ data, isLoading }: TokenUsageChartProps) {
  if (isLoading) {
    return (
      <AdminCard title="Token Usage">
        <div className="h-64 flex items-center justify-center text-gray-500">
          Loading...
        </div>
      </AdminCard>
    );
  }

  if (!data || data.length === 0) {
    return (
      <AdminCard title="Token Usage">
        <div className="h-64 flex items-center justify-center text-gray-500">
          No data available
        </div>
      </AdminCard>
    );
  }

  return (
    <AdminCard title="Token Usage">
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
            formatter={(value: number, name: string) => [
              value.toLocaleString(),
              name === 'credits' ? 'Credits' : name === 'debits' ? 'Debits' : 'Net',
            ]}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="credits"
            stroke="hsl(var(--chart-2))"
            strokeWidth={2}
            name="Credits"
          />
          <Line
            type="monotone"
            dataKey="debits"
            stroke="hsl(var(--chart-3))"
            strokeWidth={2}
            name="Debits"
          />
          <Line
            type="monotone"
            dataKey="net"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Net"
          />
        </LineChart>
      </ResponsiveContainer>
    </AdminCard>
  );
}
