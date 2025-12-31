"use client"

import { Card } from "@/components/ui/card"

export function FAQSection() {
  const faqs = [
    'What is SWIX?',
    'How does SWIX help my business?',
    'Can I track multiple products?',
    'Do I need technical knowledge?',
    'Is my data safe with SWIX?'
  ]

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">FAQ</p>
          <h2 className="text-[40px] font-bold mb-4 text-slate-900 leading-tight">
            Frequently asked questions
          </h2>
          <p className="text-lg text-slate-600">
            Quick answers to help you understand how SWIX works.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((question) => (
            <Card key={question} className="p-5 hover:shadow-md transition-shadow cursor-pointer border-slate-200">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-slate-900">{question}</h4>
                <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
