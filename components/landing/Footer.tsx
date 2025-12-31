"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Zap } from "lucide-react"

export function Footer() {
  return (
    <footer className="py-12 px-6 border-t border-slate-200 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="h-9 w-9 bg-slate-900 rounded-full flex items-center justify-center">
                <Zap className="h-5 w-5 text-white fill-white" />
              </div>
              <span className="text-xl font-bold">SWIX</span>
            </div>
            <p className="text-sm text-slate-600">
              All-in-one analytics platform for growing businesses.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link href="#" className="hover:text-slate-900">Testimonials</Link></li>
              <li><Link href="#" className="hover:text-slate-900">Features</Link></li>
              <li><Link href="#" className="hover:text-slate-900">Pricing</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Help</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link href="#" className="hover:text-slate-900">Support</Link></li>
              <li><Link href="#" className="hover:text-slate-900">Terms</Link></li>
              <li><Link href="#" className="hover:text-slate-900">Privacy</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Newsletter</h4>
            <div className="flex items-center space-x-2">
              <input 
                type="email" 
                placeholder="Your email"
                className="flex-1 px-4 py-2 rounded-lg border text-sm focus:outline-none"
              />
              <Button size="sm" className="rounded-lg h-9 w-9 p-0">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-8 text-center text-sm text-slate-500">
          <p>&copy; 2025 SWIX. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
