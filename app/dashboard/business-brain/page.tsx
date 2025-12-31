"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Brain, Upload, FileText, CheckCircle2, Loader2, Search, Sparkles, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Dataset {
    id: string
    name: string
}

interface Document {
    id: string
    fileName: string
    createdAt: string
}

export default function BusinessBrainPage() {
    const [datasets, setDatasets] = useState<Dataset[]>([])
    const [documents, setDocuments] = useState<Document[]>([])
    const [selectedDataset, setSelectedDataset] = useState<string>("")
    const [isUploading, setIsUploading] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isDocsLoading, setIsDocsLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [aiResponse, setAiResponse] = useState("")
    const [isAsking, setIsAsking] = useState(false)
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
            fetchDocuments()
        }
    }, [selectedDataset])

    async function fetchDocuments() {
        setIsDocsLoading(true)
        try {
            const res = await fetch(`/api/analyst/context/list?datasetId=${selectedDataset}`)
            if (res.ok) {
                const data = await res.json()
                setDocuments(data)
            }
        } catch (error) {
            console.error("Failed to fetch documents", error)
        } finally {
            setIsDocsLoading(false)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !selectedDataset) return

        setIsUploading(true)
        const formData = new FormData()
        formData.append("file", file)
        formData.append("datasetId", selectedDataset)

        try {
            const res = await fetch("/api/analyst/context/upload", {
                method: "POST",
                body: formData,
            })

            if (res.ok) {
                toast({
                    title: "Success",
                    description: "Document ingested into Business Brain.",
                })
                fetchDocuments()
            } else {
                throw new Error("Upload failed")
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to upload document.",
                variant: "destructive",
            })
        } finally {
            setIsUploading(false)
        }
    }

    const handleDeleteDocument = async (fileName: string) => {
        try {
            const res = await fetch(`/api/analyst/context/delete?datasetId=${selectedDataset}&fileName=${fileName}`, {
                method: "DELETE"
            })
            if (res.ok) {
                toast({
                    title: "Deleted",
                    description: "Document removed from Business Brain.",
                })
                fetchDocuments()
            }
        } catch (error) {
            console.error("Failed to delete document", error)
        }
    }

    const handleAskAI = async () => {
        if (!searchQuery || !selectedDataset) return
        setIsAsking(true)
        setAiResponse("")

        try {
            // This will be implemented in the next step
            const res = await fetch("/api/analyst/context/query", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: searchQuery, datasetId: selectedDataset }),
            })

            if (res.ok) {
                const data = await res.json()
                setAiResponse(data.response)
            }
        } catch (error) {
            console.error("Failed to ask AI", error)
        } finally {
            setIsAsking(false)
        }
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Brain className="h-8 w-8 text-primary" />
                        Business Brain
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Upload strategy docs, goals, and notes to give your AI context.
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
                {/* Left Column: Upload & Context List */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="border-2 border-dashed border-muted-foreground/20 bg-muted/30">
                        <CardHeader>
                            <CardTitle className="text-lg">Add Context</CardTitle>
                            <CardDescription>Upload PDF or Text files</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-primary/20 rounded-xl bg-background/50 hover:bg-background/80 transition-colors cursor-pointer relative">
                                <Upload className="h-10 w-10 text-primary/40 mb-2" />
                                <p className="text-sm font-medium">Click to upload</p>
                                <p className="text-xs text-muted-foreground mt-1">PDF, TXT up to 10MB</p>
                                <input
                                    type="file"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={handleFileUpload}
                                    disabled={isUploading}
                                />
                                {isUploading && (
                                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-xl">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Knowledge Base</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isDocsLoading ? (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                </div>
                            ) : documents.length > 0 ? (
                                documents.map((doc) => (
                                    <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-5 w-5 text-blue-500" />
                                            <div>
                                                <p className="text-sm font-medium truncate max-w-[150px]">{doc.fileName}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(doc.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => handleDeleteDocument(doc.fileName)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 opacity-40">
                                    <FileText className="h-8 w-8 mx-auto mb-2" />
                                    <p className="text-xs">No documents uploaded</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: AI Interaction */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="h-full flex flex-col">
                        <CardHeader className="border-b bg-muted/10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-primary" />
                                    <CardTitle className="text-lg">Contextual Chat</CardTitle>
                                </div>
                                <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
                                    Powered by pgvector
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col p-6">
                            <div className="flex-1 min-h-[400px] mb-6 space-y-4 overflow-y-auto">
                                {aiResponse ? (
                                    <div className="bg-primary/5 border border-primary/10 p-6 rounded-2xl relative group">
                                        <div className="absolute -top-3 -left-3 bg-primary text-white p-1.5 rounded-lg shadow-lg">
                                            <Brain className="h-4 w-4" />
                                        </div>
                                        <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                                            {aiResponse}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                                        <div className="p-4 bg-muted rounded-full">
                                            <Search className="h-12 w-12" />
                                        </div>
                                        <div>
                                            <p className="text-lg font-medium">Ask your Business Brain</p>
                                            <p className="text-sm">"What are our main goals for this quarter?"</p>
                                        </div>
                                    </div>
                                )}
                                {isAsking && (
                                    <div className="flex items-center gap-3 text-primary animate-pulse">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span className="text-sm font-medium">AI is thinking...</span>
                                    </div>
                                )}
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-full"></div>
                                <div className="relative flex items-center bg-white dark:bg-slate-900 rounded-full p-1.5 shadow-lg border border-slate-200 dark:border-slate-700 transition-all duration-300 focus-within:ring-2 focus-within:ring-primary/50">
                                    <Input
                                        className="w-full bg-transparent border-none focus-visible:ring-0 text-base text-slate-700 dark:text-slate-200 placeholder:text-slate-400 shadow-none h-12 pl-6"
                                        placeholder="Ask about your business strategy..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
                                    />
                                    <Button
                                        onClick={handleAskAI}
                                        disabled={isAsking || !searchQuery}
                                        className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-full font-medium transition-all flex items-center space-x-2 whitespace-nowrap h-10 mr-1"
                                    >
                                        {isAsking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                        <span>Ask Brain</span>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
