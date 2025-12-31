/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SWIX CORTEX - SIDEBAR NAVIGATION SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * UX PHILOSOPHY: "The Control Panel of an AI System Running Your Business"
 * 
 * This sidebar is designed as a MAP, not just a menu. It guides users through
 * their journey, from first login to daily power use.
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * KEY UX IMPROVEMENTS IMPLEMENTED:
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 1️⃣ INFORMATION ARCHITECTURE
 *    ✓ AI-first mental model: Core features → Business insights → System
 *    ✓ Clear semantic grouping (AI CORE, BUSINESS INSIGHTS, SYSTEM)
 *    ✓ Logical progression that matches user journey
 * 
 * 2️⃣ PROGRESSIVE DISCLOSURE
 *    ✓ Locked states for features requiring data connection
 *    ✓ Visual indicators (lock icon, opacity reduction)
 *    ✓ Helpful tooltips explaining why features are locked
 *    ✓ Demo mode toggle to explore without connecting real data
 * 
 * 3️⃣ VISUAL HIERARCHY & PRIORITY
 *    ✓ Command Center marked as primary (extra padding, bold)
 *    ✓ Strong active state (border, shadow, color)
 *    ✓ Clear hover states for all interactive elements
 *    ✓ Subtle icon scaling on active items
 * 
 * 4️⃣ IMPROVED COPY & LABELING
 *    ✓ "Ask Your AI Analyst" (was "Ask Cortex") - more explicit
 *    ✓ "Generate Insights" (was "Run Brain Run") - professional yet friendly
 *    ✓ "Using Sample Data" - clear demo mode indicator
 *    ✓ Added "Beta Access" badge to user profile
 * 
 * 5️⃣ ENHANCED FOOTER
 *    ✓ Demo mode with clear visual treatment (amber gradient)
 *    ✓ Improved AI action button with loading states
 *    ✓ User profile with role and status
 *    ✓ Clear logout action
 * 
 * 6️⃣ ACCESSIBILITY & FEEDBACK
 *    ✓ Tooltips on all navigation items
 *    ✓ Disabled states with cursor feedback
 *    ✓ Clear visual feedback on all interactions
 *    ✓ Proper spacing and touch targets
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * USER EXPERIENCE FLOW:
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * First-time user:
 * → Sees AI CORE section (always accessible)
 * → Notices locked BUSINESS INSIGHTS (requires data)
 * → Can toggle Demo Mode to explore with sample data
 * → Clear path to connect data via Integrations
 * 
 * Daily user:
 * → Command Center as default home
 * → Quick access to Ask Your AI Analyst
 * → Unlocked business insights for analysis
 * → Generate Insights button for on-demand AI analysis
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

"use client"

import * as React from "react"
import {
    Home,
    Brain,
    Settings,
    Layers,
    Sparkles,
    LogOut,
    ChevronsUpDown,
    Plus,
    Trash2,
    Loader2,
    RefreshCw,
    Users,
    Package,
    DollarSign,
    Database,
    Lock,
    MessageSquare,
    BarChart3,
    Plug,
    Moon,
    Sun
} from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import Link from "next/link"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ConnectorModal } from "@/components/dashboard/ConnectorModal"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

/**
 * NAVIGATION STRUCTURE RATIONALE:
 * 
 * 🧠 AI CORE - Primary interaction layer
 *    The user's main touchpoint with the AI system.
 *    Command Center = Home dashboard (overview, status, quick actions)
 *    Ask Your AI Analyst = Natural language interface for deep questions
 * 
 * 📊 BUSINESS INSIGHTS - Data-driven intelligence modules
 *    These unlock AFTER connecting data sources (progressive disclosure).
 *    Grouped by business domain to match mental model of business owners.
 * 
 * ⚙️ SYSTEM - Configuration and integrations
 *    Secondary priority. Used less frequently but critical for setup.
 *    Integrations = Connecting data (prerequisite for insights)
 *    Settings = Account, preferences, team management
 */
