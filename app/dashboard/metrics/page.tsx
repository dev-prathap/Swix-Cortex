"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Calculator, Plus, Trash2, Loader2, Info, CheckCircle2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Dataset {
    id: string
    name: string
}

interface Metric {
    id: string
    name: string
    formula: string
    description: string | null
    format: string
    category: string | null
}

export default function MetricStorePage() {
    const [datasets, setDatasets] = useState<Dataset[]>([])
    const [selectedDataset, setSelectedDataset] = useState<string>("")
    const [metrics, setMetrics] = useState<Metric[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isMetricsLoading, setIsMetricsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // New Metric Form
    const [newName, setNewName] = useState("")
    const [newFormula, setNewFormula] = useState("")
    const [newDescription, setNewDescription] = useState("")
    const [newFormat, setNewFormat] = useState("number")

    const { toast } = useToast()

    useEffect(() => {
        async function fetchDatasets() {
            try {
                const res = await fetch("/api/data-sources")
                if (res.ok) {
                    const data = await res.json()
                    setDatasets(data)
                    if (data.length > 0) setSelectedDataset(data[0].id)
                }
            } catch (error) {
                console.error("Failed to fetch datasets", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchDatasets()
    }, [])

    useEffect(() => {
        if (selectedDataset) {
            fetchMetrics()
        }
    }, [selectedDataset])

    async function fetchMetrics() {
        setIsMetricsLoading(true)
        try {
            const res = await fetch(`/api/analyst/metrics?datasetId=${selectedDataset}`)
            if (res.ok) {
                const data = await res.json()
                setMetrics(data)
            }
        } catch (error) {
            console.error("Failed to fetch metrics", error)
        } finally {
            setIsMetricsLoading(false)
        }
    }

    const handleAddMetric = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newName || !newFormula || !selectedDataset) return

        setIsSaving(true)
        try {
            const res = await fetch("/api/analyst/metrics", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    datasetId: selectedDataset,
                    name: newName,
                    formula: newFormula,
                    description: newDescription,
                    format: newFormat
                })
            })

            if (res.ok) {
                toast({
                    title: "Metric Created",
                    description: `${newName} has been added to the Metric Store.`,
                })
                setNewName("")
                setNewFormula("")
                setNewDescription("")
                fetchMetrics()
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to create metric.",
                variant: "destructive"
            })
        } finally {
            setIsSaving(false)
        }
    }

    const handleDeleteMetric = async (id: string) => {
        try {
            const res = await fetch(`/api/analyst/metrics?id=${id}`, {
                method: "DELETE"
            })
            if (res.ok) {
                toast({
                    title: "Metric Deleted",
                    description: "The metric has been removed.",
                })
                fetchMetrics()
            }
        } catch (error) {
            console.error("Failed to delete metric", error)
        }
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Calculator className="h-8 w-8 text-primary" />
                        Metric Store
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Define standardized formulas to ensure 100% accuracy in AI insights.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        className="bg-background border border-input h-10 px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        value={selectedDataset}
                        onChange={(e) => setSelectedDataset(e.target.value)}
                    >
                        {datasets.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Add Metric Form */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Define New Metric</CardTitle>
                            <CardDescription>Create a single source of truth</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAddMetric} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Metric Name</label>
                                    <Input
                                        placeholder="e.g. Gross Profit"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">SQL Formula</label>
                                    <Input
                                        placeholder="e.g. sum(revenue) - sum(cost)"
                                        value={newFormula}
                                        onChange={(e) => setNewFormula(e.target.value)}
                                        required
                                    />
                                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        <Info className="h-3 w-3" />
                                        Use standard SQL aggregation functions.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Description</label>
                                    <Input
                                        placeholder="What does this metric represent?"
                                        value={newDescription}
                                        onChange={(e) => setNewDescription(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Format</label>
                                    <select
                                        className="w-full bg-background border border-input h-10 px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                        value={newFormat}
                                        onChange={(e) => setNewFormat(e.target.value)}
                                    >
                                        <option value="number">Number</option>
                                        <option value="currency">Currency</option>
                                        <option value="percentage">Percentage</option>
                                    </select>
                                </div>
                                <Button type="submit" className="w-full" disabled={isSaving}>
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                                    Save Metric
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="p-6">
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-sm">Why use a Metric Store?</h4>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                        Standardizing metrics prevents AI from "hallucinating" different ways to calculate the same value, ensuring consistency across all reports.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Metric List */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">Active Metrics</CardTitle>
                                <CardDescription>Standardized definitions for this dataset</CardDescription>
                            </div>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                {metrics.length} Defined
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            {isMetricsLoading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : metrics.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {metrics.map((metric) => (
                                        <div key={metric.id} className="p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors group">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-slate-800 dark:text-slate-200">{metric.name}</h4>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                                                    onClick={() => handleDeleteMetric(metric.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="bg-background/80 p-2 rounded border border-border/50 font-mono text-[11px] text-primary mb-3">
                                                {metric.formula}
                                            </div>
                                            {metric.description && (
                                                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                                                    {metric.description}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                                                    {metric.format}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 opacity-40">
                                    <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                                    <p className="text-lg font-medium">No metrics defined yet</p>
                                    <p className="text-sm">Start by adding your first business metric on the left.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
