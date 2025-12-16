"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Filter, Clock, Users, Sparkles, Plus, Share2, Printer, MoreHorizontal, Loader2, FileText } from "lucide-react"

interface Report {
    id: string
    title: string
    description: string
    createdAt: string
}

export default function ReportsPage() {
    const [reports, setReports] = useState<Report[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        fetchReports()
    }, [])

    async function fetchReports() {
        try {
            const response = await fetch("/api/reports")
            if (response.ok) {
                const data = await response.json()
                setReports(data)
            }
        } catch (error) {
            console.error("Failed to fetch reports", error)
        } finally {
            setIsLoading(false)
        }
    }

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsSubmitting(true)

        const formData = new FormData(event.currentTarget)
        const title = formData.get("title") as string
        const description = formData.get("description") as string
        const content = formData.get("content") as string

        try {
            const response = await fetch("/api/reports", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    description,
                    content: { text: content } // Simple content structure for now
                })
            })

            if (response.ok) {
                setIsDialogOpen(false)
                fetchReports()
            }
        } catch (error) {
            console.error("Failed to create report", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Reports</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Generated Reports & Analysis</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center bg-white dark:bg-surface-dark p-1 rounded-lg border border-border-light dark:border-border-dark shadow-sm">
                        <Button variant="ghost" size="sm" className="bg-blue-50 dark:bg-blue-900/30 text-primary font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50">
                            <Filter className="h-4 w-4 mr-2" />
                            All Reports
                        </Button>
                        <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium">
                            <Clock className="h-4 w-4 mr-2" />
                            Recent
                        </Button>
                        <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium">
                            <Users className="h-4 w-4 mr-2" />
                            Shared
                        </Button>
                        <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium">
                            <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
                            AI Insights
                        </Button>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all transform hover:-translate-y-0.5">
                                <Plus className="h-4 w-4" />
                                Create New Report
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                            <form onSubmit={onSubmit}>
                                <DialogHeader>
                                    <DialogTitle>Create New Report</DialogTitle>
                                    <DialogDescription>
                                        Manually create a report or save an analysis.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-6 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Report Title</Label>
                                        <Input id="title" name="title" placeholder="e.g. Q3 Sales Overview" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Input id="description" name="description" placeholder="Brief summary of the report content" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="content">Content / Notes</Label>
                                        <Textarea id="content" name="content" placeholder="Enter report details or analysis notes..." className="min-h-[150px]" />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Save Report
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {isLoading ? (
                    <div className="col-span-full flex justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : reports.length === 0 ? (
                    <div className="col-span-full text-center p-12 bg-surface-light dark:bg-surface-dark rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                        <FileText className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white">No reports yet</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Create your first report to get started.</p>
                    </div>
                ) : (
                    reports.map((report) => (
                        <div key={report.id} className="group bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark overflow-hidden hover:shadow-glow hover:border-primary/50 transition-all duration-300 flex flex-col">
                            <div className="relative h-40 bg-slate-100 dark:bg-slate-900 p-4 flex items-center justify-center">
                                <FileText className="h-16 w-16 text-slate-300 dark:text-slate-700 group-hover:text-primary/50 transition-colors" />
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/10 dark:to-black/30 pointer-events-none"></div>
                            </div>
                            <div className="p-5 flex-1 flex flex-col">
                                <h3 className="font-semibold text-lg leading-tight mb-2 text-slate-900 dark:text-white group-hover:text-primary transition-colors line-clamp-2">{report.title}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">{report.description || "No description provided."}</p>
                                <div className="mt-auto flex items-center justify-between">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                            {new Date(report.createdAt).toLocaleDateString()}
                                        </span>
                                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 w-fit text-[10px] px-1.5 py-0">
                                            Report
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary dark:hover:text-primary transition-colors rounded-full hover:bg-blue-50 dark:hover:bg-slate-700">
                                            <Share2 className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary dark:hover:text-primary transition-colors rounded-full hover:bg-blue-50 dark:hover:bg-slate-700">
                                            <Printer className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
