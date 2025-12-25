"use client"

import { use, useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, TrendingUp, AlertTriangle, Info, Lightbulb } from 'lucide-react'

export default function AnalysisPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [analyses, setAnalyses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchAnalyses()
    }, [id])

    async function fetchAnalyses() {
        try {
            const res = await fetch(`/api/analyst/datasets/${id}/analyze`)
            if (res.ok) {
                const data = await res.json()
                setAnalyses(data.analyses)
            }
        } catch (error) {
            console.error('Failed to fetch analyses:', error)
        } finally {
            setLoading(false)
        }
    }

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'critical':
                return <AlertTriangle className="h-5 w-5 text-red-500" />
            case 'warning':
                return <AlertTriangle className="h-5 w-5 text-yellow-500" />
            case 'opportunity':
                return <Lightbulb className="h-5 w-5 text-green-500" />
            default:
                return <Info className="h-5 w-5 text-blue-500" />
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">AI Analysis</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                    Automated insights and recommendations
                </p>
            </div>

            {analyses.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <TrendingUp className="h-16 w-16 text-slate-300 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No analyses yet</h3>
                        <p className="text-slate-600">
                            Run analysis to generate insights
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {analyses.map((analysis) => (
                        <Card key={analysis.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle>{analysis.title}</CardTitle>
                                        <CardDescription className="mt-2">
                                            {analysis.summary}
                                        </CardDescription>
                                    </div>
                                    <Badge variant="secondary">
                                        {(analysis.confidence * 100).toFixed(0)}% confidence
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Insights */}
                                {(analysis.insights as any[]).map((insight: any, idx: number) => (
                                    <div
                                        key={idx}
                                        className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg"
                                    >
                                        {getSeverityIcon(insight.category)}
                                        <div className="flex-1">
                                            <p className="font-medium text-slate-900 dark:text-white">
                                                {insight.text}
                                            </p>
                                            {insight.supporting_data && (
                                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                                    {JSON.stringify(insight.supporting_data)}
                                                </p>
                                            )}
                                            <Badge variant="outline" className="mt-2">
                                                {insight.category}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}

                                {/* Visualizations */}
                                {(analysis.visualizations as any[]).length > 0 && (
                                    <div className="border-t pt-4">
                                        <h4 className="font-semibold mb-3">Visualizations</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {(analysis.visualizations as any[]).map((viz: any, idx: number) => (
                                                <div
                                                    key={idx}
                                                    className="p-4 border rounded-lg bg-white dark:bg-slate-900"
                                                >
                                                    <p className="font-medium mb-2">{viz.title}</p>
                                                    <Badge variant="secondary">{viz.type} chart</Badge>
                                                    <p className="text-xs text-slate-500 mt-2">
                                                        {viz.explanation}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="text-xs text-slate-500 pt-2 border-t">
                                    Generated {new Date(analysis.generatedAt).toLocaleString()}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

