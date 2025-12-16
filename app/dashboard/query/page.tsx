"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    Sparkles,
    Paperclip,
    Mic,
    TrendingUp,
    AlertTriangle,
    PieChart,
    Package,
    History,
    Settings,
    Terminal,
    Play,
    ChevronRight,
    Database,
    Loader2
} from "lucide-react"

interface DataSource {
    id: string
    name: string
    type: string
}

export default function QueryPage() {
    const [prompt, setPrompt] = useState("")
    const [dataSources, setDataSources] = useState<DataSource[]>([])
    const [selectedSource, setSelectedSource] = useState<string>("")
    const [isGenerating, setIsGenerating] = useState(false)
    const [isExecuting, setIsExecuting] = useState(false)
    const [generatedSQL, setGeneratedSQL] = useState<string>("")
    const [error, setError] = useState("")
    const [queryResults, setQueryResults] = useState<{ columns: string[], rows: any[] } | null>(null)

    useEffect(() => {
        async function fetchDataSources() {
            try {
                const response = await fetch("/api/data-sources")
                if (response.ok) {
                    const data = await response.json()
                    setDataSources(data)
                    if (data.length > 0) {
                        setSelectedSource(data[0].id)
                    }
                }
            } catch (error) {
                console.error("Failed to fetch data sources", error)
            }
        }
        fetchDataSources()
    }, [])

    async function handleGenerate() {
        if (!prompt || !selectedSource) return

        setIsGenerating(true)
        setError("")
        setGeneratedSQL("")
        setQueryResults(null)

        try {
            const response = await fetch("/api/query/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt,
                    dataSourceId: selectedSource
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to generate query")
            }

            setGeneratedSQL(data.sql)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong")
        } finally {
            setIsGenerating(false)
        }
    }

    async function handleExecute() {
        if (!generatedSQL || !selectedSource) return

        setIsExecuting(true)
        setError("")
        setQueryResults(null)

        try {
            const response = await fetch("/api/query/execute", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sql: generatedSQL,
                    dataSourceId: selectedSource
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to execute query")
            }

            setQueryResults({
                columns: data.columns,
                rows: data.rows
            })
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong")
        } finally {
            setIsExecuting(false)
        }
    }

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Query Lab</h1>
                    <p className="text-muted-foreground">Ask questions in plain English or write SQL directly.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={selectedSource} onValueChange={setSelectedSource}>
                        <SelectTrigger className="w-[200px]">
                            <Database className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Select Data Source" />
                        </SelectTrigger>
                        <SelectContent>
                            {dataSources.map(source => (
                                <SelectItem key={source.id} value={source.id}>{source.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" className="gap-2">
                        <History className="h-4 w-4" />
                        History
                    </Button>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                {/* Left Column: Input & Suggestions */}
                <div className="lg:col-span-7 flex flex-col gap-4 min-h-0">
                    <Card className="flex-1 flex flex-col p-0 overflow-hidden border-border shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/20">
                        <div className="border-b p-3 bg-muted/30 flex justify-between items-center">
                            <div className="flex gap-2">
                                <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer">Natural Language</Badge>
                                <Badge variant="outline" className="border-transparent text-muted-foreground hover:bg-muted cursor-pointer">SQL Editor</Badge>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                <Settings className="h-4 w-4" />
                            </Button>
                        </div>
                        <Textarea
                            className="flex-1 border-0 resize-none p-6 text-lg focus-visible:ring-0 font-medium bg-background placeholder:text-muted-foreground/50 leading-relaxed"
                            placeholder="e.g., Show me sales trends by region for the last quarter, or identify top performing products..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                        <div className="p-4 border-t bg-muted/10 flex justify-between items-center">
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                                    <Paperclip className="h-4 w-4" />
                                    <span className="hidden sm:inline">Attach Data</span>
                                </Button>
                                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                                    <Mic className="h-4 w-4" />
                                    <span className="hidden sm:inline">Voice Input</span>
                                </Button>
                            </div>
                            <Button
                                className="gap-2 px-6 shadow-lg shadow-primary/20"
                                onClick={handleGenerate}
                                disabled={isGenerating || !prompt || !selectedSource}
                            >
                                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                Generate Analysis
                            </Button>
                        </div>
                    </Card>

                    {error && (
                        <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900 rounded-lg">
                            {error}
                        </div>
                    )}

                    {queryResults ? (
                        <Card className="flex-1 overflow-hidden border-border shadow-sm">
                            <div className="p-3 border-b bg-muted/30 font-medium text-sm">Query Results</div>
                            <div className="overflow-auto max-h-[300px]">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {queryResults.columns.map((col) => (
                                                <TableHead key={col}>{col}</TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {queryResults.rows.map((row, i) => (
                                            <TableRow key={i}>
                                                {queryResults.columns.map((col) => (
                                                    <TableCell key={col}>{row[col]}</TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Suggested Queries</h3>
                            <div className="flex flex-wrap gap-3">
                                <Button variant="outline" className="h-auto py-2 px-4 rounded-full bg-background hover:bg-muted/50 border-dashed border-border hover:border-primary/50 transition-all text-sm font-normal text-muted-foreground hover:text-foreground justify-start" onClick={() => setPrompt("Compare revenue YoY for the top 5 products")}>
                                    <TrendingUp className="h-3.5 w-3.5 mr-2 text-blue-500" />
                                    Compare revenue YoY
                                </Button>
                                <Button variant="outline" className="h-auto py-2 px-4 rounded-full bg-background hover:bg-muted/50 border-dashed border-border hover:border-primary/50 transition-all text-sm font-normal text-muted-foreground hover:text-foreground justify-start" onClick={() => setPrompt("Identify customers with high churn risk based on last month activity")}>
                                    <AlertTriangle className="h-3.5 w-3.5 mr-2 text-amber-500" />
                                    Identify churn risk factors
                                </Button>
                                <Button variant="outline" className="h-auto py-2 px-4 rounded-full bg-background hover:bg-muted/50 border-dashed border-border hover:border-primary/50 transition-all text-sm font-normal text-muted-foreground hover:text-foreground justify-start" onClick={() => setPrompt("Calculate Marketing ROI by channel for Q3")}>
                                    <PieChart className="h-3.5 w-3.5 mr-2 text-emerald-500" />
                                    Marketing ROI by channel
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Analysis Plan / Preview */}
                <div className="lg:col-span-5 flex flex-col gap-4 min-h-0">
                    <Card className="flex-1 flex flex-col bg-[#0F172A] text-slate-300 border-slate-800 shadow-xl overflow-hidden">
                        <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                            <div className="flex items-center gap-2">
                                <Terminal className="h-4 w-4 text-blue-400" />
                                <span className="text-xs font-mono font-medium text-slate-400">Analysis Plan</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`flex h-2 w-2 rounded-full ${generatedSQL ? 'bg-emerald-500' : 'bg-slate-600'}`}></span>
                                <span className={`text-[10px] uppercase tracking-wider font-semibold ${generatedSQL ? 'text-emerald-500' : 'text-slate-600'}`}>
                                    {generatedSQL ? 'Ready' : 'Waiting'}
                                </span>
                            </div>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="p-5 font-mono text-sm space-y-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider font-semibold">
                                        <ChevronRight className="h-3 w-3 text-blue-500" />
                                        Generated SQL
                                    </div>
                                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 text-xs leading-relaxed overflow-x-auto min-h-[100px]">
                                        {generatedSQL ? (
                                            <pre className="whitespace-pre-wrap text-slate-300 font-mono">
                                                {generatedSQL}
                                            </pre>
                                        ) : (
                                            <span className="text-slate-600 italic">// SQL query will appear here after generation...</span>
                                        )}
                                    </div>
                                </div>

                                {generatedSQL && (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider font-semibold">
                                            <ChevronRight className="h-3 w-3 text-blue-500" />
                                            Execution Steps
                                        </div>
                                        <div className="space-y-3 pl-1">
                                            <div className="flex gap-3 relative">
                                                <div className="absolute left-[5px] top-2 bottom-[-12px] w-px bg-slate-800"></div>
                                                <div className="h-2.5 w-2.5 rounded-full bg-blue-500 mt-1.5 shrink-0 ring-4 ring-blue-500/20"></div>
                                                <div>
                                                    <p className="text-slate-200 font-medium">Query Generation</p>
                                                    <p className="text-xs text-slate-500 mt-0.5">AI converted natural language to SQL</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                <div className={`h-2.5 w-2.5 rounded-full mt-1.5 shrink-0 border ${queryResults ? 'bg-emerald-500 border-none ring-4 ring-emerald-500/20' : 'bg-slate-700 border-slate-600'}`}></div>
                                                <div>
                                                    <p className={queryResults ? "text-slate-200 font-medium" : "text-slate-400"}>Execution</p>
                                                    <p className="text-xs text-slate-600 mt-0.5">
                                                        {queryResults ? "Query executed successfully" : "Waiting to run query on database..."}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
                            <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                                disabled={!generatedSQL || isExecuting}
                                onClick={handleExecute}
                            >
                                {isExecuting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                                Run Query
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}
