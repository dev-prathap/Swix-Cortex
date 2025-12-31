"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle2, Zap, ArrowRight } from "lucide-react"

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const steps = [
    {
      title: "Welcome to SWIX! 🎉",
      description: "You're in! Let's get you set up in under 2 minutes.",
      content: (
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-900">As a beta member, you get:</h3>
            {[
              "Full access to all AI features",
              "Lifetime 50% discount",
              "Priority support (1-hour response)",
              "Direct founder access",
              "Early access to new features"
            ].map((perk) => (
              <div key={perk} className="flex items-center space-x-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-slate-700">{perk}</span>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      title: "What brings you to SWIX?",
      description: "Help us understand your needs better",
      content: (
        <div className="space-y-4">
          {[
            { value: "ecommerce", label: "E-commerce Analytics", desc: "Shopify, WooCommerce, etc." },
            { value: "saas", label: "SaaS Metrics", desc: "MRR, churn, user analytics" },
            { value: "general", label: "General Business", desc: "Sales, revenue tracking" }
          ].map((option) => (
            <button
              key={option.value}
              className="w-full p-4 border-2 border-slate-200 rounded-lg hover:border-slate-900 transition-all text-left group"
            >
              <p className="font-semibold text-slate-900 group-hover:text-slate-900">{option.label}</p>
              <p className="text-sm text-slate-600">{option.desc}</p>
            </button>
          ))}
        </div>
      )
    },
    {
      title: "Quick Tip! 💡",
      description: "Get the most out of SWIX",
      content: (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 className="font-semibold text-blue-900 mb-3">Pro Tips:</h4>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Connect your Shopify store for instant insights</li>
              <li>• Try the AI analyst - just ask questions in plain English</li>
              <li>• Check customer profiles for segmentation ideas</li>
              <li>• Enable webhooks for real-time updates</li>
            </ul>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-900">
              <span className="font-semibold">Need help?</span> We're here! 
              Email us anytime at <a href="mailto:support@swix.app" className="underline">support@swix.app</a>
            </p>
          </div>
        </div>
      )
    }
  ]

  const handleNext = async () => {
    if (step < steps.length) {
      setStep(step + 1)
    } else {
      setLoading(true)
      // Mark onboarding complete
      try {
        await fetch("/api/auth/complete-onboarding", {
          method: "POST"
        })
        router.push("/dashboard")
      } catch (error) {
        console.error("Onboarding error:", error)
        router.push("/dashboard")
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <Card className="max-w-2xl w-full p-8">
        {/* Progress */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((_, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className={`h-2 w-full rounded-full ${i < step ? 'bg-slate-900' : 'bg-slate-200'}`}></div>
              {i < steps.length - 1 && <div className="w-4"></div>}
            </div>
          ))}
        </div>

        <div className="mb-8">
          <div className="inline-flex items-center space-x-2 bg-blue-50 rounded-full px-4 py-2 mb-4">
            <Zap className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-900">Step {step} of {steps.length}</span>
          </div>
          
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {steps[step - 1].title}
          </h1>
          <p className="text-slate-600">
            {steps[step - 1].description}
          </p>
        </div>

        <div className="mb-8">
          {steps[step - 1].content}
        </div>

        <div className="flex items-center justify-between">
          {step > 1 && (
            <Button
              variant="ghost"
              onClick={() => setStep(step - 1)}
              disabled={loading}
            >
              Back
            </Button>
          )}
          <div className="flex-1"></div>
          <Button
            onClick={handleNext}
            disabled={loading}
            className="bg-slate-900 hover:bg-slate-800"
          >
            {loading ? "Loading..." : step === steps.length ? "Go to Dashboard" : "Next"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  )
}

