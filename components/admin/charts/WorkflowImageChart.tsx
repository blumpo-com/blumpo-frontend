'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AdminCard } from '../AdminCard';

interface WorkflowImageChartProps {
  data: Array<{
    workflowId: string;
    workflowUid: string;
    variantKey: string;
    archetypeCode: string | null;
    archetypeDisplayName: string | null;
    count: number;
  }>;
  isLoading?: boolean;
}

const TOP_N = 15; // Show top 15 workflows in chart

export function WorkflowImageChart({ data, isLoading }: WorkflowImageChartProps) {
  const [showAll, setShowAll] = useState(false);

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
    name: item.archetypeDisplayName
      ? `${item.archetypeDisplayName} (${item.variantKey})`
      : `${item.workflowUid} (${item.variantKey})`,
    count: Number(item.count),
    workflowId: item.workflowId,
  }));

  const totalImages = chartData.reduce((sum, item) => sum + item.count, 0);
  const topWorkflow = chartData[0];
  const displayData = showAll ? chartData : chartData.slice(0, TOP_N);
  const remainingCount = chartData.length - TOP_N;

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-500">Total Images</div>
          <div className="text-2xl font-bold">{totalImages.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Top Workflow</div>
          <div className="text-lg font-bold truncate" title={topWorkflow.name}>
            {topWorkflow.name}
          </div>
          <div className="text-sm text-gray-500">{topWorkflow.count.toLocaleString()} images</div>
        </div>
      </div>
      
      {chartData.length > TOP_N && (
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {showAll ? 'all' : `top ${TOP_N}`} of {chartData.length} workflows
          </div>
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
          >
            {showAll ? `Show Top ${TOP_N}` : `Show All (${remainingCount} more)`}
          </button>
        </div>
      )}

      <ResponsiveContainer width="100%" height={Math.max(400, displayData.length * 30)}>
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
          <Bar dataKey="count" fill="hsl(var(--chart-3))" name="Images" />
        </BarChart>
      </ResponsiveContainer>

      {chartData.length > TOP_N && !showAll && (
        <div className="mt-4 text-sm text-gray-500 text-center">
          ... and {remainingCount} more workflows (use "Show All" to view)
        </div>
      )}
    </>
  );
}
