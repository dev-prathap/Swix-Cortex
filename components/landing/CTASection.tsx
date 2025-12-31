"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CTASection() {
  return (
    <section className="py-20 px-6 bg-slate-900 text-white">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-[40px] font-bold mb-5 leading-tight">
          Ready to Transform Your Business?
        </h2>
        <p className="text-lg mb-10 text-slate-300">
          Join our exclusive beta program and get early access to<br />
          AI-powered analytics built for modern businesses.
        </p>
        
        <Link href="/waitlist">
          <Button size="lg" className="rounded-full bg-white text-slate-900 hover:bg-slate-100 px-8 py-4 font-semibold shadow-xl hover:shadow-2xl transition-all hover:scale-105">
            Request Beta Access
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
        
        <p className="mt-6 text-sm text-slate-400">
          🎁 Beta members get lifetime 50% discount • 🚀 Launch Spring 2025
        </p>
      </div>
    </section>
  )
}
