'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AdminCard } from '../AdminCard';

interface ArchetypeActionChartProps {
  data: Array<{
    archetypeCode: string;
    displayName: string | null;
    eventType: string;
    count: number;
  }>;
  isLoading?: boolean;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  saved: 'Saved',
  deleted: 'Deleted',
  restored: 'Restored',
  downloaded: 'Downloaded',
  shared: 'Shared',
  auto_delete: 'Auto Deleted',
};

const EVENT_COLORS: Record<string, string> = {
  saved: 'hsl(var(--chart-1))',
  deleted: 'hsl(var(--chart-2))',
  restored: 'hsl(var(--chart-3))',
  downloaded: 'hsl(var(--chart-4))',
  shared: 'hsl(var(--chart-5))',
  auto_delete: '#888888',
};

export function ArchetypeActionChart({ data, isLoading }: ArchetypeActionChartProps) {
  if (isLoading) {
    return (
      <AdminCard title="Ad Actions by Archetype">
        <div className="h-64 flex items-center justify-center text-gray-500">
          Loading...
        </div>
      </AdminCard>
    );
  }

  if (!data || data.length === 0) {
    return (
      <AdminCard title="Ad Actions by Archetype">
        <div className="h-64 flex items-center justify-center text-gray-500">
          No data available
        </div>
      </AdminCard>
    );
  }

  // Transform data: group by archetype, then aggregate event types
  const archetypeMap = new Map<string, {
    name: string;
    saved: number;
    deleted: number;
    restored: number;
    downloaded: number;
    shared: number;
    auto_delete: number;
    [key: string]: string | number;
  }>();

  data.forEach((item) => {
    const archetypeKey = item.archetypeCode;
    const name = item.displayName || item.archetypeCode;
    const eventType = item.eventType;
    const count = Number(item.count);

    if (!archetypeMap.has(archetypeKey)) {
      archetypeMap.set(archetypeKey, {
        name,
        saved: 0,
        deleted: 0,
        restored: 0,
        downloaded: 0,
        shared: 0,
        auto_delete: 0,
      });
    }

    const entry = archetypeMap.get(archetypeKey)!;
    if (eventType in entry) {
      entry[eventType] = count;
    } else {
      entry[eventType] = count;
    }
  });

  const chartData = Array.from(archetypeMap.values());

  // Get all unique event types for legend
  const eventTypes = new Set<string>();
  data.forEach((item) => eventTypes.add(item.eventType));

  return (
    <AdminCard title="Ad Actions by Archetype">
      <ResponsiveContainer width="100%" height={400}>
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
          <Tooltip formatter={(value: number | undefined) => (value ?? 0).toLocaleString()} />
          <Legend />
          {Array.from(eventTypes).map((eventType) => (
            <Bar
              key={eventType}
              dataKey={eventType}
              fill={EVENT_COLORS[eventType] || '#888888'}
              name={EVENT_TYPE_LABELS[eventType] || eventType}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </AdminCard>
  );
}
