'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { AdminCard } from '../AdminCard';
import Link from 'next/link';

interface UserEngagementChartProps {
  data: Array<{
    userId: string;
    totalActions: number;
    email: string;
    displayName: string | null;
  }>;
  isLoading?: boolean;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function UserEngagementChart({ data, isLoading }: UserEngagementChartProps) {
  if (isLoading) {
    return (
      <AdminCard title="Top Users by Engagement">
        <div className="h-64 flex items-center justify-center text-gray-500">
          Loading...
        </div>
      </AdminCard>
    );
  }

  if (!data || data.length === 0) {
    return (
      <AdminCard title="Top Users by Engagement">
        <div className="h-64 flex items-center justify-center text-gray-500">
          No data available
        </div>
      </AdminCard>
    );
  }

  const chartData = data.map((item, index) => ({
    name: item.displayName || item.email.split('@')[0],
    email: item.email,
    actions: Number(item.totalActions),
    userId: item.userId,
    color: COLORS[index % COLORS.length],
  }));

  const totalActions = chartData.reduce((sum, item) => sum + item.actions, 0);

  return (
    <AdminCard title="Top Users by Engagement">
      <div className="mb-4">
        <div className="text-sm text-gray-500">Total Actions Tracked</div>
        <div className="text-2xl font-bold">{totalActions.toLocaleString()}</div>
      </div>
      
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis 
            type="category" 
            dataKey="name" 
            width={90}
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            formatter={(value: number | undefined) => (value ?? 0).toLocaleString()}
            labelStyle={{ fontWeight: 'bold' }}
            contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '4px' }}
          />
          <Legend />
          <Bar dataKey="actions" name="Actions" fill="hsl(var(--chart-1))">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 space-y-2">
        <div className="text-sm font-semibold text-gray-700 mb-2">Top Users:</div>
        {chartData.slice(0, 5).map((user, index) => (
          <div key={user.userId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
              <Link 
                href={`/admin/users/${user.userId}`}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
              >
                {user.name}
              </Link>
              <span className="text-xs text-gray-500">({user.email})</span>
            </div>
            <span className="text-sm font-semibold text-gray-700">{user.actions.toLocaleString()} actions</span>
          </div>
        ))}
      </div>
    </AdminCard>
  );
}
