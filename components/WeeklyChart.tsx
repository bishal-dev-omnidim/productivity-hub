'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts'
import { formatDuration } from '@/lib/utils'

interface Category {
  id: string
  name: string
  color: string
}

interface Props {
  chartData: Record<string, string | number>[]
  catTotals: { name: string; color: string; value: number }[]
  categories: Category[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-popover border rounded-lg p-3 shadow-md text-sm space-y-1">
      <p className="font-medium mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill }} />
            {p.name}
          </span>
          <span className="font-medium ml-4">{formatDuration(Math.round(p.value * 3600))}</span>
        </div>
      ))}
    </div>
  )
}

export function WeeklyChart({ chartData, catTotals, categories }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Stacked bar chart */}
      <div className="lg:col-span-2 bg-card border rounded-xl p-4">
        <h2 className="text-sm font-medium mb-4">Daily breakdown</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}h`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--accent))' }} />
            {categories.map((cat) => (
              <Bar
                key={cat.id}
                dataKey={cat.name}
                stackId="a"
                fill={cat.color}
                radius={[0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie chart */}
      <div className="bg-card border rounded-xl p-4">
        <h2 className="text-sm font-medium mb-4">Time allocation</h2>
        <ResponsiveContainer width="100%" height={140}>
          <PieChart>
            <Pie
              data={catTotals}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={60}
              dataKey="value"
              strokeWidth={0}
            >
              {catTotals.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => formatDuration(Number(v))}
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: '1px solid hsl(var(--border))',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-1.5 mt-2">
          {catTotals.map((cat) => (
            <div key={cat.name} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                {cat.name}
              </span>
              <span className="text-muted-foreground">{formatDuration(cat.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
