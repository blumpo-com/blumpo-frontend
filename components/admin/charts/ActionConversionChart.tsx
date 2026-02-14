'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { AdminCard } from '../AdminCard';

interface ActionConversionChartProps {
  data: {
    totalEvents: number;
    eventTypeCounts: Array<{
      eventType: string;
      count: number;
      percentage: number;
    }>;
    engagementRate: number;
    saveDownloadRatio: number;
    restoreRate: number;
    positiveActions: number;
    deletedCount: number;
  };
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

export function ActionConversionChart({ data, isLoading }: ActionConversionChartProps) {
  if (isLoading) {
    return (
      <AdminCard title="Action Conversion & Engagement Rates">
        <div className="h-64 flex items-center justify-center text-gray-500">
          Loading...
        </div>
      </AdminCard>
    );
  }

  if (!data || data.totalEvents === 0) {
    return (
      <AdminCard title="Action Conversion & Engagement Rates">
        <div className="h-64 flex items-center justify-center text-gray-500">
          No data available
        </div>
      </AdminCard>
    );
  }

  const pieData = data.eventTypeCounts.map(item => ({
    name: EVENT_TYPE_LABELS[item.eventType] || item.eventType,
    value: item.count,
    percentage: item.percentage,
    color: EVENT_COLORS[item.eventType] || '#888888',
  }));

  return (
    <AdminCard title="Action Conversion & Engagement Rates">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Key Metrics */}
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Engagement Rate</div>
            <div className="text-3xl font-bold text-blue-600">
              {data.engagementRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {(data.positiveActions).toLocaleString()} positive actions / {data.totalEvents.toLocaleString()} total
            </div>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Save/Download Ratio</div>
            <div className="text-3xl font-bold text-green-600">
              {data.saveDownloadRatio.toFixed(2)}:1
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Saved+Downloaded vs Deleted
            </div>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Restore Rate</div>
            <div className="text-3xl font-bold text-purple-600">
              {data.restoreRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Restored / Deleted
            </div>
          </div>
        </div>

        {/* Pie Chart */}
        <div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) => {
                  const total = pieData.reduce((sum, item) => sum + item.value, 0);
                  const percentage = total > 0 ? (value / total) * 100 : 0;
                  return `${name}: ${percentage.toFixed(1)}%`;
                }}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number | undefined) => [
                  (value ?? 0).toLocaleString(),
                  'Events'
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Event Type Breakdown Table */}
      <div className="mt-6">
        <div className="text-sm font-semibold text-gray-700 mb-3">Event Type Breakdown:</div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Count
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Percentage
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bar
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.eventTypeCounts
                .sort((a, b) => b.count - a.count)
                .map((item) => (
                  <tr key={item.eventType}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {EVENT_TYPE_LABELS[item.eventType] || item.eventType}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {item.count.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {item.percentage.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${item.percentage}%`,
                            backgroundColor: EVENT_COLORS[item.eventType] || '#888888',
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminCard>
  );
}
