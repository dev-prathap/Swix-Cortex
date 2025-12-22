"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
    Layers
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
                "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:text-foreground",
                isActive
                    ? "bg-gradient-to-r from-primary/10 to-primary/5 text-primary font-medium border-l-2 border-primary"
                    : "text-muted-foreground hover:bg-muted"
            )}
        >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
            {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(37,99,235,0.6)]"></div>
            )}
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

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
    }

    const SidebarContent = () => (
        <div className="flex h-full flex-col bg-surface-light dark:bg-[#0F172A] border-r border-border">
            {/* Header */}
            <div className={cn("flex h-16 items-center border-b border-border px-4", isSidebarCollapsed ? "justify-center" : "justify-between")}>
                {!isSidebarCollapsed && (
                    <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <Layers className="h-5 w-5" />
                        </div>
                        <span className="bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                            SWIX
                        </span>
                    </div>
                )}
                {isSidebarCollapsed && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Layers className="h-5 w-5" />
                    </div>
                )}

                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("hidden lg:flex h-8 w-8", isSidebarCollapsed && "hidden")}
                    onClick={toggleSidebar}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
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
            <div className="border-t border-border p-4">
                {!isSidebarCollapsed ? (
                    <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-4 text-white shadow-lg relative overflow-hidden group">
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-4 w-4 text-yellow-300" />
                            <span className="text-xs font-bold uppercase tracking-wider opacity-90">Pro Plan</span>
                        </div>
                        <p className="text-xs opacity-90 mb-3">
                            AI Models are running at 100% efficiency.
                        </p>
                        <Button size="sm" variant="secondary" className="w-full bg-white/20 hover:bg-white/30 border-none text-white h-7 text-xs">
                            View Usage
                        </Button>
                    </div>
                ) : (
                    <div className="flex justify-center">
                        <TooltipProvider>
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg text-muted-foreground hover:bg-muted">
                                        <Sparkles className="h-5 w-5 text-purple-500" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right">AI Status: Online</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                )}

                <div className={cn("mt-4 flex items-center", isSidebarCollapsed ? "justify-center" : "justify-between")}>
                    {!isSidebarCollapsed && (
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                                {user ? getInitials(user.name) : "U"}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium truncate max-w-[120px]">{user?.name || "User"}</span>
                                <span className="text-xs text-muted-foreground capitalize">{user?.role || "Member"}</span>
                            </div>
                        </div>
                    )}
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={handleLogout}>
                        <LogOut className="h-4 w-4" />
                    </Button>
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
