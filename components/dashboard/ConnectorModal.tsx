"use client"

import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
    ShoppingBag,
    Store,
    CreditCard,
    BarChart3,
    Facebook,
    Box,
    Globe,
    ArrowRight,
    CheckCircle2,
    ArrowLeft,
    Loader2,
    ExternalLink,
    Clock
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"

// UX: Value-driven descriptions (not technical)
// Each connector explains WHAT the AI will do, not just what it connects to
const connectors = [
    {
        id: "shopify",
        name: "Shopify",
        description: "AI analyzes sales, customers, and inventory trends",
        icon: ShoppingBag,
        color: "text-green-500",
        bg: "bg-green-500/10",
        border: "border-green-500/20",
        status: "recommended", // UX: "Recommended" feels stronger than "popular"
        setupTime: "2 min"
    },
    {
        id: "woocommerce",
        name: "WooCommerce",
        description: "Turn WordPress store data into growth insights",
        icon: Store,
        color: "text-purple-500",
        bg: "bg-purple-500/10",
        border: "border-purple-500/20",
        status: "recommended",
        setupTime: "2 min"
    },
    {
        id: "stripe",
        name: "Stripe",
        description: "Revenue analytics and payment intelligence",
        icon: CreditCard,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
        comingSoon: true
    },
    {
        id: "google-analytics",
        name: "Google Analytics",
        description: "Web traffic insights and conversion tracking",
        icon: BarChart3,
        color: "text-yellow-500",
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/20",
        comingSoon: true
    },
    {
        id: "facebook-ads",
        name: "Facebook Ads",
        description: "Ad performance and ROAS optimization",
        icon: Facebook,
        color: "text-blue-600",
        bg: "bg-blue-600/10",
        border: "border-blue-600/20",
        comingSoon: true
    },
    {
        id: "amazon",
        name: "Amazon Seller Central",
        description: "Marketplace analytics and inventory forecasting",
        icon: Box,
        color: "text-orange-500",
        bg: "bg-orange-500/10",
        border: "border-orange-500/20",
        comingSoon: true
    },
    {
        id: "custom",
        name: "Custom API",
        description: "Connect any data source via REST API or webhooks",
        icon: Globe,
        color: "text-slate-400",
        bg: "bg-slate-400/10",
        border: "border-slate-400/20",
        comingSoon: true
    }
]