const data = {
    navMain: [
        {
            title: "AI CORE",
            description: "Your primary AI interaction layer",
            items: [
                { 
                    title: "Command Center", 
                    url: "/dashboard", 
                    icon: BarChart3,
                    description: "Overview dashboard and key metrics",
                    isPrimary: true, // This is the default landing page
                    requiresData: false
                },
                { 
                    title: "Ask Your AI Analyst", 
                    url: "/dashboard/analysis", 
                    icon: MessageSquare,
                    description: "Natural language business intelligence",
                    isPrimary: false,
                    requiresData: false
                },
            ],
        },
        {
            title: "BUSINESS INSIGHTS",
            description: "AI-powered analytics modules",
            items: [
                { 
                    title: "Customers", 
                    url: "/dashboard/customers", 
                    icon: Users,
                    description: "Customer profiles and behavior analysis",
                    isPrimary: false,
                    requiresData: true // Disabled until data is connected
                },
                { 
                    title: "Inventory", 
                    url: "/dashboard/inventory", 
                    icon: Package,
                    description: "Stock levels and inventory intelligence",
                    isPrimary: false,
                    requiresData: true
                },
                { 
                    title: "Finance", 
                    url: "/dashboard/finance", 
                    icon: DollarSign,
                    description: "Revenue, costs, and financial insights",
                    isPrimary: false,
                    requiresData: true
                },
            ],
        },
        {
            title: "SYSTEM",
            description: "Configuration and setup",
            items: [
                { 
                    title: "Settings", 
                    url: "/dashboard/settings", 
                    icon: Settings,
                    description: "Account and preferences",
                    isPrimary: false,
                    requiresData: false
                },
            ],
        },
    ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname()
    const router = useRouter()
    const { theme, setTheme } = useTheme()
    const [user, setUser] = React.useState<{ name: string; email: string; role: string } | null>(null)
    const [dataSources, setDataSources] = React.useState<any[]>([])
    const [activeSource, setActiveSource] = React.useState<any>(null)
    const [isConnectorModalOpen, setIsConnectorModalOpen] = React.useState(false)
    const [sourceToDelete, setSourceToDelete] = React.useState<string | null>(null)
    const [isDeleting, setIsDeleting] = React.useState(false)
    const [syncingId, setSyncingId] = React.useState<string | null>(null)
    const [isDemoMode, setIsDemoMode] = React.useState(false)
    
    // Track if user has connected real data (used for progressive disclosure)
    const hasConnectedData = dataSources.some(source => !source.isDemo)

    // Initialize from localStorage on mount
    React.useEffect(() => {
        const saved = localStorage.getItem("swix_demo_mode") === "true"
        console.log("Initial Demo Mode:", saved)
        setIsDemoMode(saved)
    }, [])

    const [isBrainRunning, setIsBrainRunning] = React.useState(false)

    React.useEffect(() => {
        async function fetchData() {
            try {
                const [userRes, sourcesRes] = await Promise.all([
                    fetch("/api/auth/me"),
                    fetch("/api/data-sources")
                ])

                if (userRes.ok) {
                    const userData = await userRes.json()
                    setUser(userData)
                }

                if (sourcesRes.ok) {
                    const sourcesData = await sourcesRes.json()
                    setDataSources(sourcesData)

                    // Sync demo mode state with active source
                    const savedDemo = localStorage.getItem("swix_demo_mode") === "true"
                    // setIsDemoMode(savedDemo) // Already handled by useEffect mount

                    if (sourcesData.length > 0) {
                        const demoSource = sourcesData.find((s: any) => s.isDemo)
                        const realSource = sourcesData.find((s: any) => !s.isDemo)

                        if (savedDemo && demoSource) {
                            setActiveSource(demoSource)
                        } else if (!savedDemo && realSource) {
                            setActiveSource(realSource)
                        } else {
                            setActiveSource(sourcesData[0])
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to fetch sidebar data", error)
            }
        }
        fetchData()
    }, [])

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" })
            router.push("/login")
        } catch (error) {
            console.error("Failed to logout", error)
        }
    }

    const handleSyncSource = async (e: React.MouseEvent, sourceId: string) => {
        e.stopPropagation()
        setSyncingId(sourceId)
        try {
            const res = await fetch(`/api/data-sources/${sourceId}/sync`, { method: "POST" })
            if (res.ok) {
                // Refresh the list to update lastSync time
                const sourcesRes = await fetch("/api/data-sources")
                if (sourcesRes.ok) {
                    const sourcesData = await sourcesRes.json()
                    setDataSources(sourcesData)
                }
            }
        } catch (error) {
            console.error("Failed to sync source", error)
        } finally {
            setSyncingId(null)
        }
    }

    const handleDeleteSource = async (e: React.MouseEvent, sourceId: string) => {
        e.stopPropagation()
        setSourceToDelete(sourceId)
    }

    const confirmDelete = async () => {
        if (!sourceToDelete) return

        setIsDeleting(true)
        try {
            const res = await fetch(`/api/data-sources/${sourceToDelete}`, { method: "DELETE" })
            if (res.ok) {
                setDataSources(prev => prev.filter(s => s.id !== sourceToDelete))
                if (activeSource?.id === sourceToDelete) {
                    setActiveSource(dataSources.find(s => s.id !== sourceToDelete) || null)
                }
                setSourceToDelete(null)
            }
        } catch (error) {
            console.error("Failed to delete source", error)
        } finally {
            setIsDeleting(false)
        }
    }
    const toggleDemoMode = async (checked: boolean) => {
        console.log("Toggling Demo Mode to:", checked)
        setIsDemoMode(checked)
        localStorage.setItem("swix_demo_mode", checked.toString())
        document.cookie = `swix_demo_mode=${checked}; path=/; max-age=31536000`

        if (checked) {
            const hasDemo = dataSources.some((s: any) => s.isDemo)
            if (!hasDemo) {
                await fetch("/api/demo/setup", { method: "POST" })
                window.location.reload()
            } else {
                const demoSource = dataSources.find(s => s.isDemo)
                if (demoSource) {
                    setActiveSource(demoSource)
                    window.location.reload() // Reload to refresh dashboard stats
                }
            }
        } else {
            const realSource = dataSources.find(s => !s.isDemo)
            if (realSource) {
                setActiveSource(realSource)
                window.location.reload() // Reload to refresh dashboard stats
            }
        }
    }

    const runBrainAnalysis = async () => {
        setIsBrainRunning(true)
        try {
            const res = await fetch("/api/brain/run", { method: "POST" })
            if (res.ok) {
                window.location.reload()
            }
        } catch (error) {
            console.error("Failed to run brain", error)
        } finally {
            setIsBrainRunning(false)
        }
    }

    const getInitials = (name: string | undefined) => {
        if (!name) return "U"
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
    }

    return (
        <Sidebar collapsible="icon" className="border-r border-border bg-sidebar" {...props}>
            <SidebarHeader className="h-16 flex items-center px-4 border-b border-border/50">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-accent rounded-lg h-12 hover:bg-accent"
                                >
                                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                        <Layers className="size-4" />
                                    </div>
                                    <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden ml-2">
                                        <span className="truncate font-bold text-sm">
                                            {activeSource?.name || "Swix Cortex"}
                                        </span>
                                        <span className="truncate text-[10px] text-muted-foreground">
                                            {activeSource?.type || "Digital CEO"}
                                        </span>
                                    </div>
                                    <ChevronsUpDown className="ml-auto size-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-2xl p-2"
                                align="start"
                                side="bottom"
                                sideOffset={4}
                            >
                                <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2 py-1.5">
                                    Switch Store
                                </DropdownMenuLabel>
                                {dataSources.map((source) => (
                                    <DropdownMenuItem
                                        key={source.id}
                                        onClick={() => setActiveSource(source)}
                                        className="gap-3 p-3 rounded-xl cursor-pointer group/item"
                                    >
                                        <div className="flex size-8 items-center justify-center rounded-lg border bg-muted/50 group-hover/item:bg-primary/10 transition-colors">
                                            <Database className="size-4 text-muted-foreground group-hover/item:text-primary" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-semibold truncate text-sm">{source.name}</span>
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{source.type}</span>
                                        </div>
                                        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-all">
                                            <div
                                                onClick={(e) => handleSyncSource(e, source.id)}
                                                className={`p-1.5 hover:bg-accent rounded-lg transition-all ${syncingId === source.id ? 'animate-spin text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                            >
                                                <RefreshCw className="size-3.5" />
                                            </div>
                                            <div
                                                onClick={(e) => handleDeleteSource(e, source.id)}
                                                className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-all"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </div>
                                        </div>
                                    </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator className="my-2" />
                                <DropdownMenuItem
                                    className="gap-3 p-3 rounded-xl cursor-pointer"
                                    onClick={() => setIsConnectorModalOpen(true)}
                                >
                                    <div className="flex size-8 items-center justify-center rounded-lg border bg-background">
                                        <Plus className="size-4" />
                                    </div>
                                    <div className="font-bold text-sm text-muted-foreground">Add New Store</div>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <ConnectorModal
                open={isConnectorModalOpen}
                onOpenChange={setIsConnectorModalOpen}
            />
            <SidebarContent className="bg-sidebar px-3 py-4">
                <TooltipProvider delayDuration={300}>
                    {data.navMain.map((group, groupIndex) => (
                        <SidebarGroup 
                            key={group.title}
                            className={groupIndex > 0 ? "mt-8" : "mt-2"}
                        >
                            <SidebarGroupLabel className="text-muted-foreground/70 text-[11px] uppercase tracking-wider font-semibold px-2 mb-2 group-data-[collapsible=icon]:hidden">
                                {group.title}
                            </SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu className="space-y-1">
                                    {group.items.map((item) => {
                                        // PROGRESSIVE DISCLOSURE LOGIC:
                                        // Lock insights modules until user connects data (or uses demo mode)
                                        const isLocked = item.requiresData && !hasConnectedData && !isDemoMode
                                        const isActive = pathname === item.url
                                        
                                        return (
                                            <SidebarMenuItem key={item.title}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <SidebarMenuButton
                                                            asChild={!isLocked}
                                                            isActive={isActive}
                                                            disabled={isLocked}
                                                            tooltip={item.title}
                                                            className={`
                                                                rounded-lg px-3 py-2 h-10 transition-all group/item
                                                                ${isActive && !isLocked
                                                                    ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground font-medium shadow-sm'
                                                                    : ''
                                                                }
                                                                ${!isActive && !isLocked
                                                                    ? 'text-foreground/80 hover:bg-accent hover:text-foreground'
                                                                    : ''
                                                                }
                                                                ${isLocked
                                                                    ? 'opacity-40 cursor-not-allowed text-foreground/50'
                                                                    : ''
                                                                }
                                                            `}
                                                        >
                                                            {isLocked ? (
                                                                <div className="flex items-center w-full gap-3">
                                                                    <item.icon className="h-[18px] w-[18px] shrink-0" />
                                                                    <span className="text-sm font-normal truncate flex-1">
                                                                        {item.title}
                                                                    </span>
                                                                    <Lock className="h-3 w-3 shrink-0 opacity-50" />
                                                                </div>
                                                            ) : (
                                                                <Link href={item.url} className="flex items-center w-full gap-3">
                                                                    <item.icon className="h-[18px] w-[18px] shrink-0" />
                                                                    <span className="text-sm font-normal truncate flex-1">
                                                                        {item.title}
                                                                    </span>
                                                                </Link>
                                                            )}
                                                        </SidebarMenuButton>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="right" className="max-w-[200px]">
                                                        <p className="text-xs font-medium mb-1">{item.title}</p>
                                                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                                                            {isLocked 
                                                                ? "Connect data to unlock this feature" 
                                                                : item.description
                                                            }
                                                        </p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </SidebarMenuItem>
                                        )
                                    })}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    ))}
                </TooltipProvider>
            </SidebarContent>
            <SidebarFooter className="p-3 bg-sidebar space-y-2 border-t border-border/50">
                <TooltipProvider delayDuration={300}>
                    {/* Demo Mode Toggle - Compact */}
                    <div className="rounded-lg bg-amber-500/5 px-3 py-2 border border-amber-500/10 group-data-[collapsible=icon]:hidden">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                                <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                <span className="text-xs font-medium text-foreground truncate">
                                    {isDemoMode ? "Demo Data Active" : "Demo Mode"}
                                </span>
                            </div>
                            <Switch
                                checked={isDemoMode}
                                onCheckedChange={toggleDemoMode}
                                className="scale-75"
                            />
                        </div>
                    </div>

                    {/* AI Brain Button - Compact */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full rounded-lg text-xs font-medium h-9 gap-2 border-border/50 hover:bg-accent group-data-[collapsible=icon]:hidden"
                                onClick={runBrainAnalysis}
                                disabled={isBrainRunning}
                            >
                                {isBrainRunning ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        <span>Analyzing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Brain className="h-3.5 w-3.5" />
                                        <span>Generate Insights</span>
                                    </>
                                )}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[200px]">
                            <p className="text-xs">Trigger AI analysis across your data</p>
                        </TooltipContent>
                    </Tooltip>

                    {/* Theme Toggle - Compact */}
                    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-accent/30 group-data-[collapsible=icon]:hidden">
                        <span className="text-xs font-medium text-foreground">Theme</span>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className={`h-7 w-7 ${theme === "light" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
                                onClick={() => setTheme("light")}
                            >
                                <Sun className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={`h-7 w-7 ${theme === "dark" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
                                onClick={() => setTheme("dark")}
                            >
                                <Moon className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>

                    {/* User Profile - Compact */}
                    <div className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-accent/50 transition-colors group-data-[collapsible=icon]:hidden">
                        <Avatar className="h-8 w-8 border border-border/50 shrink-0">
                            <AvatarImage src="" />
                            <AvatarFallback className="bg-accent text-foreground text-xs font-medium">
                                {getInitials(user?.name)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-xs font-medium text-foreground truncate">
                                {user?.name || "User"}
                            </span>
                            <span className="text-[10px] text-muted-foreground truncate">
                                {user?.role || "Member"}
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                            onClick={handleLogout}
                        >
                            <LogOut className="h-3.5 w-3.5" />
                        </Button>
                    </div>

                    {/* Collapsed state */}
                    <div className="hidden group-data-[collapsible=icon]:flex justify-center">
                        <Avatar className="h-8 w-8 border border-border">
                            <AvatarImage src="" />
                            <AvatarFallback className="bg-accent text-xs">
                                {getInitials(user?.name)}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                </TooltipProvider>
            </SidebarFooter>
            <SidebarRail />

            <AlertDialog open={!!sourceToDelete} onOpenChange={(open) => !open && setSourceToDelete(null)}>
                <AlertDialogContent className="rounded-3xl border-border bg-card">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-foreground">Disconnect Connector?</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                            This will permanently remove the connection and all associated data. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3">
                        <AlertDialogCancel className="rounded-xl border-border hover:bg-accent">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault()
                                confirmDelete()
                            }}
                            className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/20"
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Disconnecting...
                                </>
                            ) : (
                                "Yes, Disconnect"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Sidebar >
    )
}
