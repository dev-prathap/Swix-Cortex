"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, TrendingUp, Sparkles, CheckCircle2, Globe, Database, BarChart3, Zap } from "lucide-react"

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">FEATURES</p>
          <h2 className="text-[40px] font-bold mb-4 text-slate-900 leading-tight">
            Powerful Features, Simple to Use
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Everything you need to manage sales, track growth, and stay focused—without the clutter.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Users,
              title: "Total Visitors",
              value: "23.02K",
              change: "-6%",
              description: "Track visitor behavior and conversion patterns across all channels."
            },
            {
              icon: Zap,
              title: "Goals & Targets",
              value: "$2,150",
              change: "+5%",
              description: "Set revenue targets and watch progress update in real time."
            },
            {
              icon: BarChart3,
              title: "New Users",
              value: "2.5%",
              change: "+12%",
              description: "Monitor user acquisition and engagement metrics daily."
            }
          ].map((feature, i) => (
            <Card key={i} className="p-6 hover:shadow-xl transition-all border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center">
                  <feature.icon className="h-6 w-6 text-slate-700" />
                </div>
                <span className={`text-sm font-semibold ${feature.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {feature.change}
                </span>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-2">{feature.value}</p>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-600">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
