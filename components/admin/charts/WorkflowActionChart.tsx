'use client';

import { useState } from 'react';
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

const TOP_N = 15; // Show top 15 workflows in chart

export function WorkflowActionChart({ data, isLoading }: WorkflowActionChartProps) {
  const [showAll, setShowAll] = useState(false);

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
    workflowId: string;
    saved: number;
    deleted: number;
    restored: number;
    downloaded: number;
    shared: number;
    auto_delete: number;
    total: number;
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
        workflowId: workflowKey,
        saved: 0,
        deleted: 0,
        restored: 0,
        downloaded: 0,
        shared: 0,
        auto_delete: 0,
        total: 0,
      });
    }

    const entry = workflowMap.get(workflowKey)!;
    if (eventType in entry) {
      entry[eventType] = count;
    } else {
      entry[eventType] = count;
    }
    entry.total = (entry.total as number) + count;
  });

  // Sort by total actions (descending) and take top N
  const allChartData = Array.from(workflowMap.values())
    .sort((a, b) => (b.total as number) - (a.total as number));
  
  const displayData = showAll ? allChartData : allChartData.slice(0, TOP_N);
  const remainingCount = allChartData.length - TOP_N;

  // Get all unique event types for legend
  const eventTypes = new Set<string>();
  data.forEach((item) => eventTypes.add(item.eventType));

  return (
    <AdminCard title="Ad Actions by Workflow">
      {allChartData.length > TOP_N && (
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {showAll ? 'all' : `top ${TOP_N}`} of {allChartData.length} workflows
          </div>
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
          >
            {showAll ? `Show Top ${TOP_N}` : `Show All (${remainingCount} more)`}
          </button>
        </div>
      )}

      <ResponsiveContainer width="100%" height={Math.max(500, displayData.length * 35)}>
        <BarChart 
          data={displayData}
          layout={displayData.length > 20 ? 'vertical' : 'horizontal'}
          margin={{ top: 5, right: 30, left: 20, bottom: displayData.length > 20 ? 100 : 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          {displayData.length > 20 ? (
            <>
              <XAxis type="number" />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={200}
                tick={{ fontSize: 12 }}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={Math.min(120, displayData.length * 8)}
                interval={0}
                tick={{ fontSize: 11 }}
              />
              <YAxis />
            </>
          )}
          <Tooltip 
            formatter={(value: number | undefined) => (value ?? 0).toLocaleString()}
            labelStyle={{ fontWeight: 'bold' }}
          />
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

      {allChartData.length > TOP_N && !showAll && (
        <div className="mt-4 text-sm text-gray-500 text-center">
          ... and {remainingCount} more workflows (use "Show All" to view)
        </div>
      )}
    </AdminCard>
  );
}
