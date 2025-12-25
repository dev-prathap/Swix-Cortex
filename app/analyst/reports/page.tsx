"use client"

import { use, useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Download, Calendar, Database } from 'lucide-react'
import Link from 'next/link'

export default function ReportsPage() {
    const [reports, setReports] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchReports()
    }, [])

    async function fetchReports() {
        try {
            const res = await fetch('/api/analyst/reports')
            if (res.ok) {
                const data = await res.json()
                setReports(data.reports || [])
            }
        } catch (error) {
            console.error('Failed to fetch reports:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Reports</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                    AI-generated analysis reports from your datasets
                </p>
            </div>

            {loading ? (
                <Card>
                    <CardContent className="flex items-center justify-center py-12">
                        <p className="text-slate-600">Loading reports...</p>
                    </CardContent>
                </Card>
            ) : reports.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <FileText className="h-16 w-16 text-slate-300 mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                            No reports yet
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 text-center max-w-md mb-4">
                            Generate reports from your analyzed datasets to see comprehensive insights and recommendations
                        </p>
                        <Link href="/analyst">
                            <Button>Go to Datasets</Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reports.map((report) => (
                        <Card key={report.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <FileText className="h-8 w-8 text-blue-500" />
                                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                                        {report.type}
                                    </span>
                                </div>
                                <CardTitle className="mt-4">{report.title}</CardTitle>
                                <CardDescription>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Calendar className="h-3 w-3" />
                                        <span className="text-xs">
                                            {new Date(report.generatedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-4">
                                    <Database className="h-4 w-4" />
                                    <span>Dataset: {report.dataset?.name || 'Unknown'}</span>
                                </div>
                                <Button 
                                    className="w-full" 
                                    variant="outline"
                                    onClick={() => window.open(`/api/analyst/reports/${report.id}/download`, '_blank')}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download {report.format.toUpperCase()}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