interface ConnectorModalProps {
    trigger?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function ConnectorModal({ trigger, open, onOpenChange }: ConnectorModalProps) {
    const [selected, setSelected] = React.useState<string | null>(null)
    const [step, setStep] = React.useState(1)
    const [loading, setLoading] = React.useState(false)
    const { toast } = useToast()
    const [formData, setFormData] = React.useState({
        storeUrl: "",
        apiKey: "",
        apiSecret: "",
        name: ""
    })

    const selectedConnector = connectors.find(c => c.id === selected)

    const handleContinue = () => {
        if (step === 1 && selected) {
            setStep(2)
            setFormData(prev => ({ ...prev, name: selectedConnector?.name || "" }))
        }
    }

    const handleBack = () => {
        setStep(1)
    }

    const [syncProgress, setSyncProgress] = React.useState(0)

    const handleConnect = async () => {
        setLoading(true)
        try {
            let res;
            if (selected === 'shopify') {
                res = await fetch("/api/connectors/shopify", {
                    method: "POST",
                    body: JSON.stringify({
                        name: formData.name || "Shopify Store",
                        shopName: formData.storeUrl,
                        accessToken: formData.apiKey
                    }),
                });
            } else if (selected === 'woocommerce') {
                res = await fetch("/api/connectors/woocommerce", {
                    method: "POST",
                    body: JSON.stringify({
                        name: formData.name || "WooCommerce Store",
                        url: formData.storeUrl,
                        consumerKey: formData.apiKey,
                        consumerSecret: formData.apiSecret
                    }),
                });
            } else if (selected === 'stripe') {
                res = await fetch("/api/connectors/stripe", {
                    method: "POST",
                    body: JSON.stringify({
                        name: formData.name || "Stripe Account",
                        apiKey: formData.apiKey
                    }),
                });
            }

            if (res?.ok) {
                const dataSource = await res.json()

                toast({
                    title: "Success!",
                    description: `${selectedConnector?.name} connected successfully. Starting initial sync...`,
                })

                // Trigger initial sync
                console.log("Triggering initial sync for:", dataSource.id)
                fetch(`/api/data-sources/${dataSource.id}/sync`, { method: "POST" })
                    .then(r => console.log("Sync trigger response:", r.status))
                    .catch(err => console.error("Initial sync trigger failed:", err))

                // Simulate sync progress
                let progress = 0
                const interval = setInterval(() => {
                    progress += Math.floor(Math.random() * 15) + 5
                    if (progress > 100) progress = 100
                    setSyncProgress(progress)

                    if (progress === 100) {
                        clearInterval(interval)
                        setTimeout(() => {
                            onOpenChange?.(false)
                            setStep(1)
                            setSelected(null)
                            setFormData({ storeUrl: "", apiKey: "", apiSecret: "", name: "" })
                            setSyncProgress(0)
                            window.location.reload()
                        }, 500)
                    }
                }, 800)

            } else {
                const errorData = await res?.json()
                throw new Error(errorData?.error || "Failed to connect")
            }
        } catch (error: any) {
            toast({
                title: "Connection Failed",
                description: error.message,
                variant: "destructive",
            })
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            onOpenChange?.(val)
            if (!val) {
                setTimeout(() => {
                    setStep(1)
                    setSelected(null)
                }, 300)
            }
        }}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            {/* UX: Responsive modal container - viewport-aware height management */}
            <DialogContent className={cn(
                "p-0 overflow-hidden shadow-2xl bg-card border-border",
                // Responsive width: full mobile, centered desktop
                "w-[calc(100vw-2rem)] sm:max-w-[540px] md:max-w-[600px]",
                // Responsive height: viewport-aware, never overflow
                "max-h-[90vh] sm:max-h-[85vh] md:max-h-[80vh]",
                // Rounded corners (smaller on mobile for edge-to-edge feel)
                "rounded-2xl sm:rounded-3xl",
                // Flex container for sticky header/footer pattern
                "flex flex-col"
            )}>

                {/* UX: Sticky Header - always visible, doesn't scroll away */}
                <div className="flex-shrink-0 px-4 py-4 sm:p-6 sm:pb-5 border-b border-border/50 bg-gradient-to-b from-accent/20 to-transparent">
                    <DialogHeader>
                        <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                            {step === 2 && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={handleBack} 
                                    className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl hover:bg-accent/50 flex-shrink-0"
                                >
                                    <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </Button>
                            )}
                            <div className="flex-1 min-w-0">
                                {/* Responsive title sizing */}
                                <DialogTitle className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-foreground truncate">
                                    {step === 1 ? "Connect Your Data Source" : `Setup ${selectedConnector?.name}`}
                                </DialogTitle>
                                {/* Responsive description - hide on very small screens */}
                                <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-1.5 leading-relaxed line-clamp-2">
                                    {step === 1
                                        ? "Choose what data your AI analyst will learn from. Connection is read-only and secure."
                                        : `This will activate AI analysis for your ${selectedConnector?.name} data. Takes about 2 minutes.`}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                {/* UX: Scrollable Content Area - internal scroll, not page scroll */}
                {step === 1 && (
                    <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 sm:p-6 space-y-4 sm:space-y-6">
                        {/* UX: Section 1 - Recommended Connectors (Active, Top Priority) */}
                        <div className="space-y-2 sm:space-y-3">
                            <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                                <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    Recommended for You
                                </h3>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-2.5 sm:gap-3">
                                {connectors
                                    .filter(c => c.status === "recommended")
                                    .map((connector) => (
                                        <div
                                            key={connector.id}
                                            onClick={() => setSelected(connector.id)}
                                            className={cn(
                                                "group relative flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer",
                                                // Touch-friendly min height on mobile
                                                "min-h-[80px] sm:min-h-0",
                                                selected === connector.id
                                                    ? `${connector.border} bg-gradient-to-br from-${connector.bg} to-transparent shadow-lg`
                                                    : "border-border/50 bg-card/50 hover:border-border hover:bg-accent/30 hover:shadow-md active:scale-[0.99]"
                                            )}
                                        >
                                            {/* Icon - responsive sizing */}
                                            <div className={cn(
                                                "p-2 sm:p-3 rounded-lg sm:rounded-xl shrink-0 transition-all duration-200",
                                                connector.bg,
                                                selected === connector.id ? "shadow-md" : "group-hover:scale-105"
                                            )}>
                                                <connector.icon className={cn("h-5 w-5 sm:h-6 sm:w-6", connector.color)} />
                                            </div>

                                            {/* Content - responsive text sizing */}
                                            <div className="flex-1 min-w-0 pt-0 sm:pt-0.5">
                                                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-1.5 flex-wrap">
                                                    <h4 className="font-bold text-xs sm:text-sm text-foreground">{connector.name}</h4>
                                                    <span className={cn(
                                                        "text-[8px] sm:text-[9px] font-bold uppercase px-1.5 sm:px-2 py-0.5 rounded-md flex-shrink-0",
                                                        "bg-primary/10 text-primary border border-primary/20"
                                                    )}>
                                                        Recommended
                                                    </span>
                                                </div>
                                                
                                                {/* UX: Value-driven description - responsive text */}
                                                <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed mb-1.5 sm:mb-2 line-clamp-2">
                                                    {connector.description}
                                                </p>

                                                {/* UX: Quick setup time indicator */}
                                                <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] text-muted-foreground">
                                                    <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                                    <span>{connector.setupTime} setup</span>
                                                </div>
                                            </div>

                                            {/* Selection indicator - responsive positioning */}
                                            {selected === connector.id && (
                                                <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                                                    <CheckCircle2 className={cn("h-4 w-4 sm:h-5 sm:w-5", connector.color)} />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {/* UX: Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border/50" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-card px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    More Integrations
                                </span>
                            </div>
                        </div>

                        {/* UX: Section 2 - Coming Soon (Visually Dimmed, Non-Interactive) */}
                        <div className="space-y-2 sm:space-y-3">
                            {/* Responsive grid: 1 column on mobile, 2 on tablet+ */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                                {connectors
                                    .filter(c => c.comingSoon)
                                    .map((connector) => (
                                        <div
                                            key={connector.id}
                                            className={cn(
                                                "relative flex flex-col items-start gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-xl border transition-all",
                                                "opacity-50 cursor-not-allowed border-border/30 bg-muted/20",
                                                // Compact height on mobile
                                                "min-h-[100px] sm:min-h-0"
                                            )}
                                            title="Coming soon"
                                        >
                                            <div className={cn("p-2 sm:p-2.5 rounded-lg shrink-0", connector.bg)}>
                                                <connector.icon className={cn("h-4 w-4 sm:h-5 sm:w-5", connector.color)} />
                                            </div>
                                            
                                            <div className="flex-1 min-w-0 pr-12">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-semibold text-[11px] sm:text-xs text-foreground truncate">
                                                        {connector.name}
                                                    </h4>
                                                </div>
                                                <p className="text-[9px] sm:text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                                                    {connector.description}
                                                </p>
                                            </div>

                                            {/* Coming Soon Badge - responsive positioning */}
                                            <span className="absolute top-2 right-2 sm:top-3 sm:right-3 text-[7px] sm:text-[8px] font-bold uppercase px-1 sm:px-1.5 py-0.5 bg-muted text-muted-foreground rounded border border-border">
                                                Soon
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* UX: Step 2 - Connection Form (Scrollable Content) */}
                {step === 2 && (
                    <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
                        {/* Connector icon display - responsive sizing */}
                        <div className="flex justify-center mb-3 sm:mb-4">
                            <div className={cn("p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl shadow-inner", selectedConnector?.bg)}>
                                {selectedConnector && <selectedConnector.icon className={cn("h-10 w-10 sm:h-12 sm:w-12", selectedConnector.color)} />}
                            </div>
                        </div>

                        {/* Form fields - responsive spacing */}
                        <div className="space-y-3 sm:space-y-4">
                            <div className="space-y-1.5 sm:space-y-2">
                                <Label htmlFor="name" className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    Connector Name
                                </Label>
                                <Input
                                    id="name"
                                    placeholder="My Store"
                                    className="rounded-xl bg-accent/20 border-border h-11 sm:h-12 text-sm focus-visible:ring-primary"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            {(selected === 'shopify' || selected === 'woocommerce') && (
                                <div className="space-y-3 sm:space-y-4">
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <Label htmlFor="url" className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                            Store URL
                                        </Label>
                                        <div className="relative">
                                            <Globe className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                                            <Input
                                                id="url"
                                                placeholder={selected === 'shopify' ? "mystore.myshopify.com" : "https://my-store.com"}
                                                className="rounded-xl bg-accent/20 border-border h-11 sm:h-12 pl-10 sm:pl-11 text-sm focus-visible:ring-primary"
                                                value={formData.storeUrl}
                                                onChange={(e) => setFormData({ ...formData, storeUrl: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {selected === 'shopify' && (
                                        <div className="space-y-1.5 sm:space-y-2">
                                            <Label htmlFor="token" className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                Admin Access Token
                                            </Label>
                                            <Input
                                                id="token"
                                                type="password"
                                                placeholder="shpat_..."
                                                className="rounded-xl bg-accent/20 border-border h-11 sm:h-12 text-sm focus-visible:ring-primary"
                                                value={formData.apiKey}
                                                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                                            />
                                        </div>
                                    )}

                                    {selected === 'woocommerce' && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                            <div className="space-y-1.5 sm:space-y-2">
                                                <Label htmlFor="key" className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                    Consumer Key
                                                </Label>
                                                <Input
                                                    id="key"
                                                    placeholder="ck_..."
                                                    className="rounded-xl bg-accent/20 border-border h-11 sm:h-12 text-sm focus-visible:ring-primary"
                                                    value={formData.apiKey}
                                                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-1.5 sm:space-y-2">
                                                <Label htmlFor="secret" className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                    Consumer Secret
                                                </Label>
                                                <Input
                                                    id="secret"
                                                    type="password"
                                                    placeholder="cs_..."
                                                    className="rounded-xl bg-accent/20 border-border h-11 sm:h-12 text-sm focus-visible:ring-primary"
                                                    value={formData.apiSecret}
                                                    onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {(selected === 'stripe' || selected === 'custom') && (
                                <div className="space-y-1.5 sm:space-y-2">
                                    <Label htmlFor="key" className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        API Key / Secret
                                    </Label>
                                    <Input
                                        id="key"
                                        type="password"
                                        placeholder="sk_test_..."
                                        className="rounded-xl bg-accent/20 border-border h-11 sm:h-12 text-sm focus-visible:ring-primary"
                                        value={formData.apiKey}
                                        onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                                    />
                                </div>
                            )}

                            {selected === 'google-analytics' && (
                                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-2.5 sm:gap-3">
                                    <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 shrink-0 mt-0.5" />
                                    <p className="text-[11px] sm:text-xs text-blue-200 leading-relaxed">
                                        You will be redirected to Google to authorize Swix Cortex to access your analytics data.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* UX: Sticky Footer - always visible, contains CTAs */}
                <div className="flex-shrink-0 px-4 py-3 sm:p-6 sm:pt-5 border-t border-border/50 bg-gradient-to-t from-accent/20 to-transparent">
                    {/* UX: Trust & Safety Signals - responsive layout */}
                    <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                        {step === 1 ? (
                            selected ? (
                                <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-muted-foreground">
                                    <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-500 flex-shrink-0" />
                                    <span className="font-medium truncate">{selectedConnector?.name} ready</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 sm:gap-4 text-[9px] sm:text-[10px] text-muted-foreground flex-wrap">
                                    <div className="flex items-center gap-1 sm:gap-1.5">
                                        <div className="h-1 w-1 rounded-full bg-green-500 flex-shrink-0" />
                                        <span className="whitespace-nowrap">Read-only</span>
                                    </div>
                                    <div className="flex items-center gap-1 sm:gap-1.5">
                                        <div className="h-1 w-1 rounded-full bg-blue-500 flex-shrink-0" />
                                        <span className="whitespace-nowrap">Disconnect anytime</span>
                                    </div>
                                    <div className="hidden sm:flex items-center gap-1.5">
                                        <div className="h-1 w-1 rounded-full bg-purple-500" />
                                        <span>Encrypted sync</span>
                                    </div>
                                </div>
                            )
                        ) : (
                            <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
                                <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                                <span className="text-muted-foreground font-medium truncate">
                                    🔒 Encrypted • Safe
                                </span>
                            </div>
                        )}
                    </div>

                    {/* UX: Action Buttons (Responsive, Clear Hierarchy) */}
                    <div className="flex items-center justify-between gap-2 sm:gap-3">
                        {/* UX: Secondary action - visually de-emphasized */}
                        <Button 
                            variant="ghost" 
                            onClick={() => onOpenChange?.(false)} 
                            className="rounded-xl text-muted-foreground hover:text-foreground text-sm h-10 sm:h-11 px-3 sm:px-4"
                        >
                            Cancel
                        </Button>

                        {/* UX: Primary action - visually dominant, responsive sizing */}
                        {step === 1 ? (
                            <Button
                                onClick={handleContinue}
                                disabled={!selected}
                                className={cn(
                                    "rounded-xl h-10 sm:h-11 font-semibold shadow-lg transition-all duration-200 text-sm",
                                    // Responsive width: wider text on mobile when selected
                                    selected ? "px-4 sm:px-8" : "px-3 sm:px-6",
                                    selected
                                        ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-xl shadow-primary/30"
                                        : "bg-muted text-muted-foreground cursor-not-allowed"
                                )}
                            >
                                {selected ? (
                                    <>
                                        <span className="hidden sm:inline">Continue Setup</span>
                                        <span className="sm:hidden">Continue</span>
                                        <ArrowRight className="ml-1.5 sm:ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    </>
                                ) : (
                                    <>
                                        <span className="hidden sm:inline">Select a connector</span>
                                        <span className="sm:hidden">Select connector</span>
                                    </>
                                )}
                            </Button>
                        ) : (
                            syncProgress > 0 ? (
                                <div className="flex-1 space-y-1.5 sm:space-y-2">
                                    <div className="flex justify-between text-[11px] sm:text-xs font-medium">
                                        <span className="flex items-center gap-1.5 sm:gap-2 text-primary">
                                            <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" />
                                            <span className="hidden sm:inline">Syncing your data...</span>
                                            <span className="sm:hidden">Syncing...</span>
                                        </span>
                                        <span className="text-muted-foreground">{syncProgress}%</span>
                                    </div>
                                    <Progress value={syncProgress} className="h-2 sm:h-2.5 w-full" />
                                </div>
                            ) : (
                                <Button
                                    onClick={handleConnect}
                                    disabled={loading || ((selected === 'shopify' || selected === 'woocommerce') && !formData.storeUrl)}
                                    className="rounded-xl px-4 sm:px-8 h-10 sm:h-11 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/30 hover:shadow-xl transition-all duration-200 text-sm"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                                            <span className="hidden sm:inline">Connecting...</span>
                                            <span className="sm:hidden">Connecting</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="hidden sm:inline">Connect & Activate AI</span>
                                            <span className="sm:hidden">Connect AI</span>
                                            <ArrowRight className="ml-1.5 sm:ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        </>
                                    )}
                                </Button>
                            )
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
