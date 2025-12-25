"use client"

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Brain,
    Sparkles,
    FileText,
    Clock,
    Database,
    Loader2,
    CheckCircle,
    AlertTriangle,
    TrendingUp,
    BarChart3
} from 'lucide-react'

interface Dataset {
    id: string
    name: string
    status: string
    uploadedAt: string
    profile?: any
    versions: any[]
    analyses: any[]
    cleaningPlans: any[]
}

export default function DatasetDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [dataset, setDataset] = useState<Dataset | null>(null)
    const [loading, setLoading] = useState(true)
    const [profiling, setProfiling] = useState(false)
    const [analyzing, setAnalyzing] = useState(false)
    const [generating, setGenerating] = useState(false)

    useEffect(() => {
        fetchDataset()
    }, [id])

    async function fetchDataset() {
        try {
            const res = await fetch(`/api/analyst/datasets/${id}`)
            if (res.ok) {
                const data = await res.json()
                setDataset(data.dataset)
            }
        } catch (error) {
            console.error('Failed to fetch dataset:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleProfile() {
        setProfiling(true)
        try {
            const res = await fetch(`/api/analyst/datasets/${id}/profile`, {
                method: 'POST'
            })
            if (res.ok) {
                await fetchDataset()
            }
        } catch (error) {
            console.error('Profiling failed:', error)
        } finally {
            setProfiling(false)
        }
    }

    async function handleAnalyze() {
        setAnalyzing(true)
        try {
            const res = await fetch(`/api/analyst/datasets/${id}/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ analysisType: 'SUMMARY' })
            })
            if (res.ok) {
                await fetchDataset()
            }
        } catch (error) {
            console.error('Analysis failed:', error)
        } finally {
            setAnalyzing(false)
        }
    }

    async function handleGenerateReport() {
        setGenerating(true)
        try {
            const res = await fetch('/api/analyst/reports/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ datasetId: id, format: 'pdf' })
            })
            if (res.ok) {
                // Download the PDF
                const blob = await res.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `report-${id}-${Date.now()}.pdf`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)

                // Redirect to reports page after download
                setTimeout(() => router.push('/analyst/reports'), 1000)
            }
        } catch (error) {
            console.error('Report generation failed:', error)
        } finally {
            setGenerating(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        )
    }

    if (!dataset) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-slate-500">Dataset not found</p>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{dataset.name}</h1>
                    <div className="flex items-center gap-3 mt-2">
                        <Badge>{dataset.status.replace('_', ' ')}</Badge>
                        <span className="text-sm text-slate-500">
                            Uploaded {new Date(dataset.uploadedAt).toLocaleDateString()}
                        </span>
                    </div>
                </div>
                <div className="flex gap-2">
                    {!dataset.profile && (
                        <Button onClick={handleProfile} disabled={profiling}>
                            {profiling ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Profiling...</>
                            ) : (
                                <><Brain className="h-4 w-4 mr-2" /> Profile Data</>
                            )}
                        </Button>
                    )}
                    {dataset.profile && dataset.analyses.length === 0 && (
                        <Button onClick={handleAnalyze} disabled={analyzing}>
                            {analyzing ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</>
                            ) : (
                                <><Sparkles className="h-4 w-4 mr-2" /> Analyze Data</>
                            )}
                        </Button>
                    )}
                    {dataset.profile && (
                        <Button 
                            onClick={handleGenerateReport} 
                            disabled={generating}
                            variant="default"
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            {generating ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
                            ) : (
                                <><FileText className="h-4 w-4 mr-2" /> Generate Report</>
                            )}
                        </Button>
                    )}
                </div>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="overview" className="w-full">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="profile">AI Profile</TabsTrigger>
                    <TabsTrigger value="cleaning">Cleaning</TabsTrigger>
                    <TabsTrigger value="analysis">Analysis</TabsTrigger>
                    <TabsTrigger value="query">Query</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-slate-600">Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{dataset.status}</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-slate-600">Versions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{dataset.versions.length}</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-slate-600">Analyses</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{dataset.analyses.length}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {dataset.profile && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Data Profile Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-slate-600">Domain</p>
                                        <p className="font-semibold">{dataset.profile.domain}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-600">Main Entity</p>
                                        <p className="font-semibold">{dataset.profile.mainEntity}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-600">Data Quality</p>
                                        <p className="font-semibold">
                                            {(dataset.profile.dataQualityScore * 100).toFixed(0)}%
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-600">Confidence</p>
                                        <p className="font-semibold">
                                            {(dataset.profile.confidence * 100).toFixed(0)}%
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-6">
                    {dataset.profile ? (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle>AI Understanding</CardTitle>
                                    <CardDescription>
                                        How our AI interpreted your dataset
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <h4 className="font-semibold mb-2">Business Domain</h4>
                                        <Badge variant="secondary">{dataset.profile.domain}</Badge>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold mb-2">Metrics (Numeric Measurements)</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {(dataset.profile.metrics as string[]).map((m: string) => (
                                                <Badge key={m} variant="outline">{m}</Badge>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold mb-2">Dimensions (Categories)</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {(dataset.profile.dimensions as string[]).map((d: string) => (
                                                <Badge key={d} variant="outline">{d}</Badge>
                                            ))}
                                        </div>
                                    </div>

                                    {dataset.profile.timeColumn && (
                                        <div>
                                            <h4 className="font-semibold mb-2">Time Column</h4>
                                            <Badge>{dataset.profile.timeColumn}</Badge>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {Object.keys(dataset.profile.issues).length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                                            Data Quality Issues
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <pre className="text-sm bg-slate-50 dark:bg-slate-800 p-4 rounded">
                                            {JSON.stringify(dataset.profile.issues, null, 2)}
                                        </pre>
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    ) : (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Brain className="h-16 w-16 text-slate-300 mb-4" />
                                <h3 className="text-lg font-semibold mb-2">Not yet profiled</h3>
                                <p className="text-slate-600 mb-4">
                                    Run AI profiling to understand your data
                                </p>
                                <Button onClick={handleProfile} disabled={profiling}>
                                    {profiling ? 'Profiling...' : 'Profile Data'}
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Cleaning Tab */}
                <TabsContent value="cleaning">
                    <Link href={`/analyst/datasets/${id}/cleaning`}>
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                            <CardContent className="flex items-center justify-center py-12">
                                <div className="text-center">
                                    <Sparkles className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">Data Cleaning</h3>
                                    <p className="text-slate-600">
                                        View and apply AI-suggested cleaning steps
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </TabsContent>

                {/* Analysis Tab */}
                <TabsContent value="analysis">
                    <Link href={`/analyst/datasets/${id}/analysis`}>
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                            <CardContent className="flex items-center justify-center py-12">
                                <div className="text-center">
                                    <BarChart3 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">AI Analysis</h3>
                                    <p className="text-slate-600">
                                        View automated insights and visualizations
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </TabsContent>

                {/* Query Tab */}
                <TabsContent value="query">
                    <Link href={`/analyst/datasets/${id}/query`}>
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                            <CardContent className="flex items-center justify-center py-12">
                                <div className="text-center">
                                    <Brain className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">Ask Questions</h3>
                                    <p className="text-slate-600">
                                        Query your data using natural language
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </TabsContent>
            </Tabs>
        </div>
    )
}

