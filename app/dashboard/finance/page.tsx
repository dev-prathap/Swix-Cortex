"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Sparkles, PieChart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function FinancePage() {
    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Finance Command</h1>
                    <p className="text-muted-foreground">P&L, Marketing ROI, and Cashflow Forecasting.</p>
                </div>
                <Button className="rounded-xl gap-2">
                    <Sparkles className="h-4 w-4" />
                    Run Simulation
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-card border-border rounded-3xl p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-green-500/10 rounded-2xl">
                            <DollarSign className="h-6 w-6 text-green-500" />
                        </div>
                        <Badge variant="outline" className="text-green-500 border-green-500/20 bg-green-500/5">
                            Healthy
                        </Badge>
                    </div>
                    <h3 className="text-2xl font-bold">$124,500</h3>
                    <p className="text-xs text-muted-foreground mt-1">Net Revenue (MTD)</p>
                    <div className="mt-4 flex items-center gap-1 text-xs font-bold text-green-500">
                        <TrendingUp className="h-3 w-3" /> +18% vs last month
                    </div>
                </Card>

                <Card className="bg-card border-border rounded-3xl p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-500/10 rounded-2xl">
                            <PieChart className="h-6 w-6 text-blue-500" />
                        </div>
                        <Badge variant="outline" className="text-blue-500 border-blue-500/20 bg-blue-500/5">
                            Optimized
                        </Badge>
                    </div>
                    <h3 className="text-2xl font-bold">3.2x</h3>
                    <p className="text-xs text-muted-foreground mt-1">Marketing ROAS</p>
                    <div className="mt-4 flex items-center gap-1 text-xs font-bold text-blue-500">
                        <ArrowUpRight className="h-3 w-3" /> Spent $12k → Got $38k
                    </div>
                </Card>

                <Card className="bg-card border-border rounded-3xl p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-500/10 rounded-2xl">
                            <TrendingUp className="h-6 w-6 text-purple-500" />
                        </div>
                        <Badge variant="outline" className="text-purple-500 border-purple-500/20 bg-purple-500/5">
                            Forecast
                        </Badge>
                    </div>
                    <h3 className="text-2xl font-bold">$450,000</h3>
                    <p className="text-xs text-muted-foreground mt-1">Projected Q4 Revenue</p>
                    <div className="mt-4 flex items-center gap-1 text-xs font-bold text-purple-500">
                        <Sparkles className="h-3 w-3" /> AI Confidence: 92%
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <Card className="lg:col-span-8 bg-card border-border rounded-3xl overflow-hidden">
                    <CardHeader className="border-b bg-muted/30">
                        <CardTitle className="text-lg font-bold">Marketing ROI Intelligence</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="flex items-center justify-between p-4 bg-accent/50 rounded-2xl border border-border">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold">FB</div>
                                <div>
                                    <p className="font-bold">Facebook Ads</p>
                                    <p className="text-xs text-muted-foreground">Spent $5,200 → Revenue $21,000</p>
                                </div>
                            </div>
                            <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-none">4.0x ROAS</Badge>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-accent/50 rounded-2xl border border-border">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 font-bold">GA</div>
                                <div>
                                    <p className="font-bold">Google Ads</p>
                                    <p className="text-xs text-muted-foreground">Spent $3,000 → Revenue $1,500</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-none">0.5x ROAS</Badge>
                                <Button size="sm" variant="destructive" className="rounded-lg h-8">Pause Channel</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-4 bg-card border-border rounded-3xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Cashflow Watchman</CardTitle>
                    </CardHeader>
                    <CardContent className="p-12 text-center">
                        <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <DollarSign className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold">Runway: 18 Months</h3>
                        <p className="text-muted-foreground max-w-xs mx-auto mt-2">
                            Based on current burn rate and revenue growth, your cash position is strong.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
