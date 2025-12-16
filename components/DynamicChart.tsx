"use client"

import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area
} from 'recharts'

interface DynamicChartProps {
    data: any[]
    type: 'bar' | 'line' | 'pie' | 'area'
    xKey: string
    dataKeys: string[]
    colors?: string[]
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export function DynamicChart({ data, type, xKey, dataKeys, colors = COLORS }: DynamicChartProps) {
    if (!data || data.length === 0) return <div className="text-center p-4 text-slate-500">No data to display</div>

    const renderChart = () => {
        switch (type) {
            case 'bar':
                return (
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                        <XAxis dataKey={xKey} className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                            itemStyle={{ color: 'var(--foreground)' }}
                        />
                        <Legend />
                        {dataKeys.map((key, index) => (
                            <Bar key={key} dataKey={key} fill={colors[index % colors.length]} radius={[4, 4, 0, 0]} />
                        ))}
                    </BarChart>
                )
            case 'line':
                return (
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                        <XAxis dataKey={xKey} className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                            itemStyle={{ color: 'var(--foreground)' }}
                        />
                        <Legend />
                        {dataKeys.map((key, index) => (
                            <Line
                                key={key}
                                type="monotone"
                                dataKey={key}
                                stroke={colors[index % colors.length]}
                                strokeWidth={2}
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        ))}
                    </LineChart>
                )
            case 'area':
                return (
                    <AreaChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                        <XAxis dataKey={xKey} className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                            itemStyle={{ color: 'var(--foreground)' }}
                        />
                        <Legend />
                        {dataKeys.map((key, index) => (
                            <Area
                                key={key}
                                type="monotone"
                                dataKey={key}
                                stroke={colors[index % colors.length]}
                                fill={colors[index % colors.length]}
                                fillOpacity={0.3}
                            />
                        ))}
                    </AreaChart>
                )
            case 'pie':
                // For pie, we usually only visualize the first dataKey
                const pieKey = dataKeys[0]
                return (
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey={pieKey}
                            nameKey={xKey}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                            itemStyle={{ color: 'var(--foreground)' }}
                        />
                        <Legend />
                    </PieChart>
                )
            default:
                return null
        }
    }

    return (
        <ResponsiveContainer width="100%" height={400}>
            {renderChart() || <div>Invalid chart type</div>}
        </ResponsiveContainer>
    )
}
