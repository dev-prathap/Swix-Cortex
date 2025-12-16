"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Sparkles, BarChart2, ArrowRight, Database, Table as TableIcon } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DynamicChart } from "@/components/DynamicChart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface DataSource {
    id: string
    name: string
    type: string
}

interface AnalysisResult {
    columns: string[]
    rows: any[]
    sql: string
    question: string
}

export default function AnalysisPage() {
    const [dataSources, setDataSources] = useState<DataSource[]>([])
    const [selectedSource, setSelectedSource] = useState<string>("")
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [isLoadingSources, setIsLoadingSources] = useState(true)
    const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [result, setResult] = useState<AnalysisResult | null>(null)
    const [chartConfig, setChartConfig] = useState<{ type: 'bar' | 'line' | 'pie' | 'area', xKey: string, dataKeys: string[] } | null>(null)

    useEffect(() => {
        fetchDataSources()
    }, [])

    async function fetchDataSources() {
        try {
            const response = await fetch("/api/data-sources")
            if (response.ok) {
                const data = await response.json()
                setDataSources(data)
            }
        } catch (error) {
            console.error("Failed to fetch data sources", error)
        } finally {
            setIsLoadingSources(false)
        }
    }

    async function handleSourceSelect(sourceId: string) {
        setSelectedSource(sourceId)
        setSuggestions([])
        setResult(null)
        setChartConfig(null)
        setIsGeneratingSuggestions(true)

        try {
            const response = await fetch("/api/analysis/suggest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ dataSourceId: sourceId })
            })

            if (response.ok) {
                const data = await response.json()
                setSuggestions(data.suggestions)
            }
        } catch (error) {
            console.error("Failed to fetch suggestions", error)
        } finally {
            setIsGeneratingSuggestions(false)
        }
    }

    function inferChartConfig(columns: string[], rows: any[]) {
        if (rows.length === 0) return null

        // 1. Identify Column Types
        const sample = rows[0]
        console.log('[Debug] Inferring Chart Config. Columns:', columns)
        console.log('[Debug] Sample Row:', sample)

        const numCols = columns.filter(col => {
            const val = sample[col]
            // Check if it's a real number OR a string that parses to a number (and isn't empty)
            return typeof val === 'number' || (typeof val === 'string' && !isNaN(Number(val)) && val.trim() !== '')
        })
        const strCols = columns.filter(col => {
            const val = sample[col]
            // It's a string column if it's a string AND NOT a number-string
            return typeof val === 'string' && isNaN(Number(val))
        })

        console.log('[Debug] Num Cols:', numCols)
        console.log('[Debug] Str Cols:', strCols)

        const dateCols = columns.filter(col => {
            const val = sample[col]
            return typeof val === 'string' && !isNaN(Date.parse(val)) && val.length > 4
        })

        // 2. Heuristics
        // Case A: Time Series (Date + Number) -> Line Chart
        if (dateCols.length > 0 && numCols.length > 0) {
            return { type: 'line' as const, xKey: dateCols[0], dataKeys: numCols }
        }

        // Case B: Categorical Comparison (String + Number) -> Bar Chart
        if (strCols.length > 0 && numCols.length > 0) {
            // If few categories, maybe Pie? But Bar is safer.
            return { type: 'bar' as const, xKey: strCols[0], dataKeys: numCols }
        }

        // Case C: Just Numbers -> Bar Chart (using Index as X?)
        if (numCols.length >= 2) {
            // Treat first number as X? No, usually bad.
            // Let's just use the first column as X if it's unique-ish
            return { type: 'bar' as const, xKey: columns[0], dataKeys: numCols.slice(1) }
        }

        return null
    }

    async function handleAnalyze(question: string) {
        setIsAnalyzing(true)
        setResult(null)
        setChartConfig(null)

        try {
            // 1. Generate SQL
            const genRes = await fetch("/api/query/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: question, dataSourceId: selectedSource })
            })

            if (!genRes.ok) throw new Error("Failed to generate SQL")
            const genData = await genRes.json()
            const sql = genData.sql

            // 2. Execute SQL
            const execRes = await fetch("/api/query/execute", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sql, dataSourceId: selectedSource })
            })

            if (!execRes.ok) throw new Error("Failed to execute SQL")
            const execData = await execRes.json()

            const config = inferChartConfig(execData.columns, execData.rows)
            setChartConfig(config)

            setResult({
                columns: execData.columns,
                rows: execData.rows,
                sql,
                question
            })

        } catch (error) {
            console.error("Analysis failed", error)
            alert("Failed to analyze data. Please try again.")
        } finally {
            setIsAnalyzing(false)
        }
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                    <span className="w-2 h-8 bg-primary rounded-full shadow-glow"></span>
                    AI Analysis
                </h1>
                <p className="text-slate-500 dark:text-slate-400 ml-5">
                    Select a data source and let Cortex AI discover insights for you.
                </p>
            </header>

            {/* 1. Source Selection */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-primary" />
                        Select Data Source
                    </CardTitle>
                    <CardDescription>Choose a database or CSV file to analyze</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoadingSources ? (
                        <div className="flex items-center gap-2 text-slate-500">
                            <Loader2 className="h-4 w-4 animate-spin" /> Loading sources...
                        </div>
                    ) : (
                        <Select value={selectedSource} onValueChange={handleSourceSelect}>
                            <SelectTrigger className="w-full md:w-[300px]">
                                <SelectValue placeholder="Select a source..." />
                            </SelectTrigger>
                            <SelectContent>
                                {dataSources.map(ds => (
                                    <SelectItem key={ds.id} value={ds.id}>{ds.name} ({ds.type})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </CardContent>
            </Card>

            {/* 2. AI Suggestions */}
            {selectedSource && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-yellow-500" />
                            Suggested Analysis
                        </h2>
                        {isGeneratingSuggestions && (
                            <span className="text-sm text-slate-500 flex items-center gap-2">
                                <Loader2 className="h-3 w-3 animate-spin" /> AI is reading schema...
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {suggestions.map((question, i) => (
                            <button
                                key={i}
                                onClick={() => handleAnalyze(question)}
                                disabled={isAnalyzing}
                                className="text-left p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary hover:shadow-md transition-all group"
                            >
                                <h3 className="font-medium text-slate-900 dark:text-white mb-2 group-hover:text-primary transition-colors">
                                    {question}
                                </h3>
                                <div className="flex items-center text-xs text-slate-500 group-hover:text-primary/70">
                                    Analyze <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* 3. Results */}
            {isAnalyzing && (
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="relative w-16 h-16 mb-4">
                        <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"></div>
                    </div>
                    <p className="text-slate-500 font-medium">Cortex AI is analyzing data...</p>
                </div>
            )}

            {result && (
                <Card className="animate-in fade-in slide-in-from-bottom-8 duration-700 border-primary/20 shadow-lg">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>{result.question}</CardTitle>
                                <CardDescription className="font-mono text-xs mt-1 text-slate-400 truncate max-w-2xl">
                                    {result.sql}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <Tabs defaultValue="chart" className="w-full">
                            <div className="flex justify-end mb-4">
                                <TabsList>
                                    <TabsTrigger value="chart" disabled={!chartConfig}>
                                        <BarChart2 className="h-4 w-4 mr-2" /> Chart
                                    </TabsTrigger>
                                    <TabsTrigger value="table">
                                        <TableIcon className="h-4 w-4 mr-2" /> Table
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="chart" className="mt-0">
                                {chartConfig ? (
                                    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-100 dark:border-slate-700">
                                        <DynamicChart
                                            data={result.rows}
                                            type={chartConfig.type}
                                            xKey={chartConfig.xKey}
                                            dataKeys={chartConfig.dataKeys}
                                        />
                                    </div>
                                ) : (
                                    <div className="text-center p-8 text-slate-500">
                                        Could not automatically visualize this data. Try the table view.
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="table" className="mt-0">
                                <div className="overflow-x-auto border rounded-lg">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                {result.columns.map((col, i) => (
                                                    <TableHead key={i} className="bg-slate-50 dark:bg-slate-900 text-xs uppercase tracking-wider font-semibold">
                                                        {col}
                                                    </TableHead>
                                                ))}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {result.rows.map((row, i) => (
                                                <TableRow key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                                    {result.columns.map((col, j) => (
                                                        <TableCell key={j} className="font-medium text-slate-700 dark:text-slate-300">
                                                            {row[col]}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
