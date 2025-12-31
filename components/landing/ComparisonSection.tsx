"use client"

import { Card } from "@/components/ui/card"
import { Check, X } from "lucide-react"

export function ComparisonSection() {
  const features = [
    { name: "Real-time Analytics", us: true, others: false },
    { name: "AI-Powered Insights", us: true, others: false },
    { name: "Unlimited Users", us: true, others: "Limited" },
    { name: "Custom Dashboards", us: true, others: true },
    { name: "24/7 Support", us: true, others: "Business Hours" },
    { name: "API Access", us: true, others: "Enterprise Only" },
    { name: "White Label", us: true, others: false },
    { name: "Advanced Security", us: true, others: true }
  ]

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Why Choose SWIX?
          </h2>
          <p className="text-lg text-slate-600">
            See how we stack up against the competition
          </p>
        </div>

        <Card className="overflow-hidden border-slate-200">
          <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-200">
            <div className="p-4"></div>
            <div className="p-4 text-center border-x border-slate-200">
              <div className="h-10 w-10 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-white font-bold">S</span>
              </div>
              <p className="font-bold text-slate-900">SWIX</p>
            </div>
            <div className="p-4 text-center">
              <p className="font-bold text-slate-600">Others</p>
            </div>
          </div>

          {features.map((feature, i) => (
            <div key={i} className={`grid grid-cols-3 border-b border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
              <div className="p-4">
                <p className="font-medium text-slate-900">{feature.name}</p>
              </div>
              <div className="p-4 flex items-center justify-center border-x border-slate-100">
                {feature.us === true ? (
                  <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                ) : (
                  <span className="text-sm text-slate-600">{feature.us}</span>
                )}
              </div>
              <div className="p-4 flex items-center justify-center">
                {feature.others === true ? (
                  <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                ) : feature.others === false ? (
                  <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center">
                    <X className="h-4 w-4 text-red-600" />
                  </div>
                ) : (
                  <span className="text-sm text-slate-600">{feature.others}</span>
                )}
              </div>
            </div>
          ))}
        </Card>
      </div>
    </section>
  )
}

