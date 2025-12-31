"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Sparkles,
    Send,
    Loader2,
    Database,
    Brain,
    BarChart3,
    LineChart as LineChartIcon,
    PieChart as PieChartIcon,
    Table as TableIcon,
    ChevronRight,
    MessageSquare,
    History,
    Plus,
    Trash2,
    ChevronDown,
    Package,
    Users
} from "lucide-react"
import { ConnectorModal } from "@/components/dashboard/ConnectorModal"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
    ScatterChart,
    Scatter,
    ZAxis
} from 'recharts';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

interface Message {
    role: "user" | "assistant";
    content: string;
    data?: any[];
    sql?: string;
    chartType?: string;
    suggestedQuestions?: string[];
}

interface Dataset {
    id: string;
    name: string;
}

interface HistoryItem {
    id: string;
    query: string;
    timestamp: number;
    datasetId: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function AnalysisPage() {
    const [query, setQuery] = useState("")
    const [messages, setMessages] = useState<Message[]>([])
    const [datasets, setDatasets] = useState<Dataset[]>([])
    const [selectedDataset, setSelectedDataset] = useState<string>("")
    const [isLoading, setIsLoading] = useState(false)
    const [history, setHistory] = useState<HistoryItem[]>([])
    const [showConnector, setShowConnector] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const { toast } = useToast()

    useEffect(() => {
        async function fetchDatasets() {
            try {
                const res = await fetch("/api/datasets")
                if (res.ok) {
                    const data = await res.json()
                    const validDatasets = data.filter((d: any) =>
                        (d.status === "READY" || d.status === "CLEANED" || d.status === "PROFILED") && d.rawFileLocation
                    )

                    // Filter out duplicates by name to keep UI clean
                    const uniqueDatasets = validDatasets.filter((v: any, i: number, a: any[]) =>
                        a.findIndex(t => t.name === v.name) === i
                    )

                    setDatasets(uniqueDatasets)
                    if (validDatasets.length > 0) {
                        setSelectedDataset(validDatasets[0].id)
                    } else {
                        setShowConnector(true)
                    }
                }
            } catch (error) {
                console.error("Failed to fetch datasets", error)
            }
        }
        fetchDatasets()

        // Load history
        const savedHistory = localStorage.getItem('queryHistory')
        if (savedHistory) {
            setHistory(JSON.parse(savedHistory))
        }
    }, [])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const saveToHistory = (text: string, dsId: string) => {
        const newItem: HistoryItem = {
            id: Date.now().toString(),
            query: text,
            timestamp: Date.now(),
            datasetId: dsId
        }
        const newHistory = [newItem, ...history].slice(0, 50) // Keep last 50
        setHistory(newHistory)
        localStorage.setItem('queryHistory', JSON.stringify(newHistory))
    }

    const clearHistory = () => {
        setHistory([])
        localStorage.removeItem('queryHistory')
    }

    const [currentStatus, setCurrentStatus] = useState<string>("")

    const handleSend = async (text?: string) => {
        const queryText = text || query
        if (!queryText || isLoading) return

        if (!selectedDataset) {
            toast({
                title: "No Dataset Selected",
                description: "Please select a dataset to perform analysis.",
                variant: "destructive"
            })
            return
        }

        const userMessage: Message = { role: "user", content: queryText }
        setMessages(prev => [...prev, userMessage])
        setQuery("")
        setIsLoading(true)
        setCurrentStatus("Initializing analysis...")

        saveToHistory(queryText, selectedDataset)

        try {
            const res = await fetch("/api/analyst/query", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    datasetId: selectedDataset,
                    query: queryText
                })
            })

            if (!res.ok) throw new Error("Analysis failed")

            const reader = res.body?.getReader()
            if (!reader) throw new Error("No reader available")

            const decoder = new TextEncoder().encode("").constructor === Uint8Array ? new TextDecoder() : null;
            if (!decoder) throw new Error("No decoder available")

            let assistantMessage: Message = {
                role: "assistant",
                content: "",
                data: [],
                suggestedQuestions: []
            }

