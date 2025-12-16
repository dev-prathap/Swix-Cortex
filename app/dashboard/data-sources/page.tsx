"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Database, Link as LinkIcon, RefreshCw, MoreVertical, Edit, Trash2, HelpCircle, EyeOff, CheckCircle2, FileText, Plus, Loader2 } from "lucide-react"

interface DataSource {
    id: string
    name: string
    type: string
    status: string
    lastSync: string
}

export default function DataSourcesPage() {
    const [selectedType, setSelectedType] = useState<string>("postgresql")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [dataSources, setDataSources] = useState<DataSource[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

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
            setIsLoading(false)
        }
    }

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsSubmitting(true)

        const formData = new FormData(event.currentTarget)
        const name = formData.get("name") as string

        try {
            let response;

            if (selectedType === "csv") {
                // For CSV, we send the FormData directly to the ingest endpoint
                response = await fetch("/api/data-sources/ingest", {
                    method: "POST",
                    body: formData, // Contains 'file' and 'name'
                })
            } else {
                // For other types, we construct the JSON payload
                const connectionDetails: any = {}
                if (selectedType === "postgresql" || selectedType === "mysql") {
                    connectionDetails.host = formData.get("host")
                    connectionDetails.port = formData.get("port")
                    connectionDetails.database = formData.get("database")
                    connectionDetails.username = formData.get("username")
                    connectionDetails.password = formData.get("password")
                } else if (selectedType === "mongodb") {
                    connectionDetails.uri = formData.get("uri")
                }

                response = await fetch("/api/data-sources", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name,
                        type: selectedType,
                        connectionDetails
                    })
                })
            }

            if (response && response.ok) {
                setIsDialogOpen(false)
                fetchDataSources() // Refresh list
            } else {
                const errorData = await response?.json()
                console.error("Failed to add data source", errorData)
                alert(`Error: ${errorData?.error || 'Failed to add data source'}`)
            }
        } catch (error) {
            console.error("Failed to add data source", error)
            alert("An unexpected error occurred")
        } finally {
            setIsSubmitting(false)
        }
    }

    const renderFields = () => {
        switch (selectedType) {
            case "postgresql":
            case "mysql":
            case "snowflake":
                return (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="host">Host URL</Label>
                                <Input id="host" name="host" placeholder="e.g. 192.168.1.1" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="port">Port</Label>
                                <Input id="port" name="port" placeholder="5432" type="number" required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="database">Database Name</Label>
                            <Input id="database" name="database" placeholder="swix_prod" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input id="username" name="username" placeholder="db_user" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input id="password" name="password" type="password" placeholder="••••••••" required />
                            </div>
                        </div>
                    </>
                )
            case "mongodb":
                return (
                    <div className="space-y-2">
                        <Label htmlFor="uri">Connection String (URI)</Label>
                        <Input id="uri" name="uri" placeholder="mongodb+srv://user:password@cluster.mongodb.net/db" required />
                    </div>
                )
            case "csv":
                return (
                    <div className="space-y-2">
                        <Label htmlFor="file">Upload CSV File</Label>
                        <Input id="file" name="file" type="file" accept=".csv" required className="cursor-pointer" />
                        <p className="text-xs text-slate-500">Max file size: 10MB. First row must contain headers.</p>
                    </div>
                )
            default:
                return null
        }
    }

    return (
        <div className="space-y-8">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                        <span className="w-2 h-8 bg-primary rounded-full shadow-glow"></span>
                        Data Sources
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 ml-5">Manage your data connections and neural pipelines.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-blue-500/30 flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Add Data Source
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                        <form onSubmit={onSubmit}>
                            <DialogHeader>
                                <DialogTitle>Add New Data Source</DialogTitle>
                                <DialogDescription>
                                    Connect a new database or upload a file to start analyzing.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-4">
                                <div className="space-y-2">
                                    <Label>Source Type</Label>
                                    <Select value={selectedType} onValueChange={setSelectedType}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="postgresql">PostgreSQL</SelectItem>
                                            <SelectItem value="mysql">MySQL</SelectItem>
                                            <SelectItem value="mongodb">MongoDB</SelectItem>
                                            <SelectItem value="snowflake">Snowflake</SelectItem>
                                            <SelectItem value="csv">CSV Upload</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="name">Connection Name</Label>
                                    <Input id="name" name="name" placeholder="e.g. Sales Production DB" required />
                                </div>

                                {renderFields()}
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Connect Source
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </header>

            <section className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg border border-border-light dark:border-border-dark overflow-hidden">
                <div className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-surface-dark px-6 py-4 border-b border-border-light dark:border-border-dark flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                        <Database className="h-5 w-5 text-primary" />
                        Existing Data Sources
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span>Showing {dataSources.length} sources</span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                            <TableRow className="hover:bg-transparent border-b border-border-light dark:border-border-dark">
                                <TableHead className="p-4 pl-6 text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">Name</TableHead>
                                <TableHead className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">Type</TableHead>
                                <TableHead className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">Status</TableHead>
                                <TableHead className="p-4 pr-6 text-xs font-semibold tracking-wider text-right text-slate-500 uppercase dark:text-slate-400">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-border-light dark:divide-border-dark">
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center p-8 text-muted-foreground">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                        Loading sources...
                                    </TableCell>
                                </TableRow>
                            ) : dataSources.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center p-8 text-muted-foreground">
                                        No data sources connected yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                dataSources.map((source) => (
                                    <TableRow key={source.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-none">
                                        <TableCell className="p-4 pl-6 font-medium text-slate-900 dark:text-white">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                    <Database className="h-4 w-4" />
                                                </div>
                                                {source.name}
                                            </div>
                                        </TableCell>
                                        <TableCell className="p-4 text-slate-600 dark:text-slate-300 capitalize">{source.type}</TableCell>
                                        <TableCell className="p-4">
                                            <div className="flex items-center gap-2">
                                                <span className="relative flex h-3 w-3">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
                                                </span>
                                                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{source.status}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="p-4 pr-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all h-8 w-8">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all h-8 w-8">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </section>
        </div>
    )
}
