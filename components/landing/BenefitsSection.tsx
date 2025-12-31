"use client"

import { Card } from "@/components/ui/card"
import { BarChart3, Zap, Layers } from "lucide-react"

export function BenefitsSection() {
  return (
    <section id="benefits" className="py-20 px-6 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">BENEFITS</p>
          <h2 className="text-[40px] font-bold mb-4 text-slate-900 leading-tight">
            How SWIX Helps You
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Built to simplify your workflow and keep everything easy to manage.
          </p>
        </div>

        <div className="space-y-16">
          {[
            {
              icon: BarChart3,
              title: "Unified Sales Overview",
              description: "Monitor leads, purchases, and orders in real-time to stay updated on every key business metric."
            },
            {
              icon: Zap,
              title: "Automated Follow-Ups",
              description: "Let smart reminders handle repetitive tasks, allowing you to focus on closing more deals."
            },
            {
              icon: Layers,
              title: "Clean & Simple Workflow",
              description: "Move deals effortlessly through stages with our intuitive pipeline system."
            }
          ].map((benefit, i) => (
            <div key={i} className={`grid md:grid-cols-2 gap-12 items-center ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
              <div className={i % 2 === 1 ? 'order-2' : ''}>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">{benefit.title}</h3>
                </div>
                <p className="text-slate-600 leading-relaxed text-base">{benefit.description}</p>
              </div>
              <Card className={`p-6 shadow-lg border-slate-200 ${i % 2 === 1 ? 'order-1' : ''}`}>
                <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center">
                  <benefit.icon className="h-16 w-16 text-slate-400" />
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
