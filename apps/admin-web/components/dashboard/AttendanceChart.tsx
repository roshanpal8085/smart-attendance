'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { AttendanceTrendItem } from '@/types/api';
import { Spinner } from '@/components/ui/Spinner';

interface AttendanceChartProps {
  data?: AttendanceTrendItem[];
  isLoading?: boolean;
}

export function AttendanceChart({ data = [], isLoading = false }: AttendanceChartProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Attendance Trends</CardTitle>
            <CardDescription>Daily present vs total enrolled students across campus (last 7 days)</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-72 items-center justify-center">
            <Spinner size="lg" className="text-indigo-600" />
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                barSize={20}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                  }}
                  formatter={(value: number, name: string) => [
                    value,
                    name === 'present' ? 'Students Present' : 'Total Enrolled',
                  ]}
                  labelFormatter={(label) => `Day: ${label}`}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                  formatter={(value) => (value === 'present' ? 'Present' : 'Total Enrolled')}
                />
                <Bar
                  dataKey="total"
                  fill="#e2e8f0"
                  radius={[4, 4, 0, 0]}
                  name="total"
                />
                <Bar
                  dataKey="present"
                  fill="#4f46e5"
                  radius={[4, 4, 0, 0]}
                  name="present"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
