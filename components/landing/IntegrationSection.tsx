"use client"

import { Card } from "@/components/ui/card"
import { Database, Globe, ShoppingBag, Code, Zap, Lock } from "lucide-react"

export function IntegrationSection() {
  const integrations = [
    { name: "Shopify", icon: ShoppingBag, color: "bg-green-500", users: "12K+" },
    { name: "Stripe", icon: Zap, color: "bg-purple-500", users: "8K+" },
    { name: "PostgreSQL", icon: Database, color: "bg-blue-500", users: "15K+" },
    { name: "REST APIs", icon: Code, color: "bg-orange-500", users: "20K+" },
    { name: "Webhooks", icon: Globe, color: "bg-pink-500", users: "10K+" },
    { name: "MongoDB", icon: Database, color: "bg-green-600", users: "9K+" }
  ]

  return (
    <section className="py-20 px-6 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-white rounded-full px-4 py-2 mb-4 border border-slate-200">
            <Lock className="h-4 w-4 text-slate-600" />
            <span className="text-sm font-semibold text-slate-700">100+ Integrations</span>
          </div>
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Connect Everything You Use
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Seamlessly integrate with your favorite tools and platforms. 
            No complex setup, just one-click connections.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
          {integrations.map((integration, i) => (
            <Card key={i} className="p-6 hover:shadow-xl transition-all cursor-pointer group border-slate-200">
              <div className={`h-12 w-12 ${integration.color} rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                <integration.icon className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm font-semibold text-slate-900 text-center mb-1">{integration.name}</p>
              <p className="text-xs text-slate-500 text-center">{integration.users} users</p>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <p className="text-slate-600 mb-4">and 94 more integrations...</p>
          <button className="text-primary font-semibold hover:underline">
            View all integrations →
          </button>
        </div>
      </div>
    </section>
  )
}

