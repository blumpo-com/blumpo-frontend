'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AdminCard } from '../AdminCard';

interface WorkflowActionChartProps {
  data: Array<{
    workflowId: string;
    workflowUid: string;
    variantKey: string;
    archetypeCode: string | null;
    archetypeDisplayName: string | null;
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

export function WorkflowActionChart({ data, isLoading }: WorkflowActionChartProps) {
  if (isLoading) {
    return (
      <AdminCard title="Ad Actions by Workflow">
        <div className="h-64 flex items-center justify-center text-gray-500">
          Loading...
        </div>
      </AdminCard>
    );
  }

  if (!data || data.length === 0) {
    return (
      <AdminCard title="Ad Actions by Workflow">
        <div className="h-64 flex items-center justify-center text-gray-500">
          No data available
        </div>
      </AdminCard>
    );
  }

  // Transform data: group by workflow, then aggregate event types
  const workflowMap = new Map<string, {
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
    const workflowKey = item.workflowId;
    const name = item.archetypeDisplayName
      ? `${item.archetypeDisplayName} (${item.variantKey})`
      : `${item.workflowUid} (${item.variantKey})`;
    const eventType = item.eventType;
    const count = Number(item.count);

    if (!workflowMap.has(workflowKey)) {
      workflowMap.set(workflowKey, {
        name,
        saved: 0,
        deleted: 0,
        restored: 0,
        downloaded: 0,
        shared: 0,
        auto_delete: 0,
      });
    }

    const entry = workflowMap.get(workflowKey)!;
    if (eventType in entry) {
      entry[eventType] = count;
    } else {
      entry[eventType] = count;
    }
  });

  const chartData = Array.from(workflowMap.values());

  // Get all unique event types for legend
  const eventTypes = new Set<string>();
  data.forEach((item) => eventTypes.add(item.eventType));

  return (
    <AdminCard title="Ad Actions by Workflow">
      <ResponsiveContainer width="100%" height={500}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={120}
            interval={0}
          />
          <YAxis />
          <Tooltip formatter={(value: number) => value.toLocaleString()} />
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
