import { AppSidebar } from "@/components/layout/AppSidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <SidebarProvider>
            <div className="flex h-screen overflow-hidden bg-background text-foreground font-sans w-full">
                <AppSidebar />
                <SidebarInset className="bg-background flex flex-col min-h-screen">
                    <main className="flex-1 overflow-y-auto relative scroll-smooth">
                        <div className="w-full">
                            {children}
                        </div>
                    </main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    )
}