            // Add an empty assistant message that we'll update
            setMessages(prev => [...prev, assistantMessage])

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value)
                const lines = chunk.split("\n")

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        try {
                            const update = JSON.parse(line.slice(6))

                            if (update.type === 'status') {
                                setCurrentStatus(update.message)
                            } else if (update.type === 'agent_start') {
                                setCurrentStatus(`${update.agent}: ${update.reasoning}`)
                            } else if (update.type === 'data') {
                                assistantMessage.data = update.data
                                assistantMessage.content = "Data retrieved. Synthesizing insights..."
                                setMessages(prev => {
                                    const newMessages = [...prev]
                                    newMessages[newMessages.length - 1] = { ...assistantMessage }
                                    return newMessages
                                })
                            } else if (update.type === 'visualization') {
                                assistantMessage.chartType = update.visualization.type
                                setMessages(prev => {
                                    const newMessages = [...prev]
                                    newMessages[newMessages.length - 1] = { ...assistantMessage }
                                    return newMessages
                                })
                            } else if (update.type === 'insight') {
                                assistantMessage.content = update.content
                                setMessages(prev => {
                                    const newMessages = [...prev]
                                    newMessages[newMessages.length - 1] = { ...assistantMessage }
                                    return newMessages
                                })
                            } else if (update.type === 'complete') {
                                const final = update.final
                                assistantMessage = {
                                    role: "assistant",
                                    content: final.explanation || assistantMessage.content,
                                    data: final.data || assistantMessage.data,
                                    chartType: final.visualization?.type || assistantMessage.chartType,
                                    suggestedQuestions: [
                                        "Show me trends over time",
                                        "What are the anomalies?",
                                        "Give me a forecast"
                                    ]
                                }
                                setMessages(prev => {
                                    const newMessages = [...prev]
                                    newMessages[newMessages.length - 1] = { ...assistantMessage }
                                    return newMessages
                                })
                            }
                        } catch (e) {
                            console.error("Error parsing stream chunk", e)
                        }
                    }
                }
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to get analysis. Please try again.",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
            setCurrentStatus("")
        }
    }


    const renderChart = (msg: Message) => {
        if (!msg.data || msg.data.length === 0) return null;

        const keys = Object.keys(msg.data[0]);
        if (keys.length < 2) return null;

        // Smart key detection
        const labelKey = keys.find(k => k.toLowerCase().includes('date') || k.toLowerCase().includes('time') || k.toLowerCase().includes('name') || k.toLowerCase().includes('category')) || keys[0];
        const valueKey = keys.find(k => (typeof msg.data![0][k] === 'number' || typeof msg.data![0][k] === 'bigint') && k !== labelKey) || keys[1];

        // Ensure data is formatted correctly for Recharts
        const chartData = msg.data.map(item => ({
            ...item,
            [valueKey]: Number(item[valueKey]) // Ensure number
        }));

        if (msg.chartType === 'bar') {
            return (
                <div className="h-72 w-full mt-4 p-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" opacity={0.4} />
                            <XAxis
                                dataKey={labelKey}
                                tick={{ fontSize: 10, fill: 'hsl(var(--foreground))' }}
                                interval={0}
                                angle={-45}
                                textAnchor="end"
                                height={60}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 10, fill: 'hsl(var(--foreground))' }}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => typeof value === 'number' ? value.toLocaleString() : value}
                            />
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--popover))',
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: 'var(--radius)',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                    fontSize: '12px',
                                    color: 'hsl(var(--popover-foreground))'
                                }}
                            />
                            <Bar
                                dataKey={valueKey}
                                radius={[4, 4, 0, 0]}
                                maxBarSize={50}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            );
        }

        if (msg.chartType === 'line') {
            return (
                <div className="h-72 w-full mt-4 p-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" opacity={0.4} />
                            <XAxis
                                dataKey={labelKey}
                                tick={{ fontSize: 10, fill: 'hsl(var(--foreground))' }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 10, fill: 'hsl(var(--foreground))' }}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => typeof value === 'number' ? value.toLocaleString() : value}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--popover))',
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: 'var(--radius)',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                    fontSize: '12px',
                                    color: 'hsl(var(--popover-foreground))'
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey={valueKey}
                                stroke={COLORS[0]}
                                strokeWidth={3}
                                dot={{ r: 4, fill: COLORS[0], strokeWidth: 0 }}
                                activeDot={{ r: 6, fill: COLORS[0], stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            );
        }

        if (msg.chartType === 'pie') {
            return (
                <div className="h-72 w-full mt-4 p-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={2}
                                dataKey={valueKey}
                                nameKey={labelKey}
                                stroke="hsl(var(--background))"
                                strokeWidth={2}
                                label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} ${(percent ? (percent * 100).toFixed(0) : 0)}%`}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--popover))',
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: 'var(--radius)',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                    fontSize: '12px',
                                    color: 'hsl(var(--popover-foreground))'
                                }}
                            />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="circle"
                                wrapperStyle={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            );
        }

        if (msg.chartType === 'area') {
            return (
                <div className="h-72 w-full mt-4 p-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" opacity={0.4} />
                            <XAxis
                                dataKey={labelKey}
                                tick={{ fontSize: 10, fill: 'hsl(var(--foreground))' }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 10, fill: 'hsl(var(--foreground))' }}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => typeof value === 'number' ? value.toLocaleString() : value}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--popover))',
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: 'var(--radius)',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                    fontSize: '12px',
                                    color: 'hsl(var(--popover-foreground))'
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey={valueKey}
                                stroke={COLORS[0]}
                                fillOpacity={1}
                                fill="url(#colorValue)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            );
        }

        if (msg.chartType === 'scatter') {
            return (
                <div className="h-72 w-full mt-4 p-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" opacity={0.4} />
                            <XAxis
                                type="number"
                                dataKey={labelKey}
                                name={labelKey}
                                tick={{ fontSize: 10, fill: 'hsl(var(--foreground))' }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                type="number"
                                dataKey={valueKey}
                                name={valueKey}
                                tick={{ fontSize: 10, fill: 'hsl(var(--foreground))' }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <ZAxis range={[60, 400]} />
                            <Tooltip
                                cursor={{ strokeDasharray: '3 3' }}
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--popover))',
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: 'var(--radius)',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                    fontSize: '12px',
                                    color: 'hsl(var(--popover-foreground))'
                                }}
                            />
                            <Scatter name="Data" data={chartData} fill={COLORS[0]} />
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="h-screen bg-background text-foreground p-4 flex flex-col gap-4 overflow-hidden">
            {/* Top Header (Consistent with Dashboard) */}
            <div className="flex items-center justify-between bg-card/50 backdrop-blur-xl rounded-2xl p-3 px-6 border border-border shadow-sm shrink-0">
                <div className="flex items-center gap-4">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Brain className="h-4 w-4 text-primary" />
                    </div>
                    <h1 className="text-sm font-bold tracking-tight">AI Analyst Command</h1>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">System Online</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-1 gap-4 min-h-0 relative">
                <ConnectorModal open={showConnector} onOpenChange={setShowConnector} />
                {/* Left Sidebar: History & Datasets */}
                <div className="w-72 flex flex-col gap-4 shrink-0">
                    <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50 rounded-[1.5rem] shadow-sm space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-1">
                                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Active Dataset</Label>
                                <Database className="h-3 w-3 text-primary/50" />
                            </div>
                            <div className="relative group">
                                <select
                                    className="w-full bg-background/50 border border-border h-11 px-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer hover:border-primary/30 transition-all font-medium"
                                    value={selectedDataset}
                                    onChange={(e) => setSelectedDataset(e.target.value)}
                                >
                                    {datasets.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none group-hover:text-primary transition-colors" />
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            className="w-full justify-center gap-2 rounded-xl h-11 border-dashed border-2 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all font-bold text-xs uppercase tracking-wider"
                            onClick={() => setMessages([])}
                        >
                            <Plus className="h-4 w-4" /> New Analysis
                        </Button>
                    </Card>

                    <Card className="flex-1 p-4 bg-card/50 backdrop-blur-sm border-border/50 rounded-[1.5rem] shadow-sm flex flex-col gap-4 overflow-hidden">
                        <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground font-bold px-1">
                            <div className="flex items-center gap-2">
                                <History className="h-3.5 w-3.5 text-primary/50" /> Recent Queries
                            </div>
                            {history.length > 0 && (
                                <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors" onClick={clearHistory}>
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                        <ScrollArea className="flex-1 -mx-2 px-2">
                            <div className="space-y-1">
                                {history.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-center space-y-2 opacity-50">
                                        <MessageSquare className="h-8 w-8 text-muted-foreground/30" />
                                        <p className="text-[10px] font-medium italic">No recent queries</p>
                                    </div>
                                ) : (
                                    history.map(item => (
                                        <button
                                            key={item.id}
                                            className="w-full text-left text-xs p-3 rounded-xl hover:bg-primary/5 hover:text-primary border border-transparent hover:border-primary/10 truncate transition-all group flex items-center gap-2"
                                            onClick={() => handleSend(item.query)}
                                        >
                                            <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 -ml-1 transition-all" />
                                            <span className="truncate font-medium">{item.query}</span>
                                        </button>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </Card>
                </div>

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Card className="flex-1 flex flex-col overflow-hidden border-border/50 shadow-2xl bg-card/30 backdrop-blur-md rounded-[2rem]">
                        {/* Header */}
                        <div className="p-4 border-b border-border/50 bg-muted/20 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
                                    <Sparkles className="h-6 w-6 text-primary-foreground" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold tracking-tight">AI Analyst Agent</h2>
                                    <div className="flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Active & Ready</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Badge variant="outline" className="gap-1.5 py-1.5 px-3 bg-background/50 border-border/50 rounded-lg">
                                    <Database className="h-3 w-3 text-primary" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">
                                        {datasets.find(d => d.id === selectedDataset)?.name || "No Dataset"}
                                    </span>
                                </Badge>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
                            <div className="max-w-4xl mx-auto space-y-4">
                                {messages.length === 0 && (
                                    <div className="text-center py-12 space-y-8">
                                        <div className="relative inline-block">
                                            <div className="h-20 w-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto relative z-10">
                                                <Brain className="h-10 w-10 text-primary animate-pulse" />
                                            </div>
                                            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 opacity-50" />
                                        </div>
                                        <div className="space-y-3">
                                            <h3 className="text-2xl font-black tracking-tight">How can I help you today?</h3>
                                            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed font-medium">
                                                I'm your autonomous data analyst. Ask me to calculate metrics, find trends, or visualize your business performance.
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto px-4">
                                            {[
                                                { label: "List all products", icon: <Package className="h-3.5 w-3.5" /> },
                                                { label: "Show me 5 rows", icon: <TableIcon className="h-3.5 w-3.5" /> },
                                                { label: "Revenue by category", icon: <BarChart3 className="h-3.5 w-3.5" /> },
                                                { label: "Top 10 customers", icon: <Users className="h-3.5 w-3.5" /> }
                                            ].map((item, idx) => (
                                                <Button
                                                    key={idx}
                                                    variant="outline"
                                                    className="text-[11px] h-auto py-4 px-5 justify-start text-left hover:bg-primary/5 hover:border-primary/30 rounded-2xl flex items-center gap-3 transition-all group font-bold uppercase tracking-wider"
                                                    onClick={() => handleSend(item.label)}
                                                >
                                                    <div className="h-8 w-8 rounded-lg bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                                                        {item.icon}
                                                    </div>
                                                    {item.label}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {messages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                        {msg.role === "user" ? (
                                            <div className="bg-primary text-primary-foreground p-4 rounded-2xl rounded-tr-sm shadow-lg max-w-[80%]">
                                                <p className="text-sm font-medium">{msg.content}</p>
                                            </div>
                                        ) : (
                                            <div className="flex gap-3 max-w-[90%]">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                                                    <Sparkles className="h-4 w-4 text-primary" />
                                                </div>
                                                <div className="space-y-3 flex-1">
                                                    <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border/60 shadow-sm">
                                                        <div className="flex items-center gap-2 mb-5 pb-3 border-b border-border/40">
                                                            <Sparkles className="h-4 w-4 text-primary" />
                                                            <span className="text-xs font-bold uppercase tracking-widest text-primary">Executive Summary</span>
                                                        </div>
                                                        <div className="prose prose-sm dark:prose-invert max-w-none 
                                                            prose-p:leading-8 prose-p:mb-6 prose-p:text-foreground/90 
                                                            prose-headings:font-semibold prose-headings:text-foreground prose-headings:mt-8 prose-headings:mb-4 prose-headings:tracking-tight
                                                            prose-strong:font-semibold prose-strong:text-foreground 
                                                            prose-ul:list-disc prose-ul:pl-4 prose-ul:mb-6
                                                            prose-li:mb-2 prose-li:leading-8
                                                            prose-table:w-full prose-table:border-collapse prose-table:my-8 prose-table:table-fixed
                                                            prose-th:text-left prose-th:py-4 prose-th:px-4 prose-th:text-xs prose-th:font-bold prose-th:uppercase prose-th:tracking-wider prose-th:text-muted-foreground prose-th:border-b prose-th:border-border prose-th:bg-muted/20
                                                            prose-td:py-4 prose-td:px-4 prose-td:text-sm prose-td:border-b prose-td:border-border/40 prose-td:align-top
                                                            prose-hr:border-border/60 prose-hr:my-8
                                                            prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border/50 prose-pre:rounded-xl prose-pre:p-4
                                                            prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none">
                                                            <ReactMarkdown
                                                                remarkPlugins={[remarkGfm]}
                                                                rehypePlugins={[rehypeHighlight]}
                                                            >
                                                                {msg.content}
                                                            </ReactMarkdown>
                                                        </div>
                                                    </div>

                                                    {msg.data && msg.data.length > 0 && (
                                                        <Card className="overflow-hidden border">
                                                            <div className="p-2 bg-muted/50 border-b flex items-center justify-between">
                                                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                                    {msg.chartType === "bar" && <BarChart3 className="h-3 w-3" />}
                                                                    {msg.chartType === "line" && <LineChartIcon className="h-3 w-3" />}
                                                                    {msg.chartType === "pie" && <PieChartIcon className="h-3 w-3" />}
                                                                    {msg.chartType === "table" && <TableIcon className="h-3 w-3" />}
                                                                    {msg.chartType || "Data"} Result
                                                                </div>
                                                                <Badge variant="secondary" className="text-[9px] h-4">DuckDB</Badge>
                                                            </div>

                                                            {/* Render Chart if applicable, otherwise fallback to Table */}
                                                            {(() => {
                                                                const chart = msg.chartType && msg.chartType !== 'table' ? renderChart(msg) : null;
                                                                if (chart) return chart;

                                                                return (
                                                                    <div className="max-h-64 overflow-auto">
                                                                        <Table>
                                                                            <TableHeader>
                                                                                <TableRow className="hover:bg-transparent">
                                                                                    {Object.keys(msg.data[0]).map(col => (
                                                                                        <TableHead key={col} className="text-[10px] h-8 font-semibold">{col}</TableHead>
                                                                                    ))}
                                                                                </TableRow>
                                                                            </TableHeader>
                                                                            <TableBody>
                                                                                {msg.data.slice(0, 10).map((row, ri) => (
                                                                                    <TableRow key={ri} className="hover:bg-muted/30">
                                                                                        {Object.values(row).map((val: any, vi) => (
                                                                                            <TableCell key={vi} className="text-[11px] py-2">
                                                                                                {typeof val === 'number' ? val.toLocaleString() : String(val)}
                                                                                            </TableCell>
                                                                                        ))}
                                                                                    </TableRow>
                                                                                ))}
                                                                            </TableBody>
                                                                        </Table>
                                                                    </div>
                                                                );
                                                            })()}
                                                        </Card>
                                                    )}

                                                    {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                                                        <div className="flex flex-wrap gap-2">
                                                            {msg.suggestedQuestions.map((q, qi) => (
                                                                <Button
                                                                    key={qi}
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="text-[10px] h-7 rounded-full hover:bg-primary/5 border-primary/20"
                                                                    onClick={() => handleSend(q)}
                                                                >
                                                                    {q}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="flex gap-3">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{currentStatus || "Thinking..."}</p>
                                                </div>
                                                <div className="h-4 w-48 bg-muted animate-pulse rounded-lg" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-border/50 bg-muted/10 shrink-0">
                            <div className="max-w-4xl mx-auto">
                                <div className="relative group">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-[1.5rem] blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
                                    <Input
                                        className="relative pr-14 py-7 rounded-[1.25rem] border-border/50 focus-visible:ring-2 focus-visible:ring-primary/20 bg-background/80 backdrop-blur-sm text-sm font-medium shadow-inner"
                                        placeholder="Ask about your data (e.g., 'What are my top products?')"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                                    />
                                    <Button
                                        size="icon"
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-xl h-10 w-10 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                                        onClick={() => handleSend()}
                                        disabled={isLoading || !query}
                                    >
                                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    </Button>
                                </div>
                                <div className="flex items-center justify-center gap-4 mt-3">
                                    <p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] font-bold">
                                        AI-Powered Insights • DuckDB Engine • Swix Cortex
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}

