"use client"

import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Brain, LayoutDashboard, Database, FileText, Settings, Upload, MessageSquare, BarChart3, LogOut, Sparkles, User, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function AnalystLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const pathname = usePathname()
    
    // Check if we're on a query page (full-screen split view)
    const isQueryPage = pathname?.includes('/query')

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        router.push('/login')
    }

    // Navigation items
    const navItems = [
        { 
            href: '/analyst', 
            label: 'Dashboard', 
            icon: LayoutDashboard,
            isActive: pathname === '/analyst'
        },
        { 
            href: '/analyst/datasets', 
            label: 'Datasets', 
            icon: Database,
            isActive: pathname?.startsWith('/analyst/datasets') && !pathname?.includes('/query')
        },
        { 
            href: '/analyst/upload', 
            label: 'Upload', 
            icon: Upload,
            isActive: pathname === '/analyst/upload'
        },
        { 
            href: '/analyst/reports', 
            label: 'Reports', 
            icon: FileText,
            isActive: pathname === '/analyst/reports'
        },
    ]

    // Full-screen layout for query pages
    if (isQueryPage) {
        return <>{children}</>
    }

    // Regular layout with sidebar
    return (
        <div className="flex h-screen bg-slate-50">
            {/* Sidebar */}
            <aside className="w-[260px] bg-white border-r border-slate-200 flex flex-col">
                {/* Logo / Brand */}
                <div className="h-16 flex items-center px-6 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-sm">
                            <Brain className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-base font-semibold text-slate-900">SWIX AI</h1>
                            <p className="text-xs text-slate-500">Data Analyst</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        return (
                            <Link key={item.href} href={item.href}>
                                <button
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                                        item.isActive
                                            ? "bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 shadow-sm"
                                            : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                    )}
                                >
                                    <Icon className={cn(
                                        "h-4 w-4 flex-shrink-0",
                                        item.isActive ? "text-purple-600" : "text-slate-500"
                                    )} />
                                    <span className="flex-1 text-left">{item.label}</span>
                                    {item.isActive && (
                                        <div className="h-1.5 w-1.5 rounded-full bg-purple-600" />
                                    )}
                                </button>
                            </Link>
                        )
                    })}

                    {/* AI Tools Section */}
                    <div className="pt-4 mt-4 border-t border-slate-200">
                        <div className="px-3 py-2">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                AI Tools
                            </p>
                        </div>
                        <button
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all group"
                        >
                            <Sparkles className="h-4 w-4 text-slate-500 group-hover:text-purple-500" />
                            <span className="flex-1 text-left">Quick Insights</span>
                            <ChevronRight className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                        <button
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all group"
                        >
                            <BarChart3 className="h-4 w-4 text-slate-500 group-hover:text-purple-500" />
                            <span className="flex-1 text-left">Analytics</span>
                            <ChevronRight className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    </div>
                </nav>

                {/* User Profile & Settings */}
                <div className="border-t border-slate-200 p-3 space-y-1">
                    <button
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all"
                    >
                        <Settings className="h-4 w-4 text-slate-500" />
                        <span className="flex-1 text-left">Settings</span>
                    </button>
                    
                    {/* User Profile */}
                    <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-slate-50 mt-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center">
                            <User className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">User</p>
                            <p className="text-xs text-slate-500 truncate">user@example.com</p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
                    >
                        <LogOut className="h-4 w-4" />
                        <span className="flex-1 text-left">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-slate-50">
                {children}
            </main>
        </div>
    )
}

