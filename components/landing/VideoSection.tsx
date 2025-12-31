"use client"

import { Play, Monitor } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function VideoSection() {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Video Placeholder */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-2xl blur-2xl group-hover:blur-3xl transition-all"></div>
            <Card className="relative aspect-video rounded-2xl overflow-hidden border-2 border-slate-200 hover:border-primary transition-colors">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                <div className="text-center">
                  <div className="h-20 w-20 rounded-full bg-slate-900 flex items-center justify-center mx-auto mb-4 cursor-pointer hover:scale-110 transition-transform shadow-2xl">
                    <Play className="h-10 w-10 text-white fill-white ml-1" />
                  </div>
                  <p className="text-slate-600 font-medium">Watch Demo Video</p>
                  <p className="text-slate-500 text-sm">2:30 mins</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Content */}
          <div>
            <div className="inline-flex items-center space-x-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
              <Monitor className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">See it in Action</span>
            </div>
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Experience the Power of<br />Real-time Analytics
            </h2>
            <p className="text-lg text-slate-600 mb-6 leading-relaxed">
              Watch how leading companies use SWIX to transform their data into actionable insights. 
              See live demos, customer success stories, and learn best practices.
            </p>
            <ul className="space-y-3 mb-6">
              {[
                "Setup in under 5 minutes",
                "Connect unlimited data sources",
                "AI-powered insights automatically",
                "Collaborate with your entire team"
              ].map((item, i) => (
                <li key={i} className="flex items-center space-x-3">
                  <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
            <Button size="lg" className="rounded-full bg-slate-900 hover:bg-slate-800">
              Start Free Trial
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

