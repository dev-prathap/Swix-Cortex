"use client"

import { use, useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Brain, Loader2, Send, Sparkles, Download, Info, ArrowRight, MessageSquare, BarChart3, FileText, Zap } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps } from 'recharts'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

// Enhanced Tooltip Component
function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload || !payload.length) return null

    return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3">
            <p className="font-semibold text-slate-900 dark:text-white mb-2">{label}</p>
            {payload.map((entry: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between gap-4 text-sm">
                    <span className="flex items-center gap-2">
                        <span 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-slate-600 dark:text-slate-400">{entry.name}:</span>
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                        {typeof entry.value === 'number' ? formatTooltipValue(entry.value) : entry.value}
                    </span>
                </div>
            ))}
        </div>
    )
}

function formatTooltipValue(value: number): string {
    if (value >= 1_000_000) {
        return `₹${(value / 1_000_000).toFixed(2)}M`
    }
    if (value >= 1_000) {
        return `₹${(value / 1_000).toFixed(2)}K`
    }
    return `₹${value.toFixed(2)}`
}

export default function QueryPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [query, setQuery] = useState('')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [explanation, setExplanation] = useState<any>(null)
    const [explaining, setExplaining] = useState(false)
    const chartRef = useRef<HTMLDivElement>(null)

    async function handleQuery() {
        if (!query.trim()) return

        setLoading(true)
        setExplanation(null) // Reset explanation when new query runs
        try {
            const res = await fetch('/api/analyst/query/nl', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ datasetId: id, query })
            })

            if (res.ok) {
                const data = await res.json()
                setResult(data.result)
            }
        } catch (error) {
            console.error('Query failed:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleExplainChart() {
        if (!result || !result.data) return

        setExplaining(true)
        try {
            const res = await fetch('/api/analyst/query/explain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chartType: result.visualization.type,
                    data: result.data,
                    interpretation: result.interpretation,
                    userQuery: query
                })
            })

            if (res.ok) {
                const data = await res.json()
                setExplanation(data.explanation)
            }
        } catch (error) {
            console.error('Explanation failed:', error)
        } finally {
            setExplaining(false)
        }
    }

    async function handleDownloadPNG() {
        if (!chartRef.current) return

        try {
            const canvas = await html2canvas(chartRef.current, {
                backgroundColor: '#ffffff',
                scale: 2 // Higher quality
            })
            
            const link = document.createElement('a')
            link.download = `chart-${Date.now()}.png`
            link.href = canvas.toDataURL('image/png')
            link.click()
        } catch (error) {
            console.error('PNG download failed:', error)
        }
    }

    async function handleDownloadPDF() {
        if (!chartRef.current) return

        try {
            const canvas = await html2canvas(chartRef.current, {
                backgroundColor: '#ffffff',
                scale: 2
            })
            
            const imgData = canvas.toDataURL('image/png')
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [canvas.width, canvas.height]
            })
            
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
            pdf.save(`chart-${Date.now()}.pdf`)
        } catch (error) {
            console.error('PDF download failed:', error)
        }
    }

    return (
        <div className="fixed inset-0 flex bg-white">
            {/* LEFT PANEL - Prompt & Controls */}
            <div className="w-[420px] border-r border-slate-200 flex flex-col bg-slate-50/50">
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-200 bg-white">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                            <MessageSquare className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-slate-900">AI Query</h1>
                            <p className="text-xs text-slate-500">Ask anything about your data</p>
                        </div>
                    </div>
                </div>

                {/* Prompt Input Section */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-6">
                        {/* Query Input */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <Brain className="h-4 w-4 text-purple-500" />
                                Your Question
                            </label>
                            <Textarea
                                placeholder="e.g., What are my top 10 customers by revenue?"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="min-h-[120px] resize-none bg-white border-slate-200 focus:border-purple-400 focus:ring-purple-400/20"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                        handleQuery()
                                    }
                                }}
                            />
                            <Button 
                                onClick={handleQuery} 
                                disabled={loading || !query.trim()}
                                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-sm"
                                size="lg"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-4 w-4 mr-2" />
                                        Generate Answer
                                        <ArrowRight className="h-4 w-4 ml-2" />
                                    </>
                                )}
                            </Button>
                            <p className="text-xs text-slate-500 text-center">
                                Press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs">⌘</kbd> + <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs">Enter</kbd> to submit
                            </p>
                        </div>

                        {/* Example Queries */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <Zap className="h-4 w-4 text-amber-500" />
                                Quick Examples
                            </label>
                            <div className="space-y-2">
                                {[
                                    { label: "Top items by revenue", query: "What are the top 5 items by revenue?", icon: BarChart3 },
                                    { label: "Revenue trends", query: "Show me revenue trends over time", icon: BarChart3 },
                                    { label: "Category comparison", query: "Compare performance by category", icon: BarChart3 },
                                    { label: "Multi-metric analysis", query: "Show Claim Amount, Collected, and Total Balance by facility", icon: Sparkles },
                                    { label: "Multi-series trends", query: "Show all metrics trends over time", icon: Sparkles }
                                ].map((item, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setQuery(item.query)}
                                        className="w-full text-left px-4 py-3 bg-white border border-slate-200 rounded-lg hover:border-purple-300 hover:bg-purple-50/50 transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className="h-4 w-4 text-slate-400 group-hover:text-purple-500" />
                                            <span className="text-sm text-slate-700 group-hover:text-slate-900">{item.label}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* AI Interpretation */}
                        {result && (
                            <div className="space-y-3 pt-4 border-t border-slate-200">
                                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                    <Brain className="h-4 w-4 text-purple-500" />
                                    AI Understanding
                                </label>
                                <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
                                    <div>
                                        <p className="text-xs font-medium text-slate-500 mb-1">Intent:</p>
                                        <p className="text-sm text-slate-700">{result.explanation}</p>
                                    </div>
                                    
                                    {result.visualization && (
                                        <div className="pt-3 border-t border-slate-100">
                                            <p className="text-xs font-medium text-slate-500 mb-2">Visualization:</p>
                                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                                {result.visualization.type} chart
                                            </Badge>
                                        </div>
                                    )}

                                    <details className="pt-3 border-t border-slate-100">
                                        <summary className="text-xs font-medium text-slate-500 cursor-pointer hover:text-slate-700">
                                            Technical Details
                                        </summary>
                                        <pre className="text-xs bg-slate-50 p-3 rounded mt-2 overflow-auto text-slate-600 max-h-[200px]">
                                            {JSON.stringify(result.interpretation, null, 2)}
                                        </pre>
                                    </details>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL - Results & Visualization */}
            <div className="flex-1 flex flex-col bg-white">
                {/* Top Bar */}
                <div className="h-[60px] border-b border-slate-200 px-6 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-sm font-medium text-slate-700">
                            {result ? 'Results Ready' : 'Waiting for query...'}
                        </span>
                    </div>
                    
                    {result && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleExplainChart}
                                disabled={explaining}
                                className="border-slate-200 hover:border-purple-300 hover:bg-purple-50/50"
                            >
                                {explaining ? (
                                    <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                                ) : (
                                    <Sparkles className="h-3.5 w-3.5 mr-2 text-purple-500" />
                                )}
                                Explain
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownloadPNG}
                                className="border-slate-200 hover:border-blue-300 hover:bg-blue-50/50"
                            >
                                <Download className="h-3.5 w-3.5 mr-2" />
                                PNG
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownloadPDF}
                                className="border-slate-200 hover:border-blue-300 hover:bg-blue-50/50"
                            >
                                <FileText className="h-3.5 w-3.5 mr-2" />
                                PDF
                            </Button>
                        </div>
                    )}
                </div>

                {/* Results Content */}
                <div className="flex-1 overflow-y-auto">
                    {!result ? (
                        // Empty State
                        <div className="h-full flex items-center justify-center p-8">
                            <div className="text-center max-w-md">
                                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center mx-auto mb-4">
                                    <BarChart3 className="h-8 w-8 text-purple-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">Ready to Analyze</h3>
                                <p className="text-sm text-slate-500">
                                    Ask a question on the left to see visualizations and insights here
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 space-y-6">
                            {/* Visualization Card */}
                            {result.data && result.visualization && (
                                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                        <h3 className="font-semibold text-slate-900">{result.visualization.title || 'Visualization'}</h3>
                                        <p className="text-sm text-slate-500 mt-1">{result.visualization.explanation}</p>
                                    </div>
                                    <div className="p-6" ref={chartRef}>
                                        <ResponsiveContainer width="100%" height={450}>
                                        {result.visualization.type === 'bar' && (() => {
                                            const sampleData = result.data[0] || {}
                                            const metrics = result.interpretation?.metrics || []
                                            const hasMultipleMetrics = metrics.length > 1 && metrics.every((m: string) => sampleData[m] !== undefined)
                                            const colors = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899']
                                            
                                            return (
                                                <BarChart data={result.data}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                    <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '12px' }} />
                                                    <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                                                    <Tooltip content={<CustomTooltip />} />
                                                    <Legend />
                                                    {hasMultipleMetrics ? (
                                                        metrics.map((metric: string, idx: number) => (
                                                            <Bar key={metric} dataKey={metric} fill={colors[idx % colors.length]} name={metric} radius={[4, 4, 0, 0]} />
                                                        ))
                                                    ) : (
                                                        <Bar dataKey="value" fill="#3b82f6" name="Value" radius={[4, 4, 0, 0]} />
                                                    )}
                                                </BarChart>
                                            )
                                        })()}
                                        {result.visualization.type === 'line' && (() => {
                                            const sampleData = result.data[0] || {}
                                            const metrics = result.interpretation?.metrics || []
                                            const hasMultipleMetrics = metrics.length > 1 && metrics.every((m: string) => sampleData[m] !== undefined)
                                            const colors = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899']
                                            
                                            return (
                                                <LineChart data={result.data}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                    <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '12px' }} />
                                                    <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                                                    <Tooltip content={<CustomTooltip />} />
                                                    <Legend />
                                                    {hasMultipleMetrics ? (
                                                        metrics.map((metric: string, idx: number) => (
                                                            <Line key={metric} type="monotone" dataKey={metric} stroke={colors[idx % colors.length]} strokeWidth={2} name={metric} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                                        ))
                                                    ) : (
                                                        <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} name="Value" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                                    )}
                                                </LineChart>
                                            )
                                        })()}
                                        {result.visualization.type === 'pie' && (
                                            <PieChart>
                                                <Pie data={result.data} cx="50%" cy="50%" labelLine={false} label={(entry) => entry.name} outerRadius={140} fill="#3b82f6" dataKey="value">
                                                    {result.data.map((_: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'][index % 5]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<CustomTooltip />} />
                                                <Legend />
                                            </PieChart>
                                        )}
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}

                            {/* AI Insights Card */}
                            {explanation && (
                                <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl shadow-sm overflow-hidden">
                                    <div className="px-6 py-4 border-b border-purple-100 bg-white/80">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="h-5 w-5 text-purple-600" />
                                            <h3 className="font-semibold text-slate-900">AI Insights</h3>
                                        </div>
                                        <p className="text-sm text-slate-600 mt-1">{explanation.summary}</p>
                                    </div>
                                    <div className="p-6 space-y-5">
                                        {/* Key Findings */}
                                        <div>
                                            <h4 className="font-semibold text-sm text-slate-900 mb-3 flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                                Key Findings
                                            </h4>
                                            <ul className="space-y-2">
                                                {explanation.keyInsights.map((insight: string, idx: number) => (
                                                    <li key={idx} className="text-sm text-slate-700 flex items-start gap-3 bg-white/60 rounded-lg p-3">
                                                        <span className="text-blue-500 font-bold mt-0.5">•</span>
                                                        <span>{insight}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Recommendations */}
                                        <div>
                                            <h4 className="font-semibold text-sm text-slate-900 mb-3 flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                                                Recommendations
                                            </h4>
                                            <ul className="space-y-2">
                                                {explanation.recommendations.map((rec: string, idx: number) => (
                                                    <li key={idx} className="text-sm text-slate-700 flex items-start gap-3 bg-white/60 rounded-lg p-3">
                                                        <span className="text-purple-500 font-bold mt-0.5">→</span>
                                                        <span>{rec}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Full Explanation */}
                                        <div className="pt-4 border-t border-purple-100">
                                            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                                                {explanation.fullExplanation}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

