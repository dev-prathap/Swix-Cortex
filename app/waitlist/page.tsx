"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Zap, CheckCircle2, Users, Sparkles, ArrowRight } from "lucide-react"

export default function WaitlistPage() {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [company, setCompany] = useState("")
  const [useCase, setUseCase] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [position, setPosition] = useState<number | null>(null)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: name || undefined,
          company: company || undefined,
          useCase: useCase || undefined,
          source: "waitlist-page"
        })
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess(true)
        setPosition(data.position)
      } else {
        setError(data.error || "Something went wrong")
      }
    } catch (err) {
      setError("Failed to join waitlist. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <Card className="max-w-lg w-full p-8 text-center">
          <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            You're on the list! 🎉
          </h1>
          
          <p className="text-slate-600 mb-6">
            You're <span className="font-bold text-slate-900">#{position}</span> in line.
            We'll email you at <span className="font-semibold">{email}</span> when it's your turn!
          </p>

          <div className="bg-slate-50 rounded-lg p-6 mb-6 text-left">
            <h3 className="font-semibold text-slate-900 mb-3">What happens next?</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start">
                <CheckCircle2 className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                We'll send you beta access within 1-2 weeks
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                You'll get lifetime 50% discount
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                Direct access to founders for support
              </li>
            </ul>
          </div>

          <div className="border-t pt-6">
            <p className="text-sm text-slate-600 mb-4">
              Want to skip the line? Share your referral link:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`https://swix.app/waitlist?ref=${email}`}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50"
              />
              <Button
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(`https://swix.app/waitlist?ref=${email}`)
                  alert("Copied!")
                }}
              >
                Copy
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              For each referral that joins, you move up 10 spots!
            </p>
          </div>

          <Link href="/" className="block mt-6">
            <Button variant="outline" className="w-full">
              Back to Home
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <nav className="border-b">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-black rounded-full flex items-center justify-center">
              <Zap className="h-5 w-5 text-white fill-white" />
            </div>
            <span className="text-xl font-bold">SWIX</span>
          </Link>
          <Link href="/login">
            <Button variant="ghost" size="sm">Log in</Button>
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: Info */}
          <div>
            <div className="inline-flex items-center space-x-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-2 mb-6">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-900">
                Limited Beta Access
              </span>
            </div>

            <h1 className="text-5xl font-bold text-slate-900 mb-6">
              Join the Beta Waitlist
            </h1>

            <p className="text-xl text-slate-600 mb-8 leading-relaxed">
              Be among the first to experience AI-powered analytics. 
              Shape the product, get lifetime discounts, and exclusive perks.
            </p>

            <div className="space-y-4 mb-8">
              {[
                "Full access to all features during beta",
                "Lifetime 50% discount when we launch",
                "Direct support from founders",
                "Shape the product roadmap",
                "Founding member badge"
              ].map((benefit) => (
                <div key={benefit} className="flex items-center space-x-3">
                  <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-slate-700">{benefit}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center space-x-6 text-sm text-slate-600">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span><span className="font-bold text-slate-900">247</span> on waitlist</span>
              </div>
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5" />
                <span><span className="font-bold text-slate-900">34</span> invited today</span>
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <Card className="p-8 shadow-xl border-2">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Request Beta Access
            </h2>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Name (optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Company (optional)
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Inc"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  What will you use SWIX for? (optional)
                </label>
                <textarea
                  value={useCase}
                  onChange={(e) => setUseCase(e.target.value)}
                  placeholder="E-commerce analytics, customer insights..."
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold"
              >
                {loading ? "Joining..." : "Join Waitlist"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <p className="text-xs text-slate-500 text-center">
                By joining, you agree to receive product updates via email.
                Unsubscribe anytime.
              </p>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}

