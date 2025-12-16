"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Brain, Sparkles, MoreVertical, PlusCircle, CheckCircle2, RefreshCw, TrendingUp, AlertTriangle, PieChart, Loader2, Database } from "lucide-react"

interface DashboardStats {
    dataSources: number
    queries: number
    reports: number
}

interface DataSource {
    id: string
    name: string
    type: string
    status: string
    lastSync: string
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [dataSources, setDataSources] = useState<DataSource[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            try {
                const [statsRes, sourcesRes] = await Promise.all([
                    fetch("/api/dashboard/stats"),
                    fetch("/api/data-sources")
                ])

                if (statsRes.ok) {
                    const statsData = await statsRes.json()
                    setStats(statsData)
                }

                if (sourcesRes.ok) {
                    const sourcesData = await sourcesRes.json()
                    setDataSources(sourcesData.slice(0, 3)) // Show top 3
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [])

    return (
        <div className="space-y-8">
            <div className="mb-10 max-w-5xl mx-auto">
                <div className="relative group max-w-3xl mx-auto">
                    <div className="relative flex items-center bg-white dark:bg-slate-900 rounded-full p-1.5 shadow-sm border border-slate-200 dark:border-slate-700 transition-all duration-300 focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500/50 hover:border-blue-400/50">
                        <div className="pl-4 pr-2 text-slate-400">
                            <Brain className="h-5 w-5" />
                        </div>
                        <Input
                            className="w-full bg-transparent border-none focus-visible:ring-0 text-base text-slate-700 dark:text-slate-200 placeholder:text-slate-400 shadow-none h-12"
                            placeholder="Ask anything about your data..."
                            type="text"
                        />
                        <Button className="bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white px-6 py-2.5 rounded-full font-medium transition-all flex items-center space-x-2 whitespace-nowrap h-10 mr-1">
                            <Sparkles className="h-4 w-4" />
                            <span>Ask AI</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto mb-8">
                <Card className="bg-surface-light dark:bg-surface-dark border-none shadow-sm">
                    <CardContent className="p-6 flex items-center space-x-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                            <Database className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Connected Sources</p>
                            <h3 className="text-2xl font-bold">{isLoading ? "-" : stats?.dataSources || 0}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-surface-light dark:bg-surface-dark border-none shadow-sm">
                    <CardContent className="p-6 flex items-center space-x-4">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-600 dark:text-purple-400">
                            <Sparkles className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">AI Queries Run</p>
                            <h3 className="text-2xl font-bold">{isLoading ? "-" : stats?.queries || 0}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-surface-light dark:bg-surface-dark border-none shadow-sm">
                    <CardContent className="p-6 flex items-center space-x-4">
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400">
                            <PieChart className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Reports Generated</p>
                            <h3 className="text-2xl font-bold">{isLoading ? "-" : stats?.reports || 0}</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                        Recent Reports
                        <Badge variant="secondary" className="ml-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/30">
                            Updated Live
                        </Badge>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Static Mock Reports for now, can be made dynamic later */}
                        <Card className="rounded-2xl shadow-card hover:shadow-xl transition-all duration-300 border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 group overflow-hidden">
                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                <CardTitle className="text-base font-semibold text-gray-800 dark:text-white">Q3 Sales Analysis</CardTitle>
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                            </CardHeader>
                            <CardContent>
                                <div className="h-32 w-full bg-gray-50 dark:bg-gray-800/50 rounded-lg mb-4 flex items-end justify-between p-2 space-x-1 relative overflow-hidden">
                                    <div className="w-1/6 bg-blue-200 dark:bg-blue-900/40 h-[40%] rounded-t-sm group-hover:bg-blue-400 transition-colors"></div>
                                    <div className="w-1/6 bg-blue-300 dark:bg-blue-800/60 h-[60%] rounded-t-sm group-hover:bg-blue-500 transition-colors"></div>
                                    <div className="w-1/6 bg-blue-400 dark:bg-blue-700/80 h-[30%] rounded-t-sm group-hover:bg-blue-600 transition-colors"></div>
                                    <div className="w-1/6 bg-blue-500 dark:bg-blue-600 h-[75%] rounded-t-sm group-hover:bg-blue-700 transition-colors"></div>
                                    <div className="w-1/6 bg-blue-600 dark:bg-blue-500 h-[50%] rounded-t-sm group-hover:bg-blue-800 transition-colors"></div>
                                    <div className="w-1/6 bg-primary h-[90%] rounded-t-sm shadow-[0_0_10px_rgba(37,99,235,0.4)]"></div>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 dark:text-gray-400 text-xs">Updated today</span>
                                    <Button variant="ghost" className="text-primary hover:text-blue-700 dark:hover:text-blue-300 font-medium px-3 py-1 h-auto hover:bg-blue-50 dark:hover:bg-blue-900/20">View Report</Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl shadow-card hover:shadow-xl transition-all duration-300 border-gray-100 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 group overflow-hidden">
                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                <CardTitle className="text-base font-semibold text-gray-800 dark:text-white">Customer Churn Prediction</CardTitle>
                                <TrendingUp className="h-4 w-4 text-purple-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="h-32 w-full bg-gray-50 dark:bg-gray-800/50 rounded-lg mb-4 relative overflow-hidden flex items-center justify-center">
                                    <svg className="w-full h-full px-2" preserveAspectRatio="none" viewBox="0 0 100 40">
                                        <path d="M0 30 Q 10 25, 20 28 T 40 20 T 60 15 T 80 22 T 100 10" fill="none" stroke="#8B5CF6" strokeWidth="2" vectorEffect="non-scaling-stroke"></path>
                                        <path d="M0 30 Q 10 25, 20 28 T 40 20 T 60 15 T 80 22 T 100 10 V 40 H 0 Z" fill="url(#gradient-purple)" opacity="0.2"></path>
                                        <defs>
                                            <linearGradient id="gradient-purple" x1="0%" x2="0%" y1="0%" y2="100%">
                                                <stop offset="0%" style={{ stopColor: "#8B5CF6", stopOpacity: 1 }}></stop>
                                                <stop offset="100%" style={{ stopColor: "#8B5CF6", stopOpacity: 0 }}></stop>
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 dark:text-gray-400 text-xs">Updated yesterday</span>
                                    <Button variant="ghost" className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium px-3 py-1 h-auto hover:bg-purple-50 dark:hover:bg-purple-900/20">View Prediction</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Connected Data Sources</h2>
                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : dataSources.length > 0 ? (
                            dataSources.map((source) => (
                                <div key={source.id} className="bg-surface-light dark:bg-surface-dark p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-start space-x-4 hover:shadow-md transition-shadow">
                                    <div className="flex-shrink-0 bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                                        <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{source.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Status: <span className="text-green-600 dark:text-green-400 font-medium">{source.status}</span></p>
                                        <p className="text-xs text-gray-400 mt-1">Type: {source.type}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-primary"><MoreVertical className="h-5 w-5" /></Button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center p-6 bg-surface-light dark:bg-surface-dark rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                                <p className="text-sm text-muted-foreground mb-2">No data sources connected</p>
                            </div>
                        )}

                        <Link href="/dashboard/data-sources">
                            <Button variant="outline" className="w-full py-6 rounded-xl border-dashed border-2 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-primary hover:text-primary dark:hover:border-blue-400 dark:hover:text-blue-400 transition-all flex items-center justify-center space-x-2 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-900/10 h-auto mt-4">
                                <PlusCircle className="h-5 w-5" />
                                <span className="font-medium text-sm">Add Data Source</span>
                            </Button>
                        </Link>
                    </div>

                    <div className="mt-8 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
                        <div className="relative z-10">
                            <div className="flex items-center space-x-2 mb-2">
                                <Sparkles className="h-4 w-4 text-yellow-300" />
                                <span className="text-xs font-semibold tracking-wider uppercase text-indigo-100">AI Insight</span>
                            </div>
                            <p className="text-sm font-medium leading-relaxed">
                                Connect your first data source to get AI-powered insights tailored to your business.
                            </p>
                            <Button size="sm" className="mt-3 text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors h-auto border-none">Learn More</Button>
                        </div>
                    </div>
                </div>
            </div>
            <style jsx>{`
        @keyframes loading {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(0%); }
            100% { transform: translateX(100%); }
        }
      `}</style>
        </div>
    )
}
