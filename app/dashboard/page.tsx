"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    TrendingUp,
    Users,
    DollarSign,
    ShoppingBag,
    Zap,
    ArrowUpRight,
    ArrowDownRight,
    Sparkles,
    Calendar,
    Package,
    Activity,
    Bookmark,
    Mail,
    MousePointer2,
    Bell,
    Search,
    MoreVertical,
    CheckCircle2,
    AlertCircle,
    XCircle,
    ChevronDown,
    Globe,
    LayoutGrid,
    Clock,
    Target,
    Plus,
    Loader2,
    Sun,
    Moon,
    FileText,
    LogOut,
    Settings
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from 'recharts'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ConnectorModal } from "@/components/dashboard/ConnectorModal"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function DashboardPage() {
    const [stats, setStats] = useState<any>(null)
    const [briefing, setBriefing] = useState<any>(null)
    const [dataSources, setDataSources] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isBriefingLoading, setIsBriefingLoading] = useState(true)
    const [isConnectorOpen, setIsConnectorOpen] = useState(false)
    const [isDemoLoading, setIsDemoLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [user, setUser] = useState<any>(null)
    const { toast } = useToast()
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const router = useRouter()

    // Avoid hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    const fetchStats = async () => {
        try {
            const res = await fetch("/api/dashboard/stats")
            if (res.ok) {
                const data = await res.json()
                setStats(data)
            }
        } catch (error) {
            console.error("Failed to fetch stats", error)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchBriefing = async () => {
        try {
            const res = await fetch("/api/dashboard/briefing")
            if (res.ok) {
                const data = await res.json()
                setBriefing(data)
            }
        } catch (error) {
            console.error("Failed to fetch briefing", error)
        } finally {
            setIsBriefingLoading(false)
        }
    }

    const fetchDataSources = async () => {
        try {
            const res = await fetch("/api/data-sources")
            if (res.ok) {
                const data = await res.json()
                setDataSources(data.dataSources || [])
            }
        } catch (error) {
            console.error("Failed to fetch data sources", error)
        }
    }

    const fetchUser = async () => {
        try {
            const res = await fetch("/api/auth/me")
            if (res.ok) {
                const data = await res.json()
                setUser(data.user)
            }
        } catch (error) {
            console.error("Failed to fetch user", error)
        }
    }

    const handleLogout = async () => {
        try {
            const res = await fetch("/api/auth/logout", { method: "POST" })
            if (res.ok) {
                router.push("/login")
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to logout",
                variant: "destructive"
            })
        }
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            router.push(`/dashboard/query?q=${encodeURIComponent(searchQuery)}`)
        }
    }

    useEffect(() => {
        fetchStats()
        fetchBriefing()
        fetchDataSources()
        fetchUser()
    }, [])

    const handleTryDemo = async () => {
        setIsDemoLoading(true)
        try {
            const res = await fetch("/api/demo/setup", { method: "POST" })
            if (res.ok) {
                toast({
                    title: "Demo Mode Activated",
                    description: "We've generated sample data for you to explore.",
                })
                // Set demo cookie and reload
                document.cookie = "swix_demo_mode=true; path=/";
                window.location.reload()
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to setup demo data.",
                variant: "destructive"
            })
        } finally {
            setIsDemoLoading(false)
        }
    }

    // Check if user has connected any store OR has any data
    const hasData = dataSources.length > 0 || (stats && (stats.totalOrders > 0 || stats.totalCustomers > 0))

    const topStats = [
        {
            label: "Total Sales",
            value: isLoading ? "..." : `$${(stats?.totalSales || 0).toLocaleString()}`,
            trend: "+38%",
            icon: <ShoppingBag className="h-4 w-4 text-blue-500" />,
            bg: "bg-blue-500/10",
            period: "Real-time"
        },
        {
            label: "Total Orders",
            value: isLoading ? "..." : (stats?.totalOrders || 0).toLocaleString(),
            trend: "+22%",
            icon: <LayoutGrid className="h-4 w-4 text-green-500" />,
            bg: "bg-green-500/10",
            period: "All datasets"
        },
        {
            label: "Total Products",
            value: isLoading ? "..." : (stats?.totalProducts || 0).toLocaleString(),
            trend: "+12%",
            icon: <Package className="h-4 w-4 text-orange-500" />,
            bg: "bg-orange-500/10",
            period: "Active SKUs"
        },
        {
            label: "Avg. LTV",
            value: isLoading ? "..." : `$${stats?.totalCustomers ? Math.round(stats.totalSales / stats.totalCustomers) : 0}`,
            trend: "+15%",
            icon: <TrendingUp className="h-4 w-4 text-purple-500" />,
            bg: "bg-purple-500/10",
            period: "Per customer"
        },
    ]

    const intelligenceFeed = briefing?.insights || stats?.insights || []

    const barData = [
        { name: 'M', value: 40, color: '#ef4444' },
        { name: 'T', value: 70, color: '#ec4899' },
        { name: 'W', value: 50, color: '#8b5cf6' },
        { name: 'T', value: 90, color: '#3b82f6' },
        { name: 'F', value: 60, color: '#10b981' },
        { name: 'S', value: 80, color: '#f59e0b' },
        { name: 'S', value: 45, color: '#ef4444' },
    ]

    // FTUE: First-Time User Experience (Empty State)
    if (!isLoading && !hasData) {
        return (
            <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
                <div className="max-w-4xl w-full space-y-12">
                    {/* Status Badge + Context */}
                    <div className="text-center space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-full border border-primary/10">
                            <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                AI Analyst Idle • Awaiting Data
                            </span>
                        </div>

                        {/* Clear, Authority-Driven Headline (UX: Answer "What is this?") */}
                        <div className="space-y-3">
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                                Your AI Chief Analyst is Ready.
                            </h1>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                                Swix Cortex is an autonomous business intelligence system. Connect your data source 
                                to activate real-time insights, forecasting, and customer profiling.
                            </p>
                        </div>
                    </div>

                    {/* Getting Started Checklist (UX: Progressive Disclosure) */}
                    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                            </div>
                            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                                Quick Start Guide
                            </h3>
                        </div>
                        
                        <div className="space-y-3">
                            {/* Step 1 */}
                            <div className="flex items-start gap-4 p-4 rounded-xl bg-background/50 border border-border/50">
                                <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-xs font-bold text-primary">1</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-foreground mb-1">
                                        Connect Your Data Source
                                    </p>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Link Shopify, WooCommerce, or Stripe. Takes 30 seconds.
                                    </p>
                                </div>
                                <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] font-bold px-2">
                                    Pending
                                </Badge>
                            </div>

                            {/* Step 2 */}
                            <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 border border-border/30 opacity-60">
                                <div className="h-7 w-7 rounded-lg bg-muted border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-xs font-bold text-muted-foreground">2</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-muted-foreground mb-1">
                                        AI Analyzes Your Business
                                    </p>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Cortex profiles customers, forecasts revenue, detects anomalies.
                                    </p>
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 border border-border/30 opacity-60">
                                <div className="h-7 w-7 rounded-lg bg-muted border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-xs font-bold text-muted-foreground">3</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-muted-foreground mb-1">
                                        Review Daily Briefings
                                    </p>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Get executive summaries, alerts, and strategic recommendations.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Primary + Secondary Actions (UX: Clear CTA Hierarchy) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* PRIMARY CTA: Connect Store (Visually Dominant) */}
                        <Card 
                            className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background 
                                     border-primary/20 rounded-2xl p-8 cursor-pointer group hover:shadow-xl 
                                     hover:border-primary/40 transition-all duration-300"
                            onClick={() => setIsConnectorOpen(true)}
                        >
                            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 blur-3xl rounded-full" />
                            
                            <div className="relative z-10 space-y-4">
                                <div className="h-14 w-14 bg-primary/10 rounded-xl flex items-center justify-center 
                                              group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                                    <Plus className="h-7 w-7 text-primary" />
                                </div>
                                
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-foreground">
                                        Connect Your Store
                                    </h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Activate your AI analyst. Sync Shopify, WooCommerce, or Stripe in seconds.
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                                    <span>Get Started</span>
                                    <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </div>
                            </div>
                        </Card>

                        {/* SECONDARY CTA: Try Demo (Attractive but Secondary) */}
                        <Card 
                            className="relative overflow-hidden bg-card border-border rounded-2xl p-8 cursor-pointer 
                                     group hover:shadow-lg hover:border-orange-500/30 transition-all duration-300"
                            onClick={handleTryDemo}
                        >
                            <div className="relative z-10 space-y-4">
                                <div className="h-14 w-14 bg-orange-500/10 rounded-xl flex items-center justify-center 
                                              group-hover:scale-110 group-hover:bg-orange-500/20 transition-all duration-300">
                                    {isDemoLoading ? (
                                        <Loader2 className="h-7 w-7 text-orange-500 animate-spin" />
                                    ) : (
                                        <Activity className="h-7 w-7 text-orange-500" />
                                    )}
                                </div>
                                
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-foreground">
                                        Try Demo Mode
                                    </h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Not ready yet? Explore Cortex with sample e-commerce data and AI reports.
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 text-xs font-semibold text-orange-500">
                                    <span>Explore Demo</span>
                                    <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* What You'll Get (UX: Preview of Value) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                        {[
                            { icon: Users, label: "Customer Profiling", desc: "RFM segmentation" },
                            { icon: TrendingUp, label: "Revenue Forecasting", desc: "30-day predictions" },
                            { icon: AlertCircle, label: "Anomaly Detection", desc: "Real-time alerts" },
                            { icon: Sparkles, label: "Daily Briefings", desc: "Executive summaries" }
                        ].map((feature, i) => (
                            <div key={i} className="text-center space-y-2 p-4 rounded-xl bg-muted/30 border border-border/30">
                                <div className="h-10 w-10 mx-auto rounded-lg bg-primary/5 flex items-center justify-center">
                                    <feature.icon className="h-5 w-5 text-primary/60" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-foreground">{feature.label}</p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">{feature.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <ConnectorModal open={isConnectorOpen} onOpenChange={setIsConnectorOpen} />
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background text-foreground p-4 space-y-4 font-sans transition-colors duration-300">
            {/* Top Navigation Bar */}
            <div className="sticky top-6 z-50 flex items-center justify-between bg-card/80 backdrop-blur-xl rounded-2xl p-3 px-6 border border-border shadow-lg">
                <div className="flex items-center gap-4 flex-1">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-muted-foreground">
                                <LayoutGrid className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56">
                            <DropdownMenuLabel>Quick Navigation</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                                <LayoutGrid className="mr-2 h-4 w-4" />
                                Dashboard
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push('/dashboard/query')}>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Ask AI Analyst
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push('/dashboard/customers')}>
                                <Users className="mr-2 h-4 w-4" />
                                Customers
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push('/dashboard/inventory')}>
                                <Package className="mr-2 h-4 w-4" />
                                Inventory
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push('/dashboard/data-sources')}>
                                <FileText className="mr-2 h-4 w-4" />
                                Data Sources
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    
                    <form onSubmit={handleSearch} className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                            placeholder="Ask your AI analyst anything..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none focus-visible:ring-0 text-sm pl-10 h-9 w-full"
                        />
                    </form>
                </div>
                
                <div className="flex items-center gap-3">
                    {/* Theme Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground rounded-xl h-9 w-9 border border-border hover:bg-muted transition-colors"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    >
                        {mounted && (theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />)}
                    </Button>
                    
                    {/* Connect Store Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-border bg-muted/50 hover:bg-muted h-9 px-4 gap-2 hidden md:flex"
                        onClick={() => setIsConnectorOpen(true)}
                    >
                        <Plus className="h-4 w-4" />
                        Connect Store
                    </Button>
                    
                    {/* AI Status Badge */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-xl border border-primary/20 cursor-pointer hover:bg-primary/20 transition-colors" onClick={() => router.push('/dashboard/business-brain')}>
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        <span className="text-[10px] font-bold text-primary uppercase tracking-wider">AI Active</span>
                    </div>
                    
                    {/* Settings/Integrations */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                                <Globe className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Integrations</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setIsConnectorOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Connect New Source
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push('/dashboard/data-sources')}>
                                <FileText className="mr-2 h-4 w-4" />
                                Manage Sources
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    
                    {/* Notifications */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
                                <Bell className="h-5 w-5" />
                                {briefing?.insights?.length > 0 && (
                                    <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-card"></span>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80">
                            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {briefing?.insights && briefing.insights.length > 0 ? (
                                <>
                                    {briefing.insights.slice(0, 3).map((insight: any, idx: number) => (
                                        <DropdownMenuItem key={idx} className="flex flex-col items-start p-3 cursor-pointer">
                                            <div className="flex items-center gap-2 mb-1">
                                                {insight.type === 'anomaly_alert' ? (
                                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                                ) : (
                                                    <TrendingUp className="h-4 w-4 text-green-500" />
                                                )}
                                                <span className="font-semibold text-sm">{insight.title}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2">{insight.content}</p>
                                        </DropdownMenuItem>
                                    ))}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => router.push('/dashboard/business-brain')} className="text-center justify-center">
                                        View All Insights
                                    </DropdownMenuItem>
                                </>
                            ) : (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    No new notifications
                                </div>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    
                    {/* User Avatar Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-9 w-9 rounded-full border border-border p-0 hover:ring-2 hover:ring-primary/20 transition-all">
                                <Avatar className="h-9 w-9">
                                    {user?.profilePicture && <AvatarImage src={user.profilePicture} />}
                                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                                        {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user?.name || "User"}</p>
                                    <p className="text-xs leading-none text-muted-foreground">{user?.email || "user@example.com"}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                                <LayoutGrid className="mr-2 h-4 w-4" />
                                Dashboard
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                                <Settings className="mr-2 h-4 w-4" />
                                Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950">
                                <LogOut className="mr-2 h-4 w-4" />
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* AI Executive Summary Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2">
                    <Card className="h-full border-0 shadow-2xl bg-gradient-to-br from-violet-950/50 via-background to-background relative overflow-hidden ring-1 ring-white/10">
                        {/* Ambient Background Glow */}
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                        <div className="absolute top-6 right-6 p-4 opacity-20 animate-pulse-slow">
                            <Sparkles className="h-24 w-24 text-primary" />
                        </div>

                        <CardHeader className="pb-6 relative z-10">
                            <div className="flex items-center gap-3 mb-2">
                                <Badge variant="outline" className="bg-primary/10 backdrop-blur-md border-primary/20 text-primary gap-1.5 py-1.5 px-3 rounded-full shadow-glow-sm">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    <span className="tracking-wider font-bold text-[10px]">DAILY BRIEFING</span>
                                </Badge>
                                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                    Live Updates
                                </span>
                            </div>
                            <CardTitle className="text-3xl font-bold tracking-tight text-foreground">
                                Good Morning, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-400">User</span>
                            </CardTitle>
                            <CardDescription className="text-base text-muted-foreground/80">
                                Your AI has analyzed <span className="text-foreground font-medium">14,203 data points</span> today. Here is your executive summary.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4 relative z-10">
                            {isBriefingLoading ? (
                                <div className="grid gap-3">
                                    <Skeleton className="h-24 w-full rounded-2xl" />
                                    <Skeleton className="h-24 w-full rounded-2xl" />
                                </div>
                            ) : briefing?.hasBriefing && briefing?.briefing?.executiveSummary ? (
                                <div className="grid gap-3">
                                    {/* AI Executive Summary */}
                                    <div className="bg-card/40 backdrop-blur-md p-4 rounded-2xl border border-white/5">
                                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                            {briefing.briefing.executiveSummary}
                                        </p>
                                    </div>

                                    {/* Key Metrics from Briefing */}
                                    {briefing.briefing.keyMetrics && (
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="bg-card/40 backdrop-blur-md p-3 rounded-xl border border-white/5">
                                                <p className="text-xs text-muted-foreground mb-1">Revenue</p>
                                                <p className="text-lg font-bold text-foreground">
                                                    ${briefing.briefing.keyMetrics.total_revenue?.toLocaleString() || 0}
                                                </p>
                                                {briefing.briefing.keyMetrics.revenue_change_pct !== undefined && (
                                                    <Badge
                                                        variant="secondary"
                                                        className={`mt-1 text-[10px] font-bold px-2 py-0.5 ${briefing.briefing.keyMetrics.revenue_change_pct > 0
                                                            ? 'bg-green-500/10 text-green-400'
                                                            : 'bg-red-500/10 text-red-400'
                                                            }`}
                                                    >
                                                        {briefing.briefing.keyMetrics.revenue_change_pct > 0 ? '+' : ''}
                                                        {briefing.briefing.keyMetrics.revenue_change_pct}%
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="bg-card/40 backdrop-blur-md p-3 rounded-xl border border-white/5">
                                                <p className="text-xs text-muted-foreground mb-1">Orders</p>
                                                <p className="text-lg font-bold text-foreground">
                                                    {briefing.briefing.keyMetrics.total_orders?.toLocaleString() || 0}
                                                </p>
                                            </div>
                                            <div className="bg-card/40 backdrop-blur-md p-3 rounded-xl border border-white/5">
                                                <p className="text-xs text-muted-foreground mb-1">Customers</p>
                                                <p className="text-lg font-bold text-foreground">
                                                    {briefing.briefing.keyMetrics.total_customers?.toLocaleString() || 0}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Insights Feed */}
                                    {briefing.insights && briefing.insights.length > 0 && (
                                        <>
                                            {briefing.insights.slice(0, 2).map((insight: any, idx: number) => (
                                                <div
                                                    key={idx}
                                                    className={`group flex gap-4 items-start bg-card/40 backdrop-blur-md p-4 rounded-2xl border border-white/5 hover:bg-white/5 hover:border-${insight.severity === 'critical' ? 'red' :
                                                        insight.severity === 'high' ? 'orange' :
                                                            'primary'
                                                        }-500/20 transition-all duration-300 hover:shadow-lg cursor-default`}
                                                >
                                                    <div className={`h-10 w-10 rounded-xl bg-gradient-to-br from-${insight.severity === 'critical' ? 'red' :
                                                        insight.severity === 'high' ? 'orange' :
                                                            'green'
                                                        }-500/20 to-${insight.severity === 'critical' ? 'red' :
                                                            insight.severity === 'high' ? 'orange' :
                                                                'green'
                                                        }-500/5 flex items-center justify-center shrink-0 border border-${insight.severity === 'critical' ? 'red' :
                                                            insight.severity === 'high' ? 'orange' :
                                                                'green'
                                                        }-500/20 group-hover:scale-110 transition-transform duration-300`}>
                                                        {insight.type === 'anomaly_alert' || insight.severity === 'critical' ? (
                                                            <AlertCircle className={`h-5 w-5 text-${insight.severity === 'critical' ? 'red' : 'orange'
                                                                }-400`} />
                                                        ) : (
                                                            <TrendingUp className="h-5 w-5 text-green-400" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <p className="text-sm font-bold text-foreground">{insight.title}</p>
                                                            {insight.severity && (
                                                                <Badge
                                                                    variant="secondary"
                                                                    className={`text-[10px] font-bold px-2 py-0.5 ${insight.severity === 'critical' ? 'bg-red-500/10 text-red-400' :
                                                                        insight.severity === 'high' ? 'bg-orange-500/10 text-orange-400' :
                                                                            'bg-blue-500/10 text-blue-400'
                                                                        }`}
                                                                >
                                                                    {insight.severity}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                                            {insight.content}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Sparkles className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                                    <p className="text-sm text-muted-foreground">
                                        No AI briefing available yet. Run the Daily Briefing cron job to generate insights.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-1 h-full">
                    <Card className="h-full border-0 shadow-xl bg-card/50 backdrop-blur-md relative overflow-hidden ring-1 ring-white/5 flex flex-col">
                        <CardHeader className="pb-4 border-b border-white/5">
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Activity className="h-4 w-4 text-primary" />
                                Live Pulse
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col justify-around p-6">
                            {/* Metric 1 */}
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">Total Revenue</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-3xl font-bold tracking-tight text-foreground">
                                        {isLoading ? <Skeleton className="h-8 w-24" /> : `$${(stats?.totalSales || 0).toLocaleString()}`}
                                    </span>
                                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-[10px] font-bold px-2 py-0.5">
                                        +12.5%
                                    </Badge>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-white/5 w-full" />

                            {/* Metric 2 */}
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">Active Orders</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-3xl font-bold tracking-tight text-foreground">
                                        {isLoading ? <Skeleton className="h-8 w-20" /> : (stats?.totalOrders || 0).toLocaleString()}
                                    </span>
                                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-[10px] font-bold px-2 py-0.5">
                                        +8.2%
                                    </Badge>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-white/5 w-full" />

                            {/* Metric 3 */}
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">Total Customers</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-3xl font-bold tracking-tight text-foreground">
                                        {isLoading ? <Skeleton className="h-8 w-20" /> : (stats?.totalCustomers || 0).toLocaleString()}
                                    </span>
                                    <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[10px] font-bold px-2 py-0.5">
                                        +24 new
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Top Row: Stats + Customers */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {topStats.map((stat, i) => (
                        <Card key={i} className="bg-card border-border rounded-[2rem] overflow-hidden shadow-sm">
                            <CardContent className="p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className={`h-10 w-10 rounded-2xl ${stat.bg} flex items-center justify-center`}>
                                        {stat.icon}
                                    </div>
                                    <div className="flex items-center gap-1 text-xs font-bold">
                                        {stat.trend}
                                        <TrendingUp className="h-3 w-3 text-green-500" />
                                    </div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-20" /> : stat.value}</div>
                                    <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</div>
                                </div>
                                <Badge variant="secondary" className="bg-muted text-[9px] text-muted-foreground border-none rounded-lg px-2 py-0.5">
                                    {stat.period}
                                </Badge>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <Card className="lg:col-span-4 bg-card border-border rounded-[2rem] relative overflow-hidden group shadow-sm">
                    <CardContent className="p-6 flex flex-col justify-between h-full">
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold">Total Customers</h3>
                            <Badge variant="secondary" className="bg-muted text-[10px] text-muted-foreground border-none rounded-lg">
                                Unique verified identities
                            </Badge>
                        </div>
                        <div className="mt-8">
                            <div className="text-4xl font-bold">
                                {isLoading ? <Skeleton className="h-10 w-32" /> : (stats?.totalCustomers || 0).toLocaleString()}
                                <span className="text-sm text-green-500 font-bold ml-1">+9.2%</span>
                            </div>
                        </div>
                        {/* Illustration Placeholder */}
                        <div className="absolute bottom-0 right-0 w-32 h-32 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Users className="w-full h-full text-foreground" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Middle Row: Income Chart + Report + AI Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Total Income Area Chart */}
                <Card className="lg:col-span-5 bg-card border-border rounded-[2rem] overflow-hidden shadow-sm">
                    <CardHeader className="p-6 flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-lg font-bold">Revenue Velocity</CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">Daily sales performance</p>
                        </div>
                        <Button variant="ghost" size="icon" className="text-muted-foreground">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 h-[240px]">
                        {isLoading ? <Skeleton className="h-full w-full rounded-2xl" /> : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats?.salesByDate || []}>
                                    <defs>
                                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" strokeOpacity={0.05} />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }}
                                        tickFormatter={(v) => `$${v}`}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="amount"
                                        stroke="#10b981"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorIncome)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Activity (Report) */}
                <Card className="lg:col-span-3 bg-card border-border rounded-[2rem] overflow-hidden shadow-sm">
                    <CardHeader className="p-6 flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-lg font-bold">Recent Activity</CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">Latest transactions</p>
                        </div>
                        <Button variant="ghost" size="icon" className="text-muted-foreground">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-3">
                        {isLoading ? Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />) : (
                            stats?.recentOrders?.map((order: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border hover:bg-muted/50 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                            <ShoppingBag className="h-4 w-4 text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase truncate max-w-[80px]">{order.customer_name}</p>
                                            <p className="text-sm font-bold">${order.amount}</p>
                                        </div>
                                    </div>
                                    <div className="text-[9px] font-bold text-green-500 uppercase">{order.status}</div>
                                </div>
                            ))
                        )}
                        {!isLoading && stats?.recentOrders?.length === 0 && (
                            <div className="p-10 text-center text-xs text-muted-foreground">No recent orders.</div>
                        )}
                    </CardContent>
                </Card>

                {/* AI Intelligence Feed */}
                <Card className="lg:col-span-4 bg-card border-border rounded-[2rem] overflow-hidden shadow-sm">
                    <CardHeader className="p-6 flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-lg font-bold">AI Intelligence</CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">Autonomous business insights</p>
                        </div>
                        <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-2">
                        {intelligenceFeed.length > 0 ? intelligenceFeed.map((item: any, i: number) => (
                            <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors cursor-pointer group">
                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${item.severity === 'high' || item.priority === 'critical' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                                    }`}>
                                    {item.type === 'inventory_alert' ? <Package className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold">{item.title}</span>
                                        <ArrowUpRight className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground leading-relaxed">{item.content}</p>
                                </div>
                            </div>
                        )) : (
                            <div className="p-10 text-center text-xs text-muted-foreground border-2 border-dashed border-border rounded-2xl">
                                AI is analyzing your data...
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Row: Earning Bar Chart + Plan + Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Total Earning Bar Chart */}
                <Card className="lg:col-span-4 bg-card border-border rounded-[2rem] overflow-hidden shadow-sm">
                    <CardHeader className="p-6 flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-lg font-bold">Growth Metrics</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-2xl font-bold">87%</span>
                                <div className="flex items-center text-[10px] font-bold text-green-500">
                                    <TrendingUp className="h-3 w-3" /> +38%
                                </div>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="text-muted-foreground">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-4">
                        <div className="h-[180px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData}>
                                    <Bar dataKey="value" radius={[10, 10, 10, 10]} barSize={12}>
                                        {barData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold">Total revenue</p>
                                        <p className="text-[10px] text-muted-foreground">Successful payments</p>
                                    </div>
                                </div>
                                <span className="text-xs font-bold">+${(stats?.totalSales || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Predictive Revenue Forecast */}
                <Card className="lg:col-span-4 bg-card border-border rounded-[2rem] overflow-hidden shadow-sm">
                    <CardHeader className="p-6 flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-lg font-bold">Predictive Forecast</CardTitle>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                AI-driven revenue projection for next 30 days.
                            </p>
                        </div>
                        <TrendingUp className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-4">
                        {(() => {
                            const forecast = briefing?.forecast || stats?.forecast || {};
                            // Handle different casing from different APIs
                            const projectedRevenue = forecast.projected_revenue || forecast.projectedRevenue || 0;
                            // Handle string "15%" vs number 15
                            let growthRate = forecast.growth_rate || forecast.growthRate || 0;
                            if (typeof growthRate === 'string') growthRate = parseFloat(growthRate.replace('%', ''));

                            const confidence = forecast.confidence || 0;
                            const insight = forecast.insight || "Analyzing trends...";

                            return (
                                <>
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <div className="text-3xl font-bold">
                                                {isLoading ? <Skeleton className="h-8 w-24" /> : `$${projectedRevenue.toLocaleString()}`}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Projected Revenue</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-green-500">
                                                {isLoading ? <Skeleton className="h-4 w-10 ml-auto" /> : `+${growthRate}%`}
                                            </div>
                                            <div className="text-[9px] text-muted-foreground uppercase">vs Last Month</div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                                            <span>Confidence Score</span>
                                            <span>{isLoading ? "..." : `${confidence}%`}</span>
                                        </div>
                                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary rounded-full shadow-glow transition-all duration-1000"
                                                style={{ width: isLoading ? '0%' : `${confidence}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Sparkles className="h-3 w-3 text-primary" />
                                            <span className="text-[10px] font-bold uppercase text-primary">AI Insight</span>
                                        </div>
                                        <div className="text-[10px] text-muted-foreground leading-relaxed">
                                            {isLoading ? <Skeleton className="h-10 w-full" /> : insight}
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </CardContent>
                </Card>

                {/* Customer Matrix Condition */}
                <Card className="lg:col-span-4 bg-card border-border rounded-[2rem] overflow-hidden shadow-sm">
                    <CardHeader className="p-6 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-lg font-bold">Customer Matrix</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-3">
                        {(() => {
                            const segments = briefing?.customerSegments || {};
                            const total = segments.total_customers || 1;

                            const matrixData = [
                                { label: "Champions", sub: "High value, frequent", val: segments.champions || 0, color: "text-blue-500" },
                                { label: "Loyalists", sub: "Consistent buyers", val: segments.loyalists || 0, color: "text-green-500" },
                                { label: "Potential", sub: "Recent, good value", val: segments.potential_loyalists || 0, color: "text-purple-500" },
                                { label: "At-Risk", sub: "Churn probability", val: segments.at_risk || 0, color: "text-orange-500" },
                                { label: "Hibernating", sub: "Inactive > 90d", val: segments.hibernating || 0, color: "text-yellow-500" },
                                { label: "Lost", sub: "Likely churned", val: segments.lost || 0, color: "text-red-500" },
                            ];

                            return matrixData.map((item, i) => {
                                const percentage = Math.round((item.val / total) * 100);
                                return (
                                    <div key={i} className="flex items-center justify-between group cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className="relative h-10 w-10 flex items-center justify-center">
                                                <svg className="h-10 w-10 -rotate-90">
                                                    <circle cx="20" cy="20" r="18" fill="transparent" stroke="currentColor" strokeOpacity={0.05} strokeWidth="3" />
                                                    <circle
                                                        cx="20" cy="20" r="18"
                                                        fill="transparent"
                                                        stroke="currentColor"
                                                        strokeWidth="3"
                                                        strokeDasharray={113}
                                                        strokeDashoffset={113 - (113 * percentage) / 100}
                                                        className={item.color}
                                                    />
                                                </svg>
                                                <span className="absolute text-[8px] font-bold">{percentage}%</span>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold">{item.label}</p>
                                                <p className="text-[10px] text-muted-foreground font-medium">{item.sub}</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                                            {item.val.toLocaleString()}
                                        </span>
                                    </div>
                                );
                            });
                        })()}
                    </CardContent>
                </Card>
            </div>
            <ConnectorModal open={isConnectorOpen} onOpenChange={setIsConnectorOpen} />
        </div>
    )
}
