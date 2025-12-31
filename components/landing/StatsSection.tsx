"use client"

import { TrendingUp, Users, Zap, Star } from "lucide-react"

export function StatsSection() {
  const stats = [
    {
      icon: Users,
      value: "50K+",
      label: "Active Users",
      trend: "+24%"
    },
    {
      icon: TrendingUp,
      value: "$2.5M+",
      label: "Revenue Tracked",
      trend: "+18%"
    },
    {
      icon: Zap,
      value: "99.9%",
      label: "Uptime",
      trend: "Reliable"
    },
    {
      icon: Star,
      value: "4.9/5",
      label: "User Rating",
      trend: "1.2K reviews"
    }
  ]

  return (
    <section className="py-16 bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="text-center group hover:scale-105 transition-transform">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm mb-4 group-hover:bg-white/20 transition-colors">
                <stat.icon className="h-7 w-7 text-white" />
              </div>
              <div className="text-4xl font-bold mb-2">{stat.value}</div>
              <div className="text-slate-300 text-sm mb-1">{stat.label}</div>
              <div className="text-green-400 text-xs font-semibold">{stat.trend}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

