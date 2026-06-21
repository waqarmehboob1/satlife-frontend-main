'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts';
import type { GaugeMetric } from '@/lib/types/dashboard';

interface GaugeChartCardProps {
  metric: GaugeMetric;
}

export function GaugeChartCard({ metric }: GaugeChartCardProps) {
  const pct = Math.min(100, Math.round((metric.value / metric.max_value) * 100));
  const chartData = [{ name: metric.label, value: pct, fill: 'oklch(0.62 0.15 250)' }];

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <ResponsiveContainer width="100%" height={180}>
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="70%"
            outerRadius="100%"
            barSize={12}
            data={chartData}
            startAngle={180}
            endAngle={0}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar background dataKey="value" cornerRadius={8} />
          </RadialBarChart>
        </ResponsiveContainer>
        <p className="text-2xl font-bold">
          {metric.value.toFixed(1)}
          <span className="ml-1 text-sm font-normal text-muted-foreground">{metric.unit}</span>
        </p>
      </CardContent>
    </Card>
  );
}
