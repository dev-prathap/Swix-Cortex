"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Zap, Brain, Sparkles } from "lucide-react"

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 px-6 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">PRICING</p>
          <h2 className="text-[40px] font-bold mb-4 text-slate-900 leading-tight">Pricing Details</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
            Choose the plan that fits your needs
          </p>
          <div className="inline-flex items-center space-x-0 bg-white rounded-full p-1 border border-slate-200">
            <Button size="sm" className="rounded-full px-6">Monthly</Button>
            <Button size="sm" variant="ghost" className="rounded-full px-6">Yearly</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-8 border-slate-200">
            <Zap className="h-12 w-12 text-slate-700 mb-6" />
            <h3 className="text-2xl font-bold mb-2">Essential</h3>
            <p className="text-sm text-slate-600 mb-6">For solo founders</p>
            <div className="mb-6">
              <span className="text-5xl font-bold">$29</span>
              <span className="text-slate-600">/month</span>
            </div>
            <Button variant="outline" className="w-full rounded-full mb-6">Basic Access</Button>
            <ul className="space-y-3">
              {['1 user seat', 'Real-time analytics', 'Up to 1K users', 'Email support'].map((f) => (
                <li key={f} className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <span className="text-sm text-slate-600">{f}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-8 border-2 border-primary relative shadow-lg">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-red-500 text-white text-xs font-bold px-4 py-1 rounded-full">POPULAR</span>
            </div>
            <Brain className="h-12 w-12 text-primary mb-6" />
            <h3 className="text-2xl font-bold mb-2">Advanced</h3>
            <p className="text-sm text-slate-600 mb-6">For small businesses</p>
            <div className="mb-6">
              <span className="text-5xl font-bold">$49</span>
              <span className="text-slate-600">/month</span>
            </div>
            <Button className="w-full rounded-full mb-6">Premium Access</Button>
            <ul className="space-y-3">
              {['Up to 10 users', 'Advanced reports', 'Up to 10K users', 'API access', 'Priority support'].map((f) => (
                <li key={f} className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <span className="text-sm text-slate-600">{f}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-8 border-slate-200">
            <Sparkles className="h-12 w-12 text-slate-700 mb-6" />
            <h3 className="text-2xl font-bold mb-2">Pro</h3>
            <p className="text-sm text-slate-600 mb-6">For growing teams</p>
            <div className="mb-6">
              <span className="text-5xl font-bold">$99</span>
              <span className="text-slate-600">/month</span>
            </div>
            <Button variant="outline" className="w-full rounded-full mb-6">Elite Access</Button>
            <ul className="space-y-3">
              {['Up to 25 users', 'Advanced automation', 'Up to 50K users', 'White label'].map((f) => (
                <li key={f} className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <span className="text-sm text-slate-600">{f}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </section>
  )
}
