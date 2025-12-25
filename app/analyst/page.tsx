"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Database, Upload, Clock, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'

interface Dataset {
    id: string
    name: string
    status: string
    uploadedAt: string
    profile?: {
        domain: string
        dataQualityScore: number
    }
    versions: any[]
    analyses: any[]
}

export default function AnalystDashboard() {
    const [datasets, setDatasets] = useState<Dataset[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDatasets()
    }, [])

    async function fetchDatasets() {
        try {
            const res = await fetch('/api/analyst/datasets')
            if (res.ok) {
                const data = await res.json()
                setDatasets(data.datasets)
            }
        } catch (error) {
            console.error('Failed to fetch datasets:', error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'READY':
            case 'ANALYZED':
                return <CheckCircle className="h-4 w-4 text-green-500" />
            case 'ERROR':
                return <AlertTriangle className="h-4 w-4 text-red-500" />
            case 'PROFILING':
            case 'CLEANING_SUGGESTED':
                return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
            default:
                return <Clock className="h-4 w-4 text-slate-400" />
        }
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white">My Datasets</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-2">
                        Upload any data - we'll understand, clean, and analyze it automatically
                    </p>
                </div>
                <Link href="/analyst/upload">
                    <Button size="lg" className="gap-2">
                        <Upload className="h-5 w-5" />
                        Upload New Data
                    </Button>
                </Link>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
            ) : datasets.length === 0 ? (
                <Card className="border-dashed border-2">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Database className="h-16 w-16 text-slate-300 mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                            No datasets yet
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-4 text-center max-w-md">
                            Upload your first CSV or connect a database to get started with AI-powered analysis
                        </p>
                        <Link href="/analyst/upload">
                            <Button>Upload Your First Dataset</Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {datasets.map((dataset) => (
                        <Link key={dataset.id} href={`/analyst/datasets/${dataset.id}`}>
                            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="text-lg">{dataset.name}</CardTitle>
                                            <CardDescription className="mt-1">
                                                {dataset.profile?.domain || 'Not yet analyzed'}
                                            </CardDescription>
                                        </div>
                                        {getStatusIcon(dataset.status)}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-600 dark:text-slate-400">Status</span>
                                            <Badge variant={dataset.status === 'ANALYZED' ? 'default' : 'secondary'}>
                                                {dataset.status.replace('_', ' ')}
                                            </Badge>
                                        </div>

                                        {dataset.profile && (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-600 dark:text-slate-400">Data Quality</span>
                                                <span className="font-semibold text-slate-900 dark:text-white">
                                                    {(dataset.profile.dataQualityScore * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-600 dark:text-slate-400">Analyses</span>
                                            <span className="font-semibold text-slate-900 dark:text-white">
                                                {dataset.analyses.length}
                                            </span>
                                        </div>

                                        <div className="pt-2 border-t text-xs text-slate-500">
                                            Uploaded {new Date(dataset.uploadedAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}

