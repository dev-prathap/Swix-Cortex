import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { DashboardProvider } from "@/components/providers/dashboard-provider"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <DashboardProvider>
            <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark font-sans transition-colors duration-300">
                <div className="fixed inset-0 neural-bg pointer-events-none z-0"></div>

                {/* Sidebar (Desktop & Mobile Sheet) */}
                <Sidebar />

                {/* Main Content Area */}
                <div className="flex flex-1 flex-col overflow-hidden relative z-10">
                    <Header />
                    <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative scroll-smooth">
                        <div className="mx-auto max-w-7xl w-full">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </DashboardProvider>
    )
}
