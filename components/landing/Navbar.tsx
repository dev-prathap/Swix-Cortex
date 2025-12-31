"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Zap } from "lucide-react"

export function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="h-9 w-9 bg-black rounded-full flex items-center justify-center">
            <Zap className="h-5 w-5 text-white fill-white" />
          </div>
          <span className="text-xl font-bold text-slate-900">SWIX</span>
        </div>
        
        <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
          <div className="flex items-center space-x-1">
            <Link href="#features" className="hover:text-slate-900 transition-colors">Features</Link>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <Link href="#benefits" className="hover:text-slate-900 transition-colors">Benefits</Link>
          <Link href="#testimonials" className="hover:text-slate-900 transition-colors">Testimonials</Link>
          <Link href="#pricing" className="hover:text-slate-900 transition-colors">Pricing</Link>
        </div>
        
          <div className="flex items-center space-x-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-slate-700 hover:text-slate-900 font-medium">Log in</Button>
            </Link>
            <Link href="/waitlist">
              <Button size="sm" className="rounded-full bg-slate-900 text-white hover:bg-slate-800 px-5 shadow-sm">Join Beta</Button>
            </Link>
          </div>
      </div>
    </nav>
  )
}

