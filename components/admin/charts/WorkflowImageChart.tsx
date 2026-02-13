'use client';

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

export function WorkflowImageChart({ data, isLoading }: WorkflowImageChartProps) {
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
      <ResponsiveContainer width="100%" height={400}>
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
          <Tooltip formatter={(value: number | undefined) => (value ?? 0).toLocaleString()} />
          <Legend />
          <Bar dataKey="count" fill="hsl(var(--chart-3))" name="Images" />
        </BarChart>
      </ResponsiveContainer>
    </>
  );
}
