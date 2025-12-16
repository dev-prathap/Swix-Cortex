"use client"

import * as React from "react"

interface DashboardContextType {
    isSidebarCollapsed: boolean
    toggleSidebar: () => void
    isMobileMenuOpen: boolean
    setMobileMenuOpen: (open: boolean) => void
}

const DashboardContext = React.createContext<DashboardContextType | undefined>(undefined)

export function DashboardProvider({ children }: { children: React.ReactNode }) {
    const [isSidebarCollapsed, setSidebarCollapsed] = React.useState(false)
    const [isMobileMenuOpen, setMobileMenuOpen] = React.useState(false)

    const toggleSidebar = () => {
        setSidebarCollapsed((prev) => !prev)
    }

    return (
        <DashboardContext.Provider
            value={{
                isSidebarCollapsed,
                toggleSidebar,
                isMobileMenuOpen,
                setMobileMenuOpen,
            }}
        >
            {children}
        </DashboardContext.Provider>
    )
}

export function useDashboard() {
    const context = React.useContext(DashboardContext)
    if (context === undefined) {
        throw new Error("useDashboard must be used within a DashboardProvider")
    }
    return context
}
