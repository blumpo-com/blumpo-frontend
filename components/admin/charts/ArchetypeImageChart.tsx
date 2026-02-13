'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AdminCard } from '../AdminCard';

interface ArchetypeImageChartProps {
  data: Array<{ archetypeCode: string; displayName: string | null; count: number }>;
  isLoading?: boolean;
}

export function ArchetypeImageChart({ data, isLoading }: ArchetypeImageChartProps) {
  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No data available
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: item.displayName || item.archetypeCode,
    count: Number(item.count),
  }));

  const totalImages = chartData.reduce((sum, item) => sum + item.count, 0);
  const topArchetype = chartData[0];

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-500">Total Images</div>
          <div className="text-2xl font-bold">{totalImages.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Top Archetype</div>
          <div className="text-2xl font-bold">{topArchetype.name}</div>
          <div className="text-sm text-gray-500">{topArchetype.count.toLocaleString()} images</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={100}
            interval={0}
          />
          <YAxis />
          <Tooltip formatter={(value: number) => value.toLocaleString()} />
          <Legend />
          <Bar dataKey="count" fill="hsl(var(--chart-2))" name="Images" />
        </BarChart>
      </ResponsiveContainer>
    </>
  );
}
