"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useDashboard } from "@/components/providers/dashboard-provider"
import {
    Home,
    Database,
    Terminal,
    BarChart,
    Settings,
    Sparkles,
    PieChart,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Layers,
    Brain,
    Calculator,
    Plug
} from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface SidebarItemProps {
    icon: React.ElementType
    label: string
    href: string
    isCollapsed: boolean
}

function SidebarItem({ icon: Icon, label, href, isCollapsed }: SidebarItemProps) {
    const pathname = usePathname()
    const isActive = pathname === href

    if (isCollapsed) {
        return (
            <TooltipProvider>
                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                        <Link
                            href={href}
                            className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-glow"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            <span className="sr-only">{label}</span>
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="flex items-center gap-4">
                        {label}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
    }

    return (
        <Link
            href={href}
            className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all",
                isActive
                    ? "bg-white/10 text-white font-medium"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
            )}
        >
            <Icon className="h-4 w-4" />
            <span className="text-sm">{label}</span>
        </Link>
    )
}

const sidebarGroups = [
    {
        label: "Overview",
        items: [
            { icon: Home, label: "Dashboard", href: "/dashboard" },
        ]
    },
    {
        label: "Analytics",
        items: [
            { icon: Database, label: "Data Sources", href: "/dashboard/data-sources" },
            { icon: Brain, label: "Business Brain", href: "/dashboard/business-brain" },
            { icon: Calculator, label: "Metric Store", href: "/dashboard/metrics" },
            // { icon: Terminal, label: "Query Lab", href: "/dashboard/query" },
            { icon: PieChart, label: "Analysis", href: "/dashboard/analysis" },
            { icon: BarChart, label: "Reports", href: "/dashboard/reports" },
        ]
    },
    {
        label: "System",
        items: [
            { icon: Settings, label: "Settings", href: "/dashboard/settings" },
        ]
    }
]

export function Sidebar() {
    const { isSidebarCollapsed, toggleSidebar, isMobileMenuOpen, setMobileMenuOpen } = useDashboard()
    const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null)
    const router = useRouter()

    useEffect(() => {
        async function fetchUser() {
            try {
                const res = await fetch("/api/auth/me")
                if (res.ok) {
                    const data = await res.json()
                    setUser(data)
                }
            } catch (error) {
                console.error("Failed to fetch user", error)
            }
        }
        fetchUser()
    }, [])

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" })
            router.push("/login")
        } catch (error) {
            console.error("Failed to logout", error)
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

    const SidebarContent = () => (
        <div className="flex h-full flex-col bg-[#050505] border-r border-white/5">
            {/* Header */}
            <div className={cn("flex h-20 items-center px-6", isSidebarCollapsed ? "justify-center" : "justify-between")}>
                {!isSidebarCollapsed && (
                    <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black">
                            <Layers className="h-5 w-5" />
                        </div>
                        <span className="text-white">
                            SWIX
                        </span>
                    </div>
                )}
                {isSidebarCollapsed && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black">
                        <Layers className="h-5 w-5" />
                    </div>
                )}
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1 py-4">
                <nav className="grid gap-6 px-2">
                    {sidebarGroups.map((group, index) => (
                        <div key={index} className="px-2">
                            {!isSidebarCollapsed && (
                                <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                                    {group.label}
                                </h3>
                            )}
                            <div className="grid gap-1">
                                {group.items.map((item) => (
                                    <SidebarItem
                                        key={item.href}
                                        icon={item.icon}
                                        label={item.label}
                                        href={item.href}
                                        isCollapsed={isSidebarCollapsed}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>
            </ScrollArea>

            {/* Footer */}
            <div className="p-4 space-y-4">
                {!isSidebarCollapsed && (
                    <div className="rounded-2xl bg-white/5 p-4 border border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-4 w-4 text-yellow-400" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pro Status</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                            Your AI agents are optimized and ready.
                        </p>
                    </div>
                )}

                <div className={cn("flex items-center gap-3 px-2", isSidebarCollapsed ? "justify-center" : "")}>
                    <Avatar className="h-8 w-8 border border-white/10">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-white/10 text-white text-xs">{getInitials(user?.name)}</AvatarFallback>
                    </Avatar>
                    {!isSidebarCollapsed && (
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium text-white truncate">{user?.name || "User"}</span>
                            <span className="text-[10px] text-slate-500 capitalize">{user?.role || "Member"}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )

    return (
        <>
            {/* Desktop Sidebar */}
            <aside
                className={cn(
                    "hidden lg:flex h-screen flex-col border-r border-border bg-background transition-all duration-300 ease-in-out",
                    isSidebarCollapsed ? "w-20" : "w-72"
                )}
            >
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetContent side="left" className="p-0 w-72 border-r border-border bg-background p-0">
                    <SidebarContent />
                </SheetContent>
            </Sheet>
        </>
    )
}
