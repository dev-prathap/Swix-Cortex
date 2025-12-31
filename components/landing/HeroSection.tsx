"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"

export function HeroSection() {
  return (
    <section className="pt-28 pb-16 px-6">
      <div className="max-w-6xl mx-auto text-center">
        {/* Trust Badge */}
        <div className="inline-flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-full px-5 py-2.5 mb-8 animate-fade-in hover:scale-105 transition-transform">
          <Sparkles className="h-4 w-4 text-slate-600" />
          <span className="text-sm font-medium text-slate-700">
            Trusted by 5,000+ growing businesses
          </span>
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl md:text-[64px] font-bold tracking-tight leading-[1.1] mb-6 text-slate-900 animate-fade-in-up">
          Supercharge Your Product's Growth
        </h1>

        {/* Subheading */}
        <p className="text-[19px] text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up animation-delay-100">
          Track every key metric in one clean dashboard — no code, no setup,<br />
          just real-time insights that help you grow smarter.
        </p>

        {/* CTA Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/waitlist">
            <Button size="lg" className="h-12 px-8 text-base rounded-full bg-slate-900 text-white hover:bg-slate-800 shadow-lg hover:shadow-xl inline-flex items-center space-x-2 animate-fade-in-up animation-delay-200 hover:scale-105 transition-all">
              <span>Join Beta Waitlist</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="h-12 px-8 text-base rounded-full border-slate-300 hover:bg-slate-50">
              Already have access?
            </Button>
          </Link>
        </div>
        
        <p className="text-sm text-slate-500 mt-4">
          🎉 <span className="font-semibold text-slate-700">Limited spots</span> • Launching soon • Early access perks
        </p>

        {/* Dashboard Preview */}
        <div className="mt-16 relative animate-fade-in-up animation-delay-300">
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-2xl bg-white hover:shadow-3xl transition-shadow">
            <Image 
              src="/image copy.png" 
              alt="SWIX Dashboard - Real-time Analytics" 
              width={1600} 
              height={1040} 
              className="w-full h-auto"
              priority
              unoptimized
            />
            {/* Overlay badge */}
            <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="bg-slate-900/90 backdrop-blur-sm text-white px-5 py-2.5 rounded-full flex items-center space-x-2 shadow-xl">
                <Sparkles className="h-5 w-5" />
                <span className="font-medium text-[15px]">Welcome to your dashboard</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

