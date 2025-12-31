"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Loader2, Sparkles, BarChart3, TrendingUp, Zap } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(event.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Something went wrong")
      }

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 antialiased flex">
      {/* LEFT SECTION - Premium branding with subtle data visualization */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[45%] relative bg-slate-900 flex-col justify-between p-12 overflow-hidden">
        {/* Subtle grid background - enterprise feel */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"></div>
        
        {/* Ambient gradient orbs - very subtle */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl"></div>

        {/* Logo / Brand */}
        <div className="relative z-10">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-white tracking-tight">SWIXREPORT</span>
          </div>
        </div>

        {/* Main marketing content - improved hierarchy */}
        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-semibold text-white mb-4 leading-[1.15] tracking-tight">
            AI-powered analytics for modern teams
          </h1>
          <p className="text-slate-400 text-base leading-relaxed mb-10">
            Transform raw data into actionable insights with intelligent automation. 
            Trusted by data-driven companies worldwide.
          </p>

          {/* Social proof - enterprise trust signals */}
          <div className="space-y-4">
            <div className="flex items-center space-x-6 text-slate-500 text-sm">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4" />
                <span>Real-time insights</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4" />
                <span>Predictive analytics</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom testimonial / trust element */}
        <div className="relative z-10 max-w-md">
          <div className="p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
            <p className="text-slate-300 text-sm italic mb-3">
              "SWIXREPORT reduced our reporting time by 85%. The AI insights are incredible."
            </p>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-slate-700"></div>
              <div>
                <p className="text-white text-sm font-medium">Sarah Chen</p>
                <p className="text-slate-500 text-xs">Head of Analytics, TechCorp</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* RIGHT SECTION - Premium login form */}
      <div className="w-full lg:w-1/2 xl:w-[55%] flex items-center justify-center p-6 lg:p-12 bg-white dark:bg-slate-950">
        <div className="w-full max-w-[400px]">
          {/* Header - improved hierarchy and spacing */}
          <div className="mb-10">
            {/* Mobile logo */}
            <div className="lg:hidden mb-6 flex items-center space-x-2">
              <div className="w-7 h-7 bg-slate-900 dark:bg-blue-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">SWIXREPORT</span>
            </div>

            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight mb-2">
              Welcome back
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Sign in to your account to continue
            </p>
          </div>

          {/* Login form - improved spacing and states */}
          <form onSubmit={onSubmit} className="space-y-5">
            {/* Email input - improved focus states */}
            <div className="space-y-2">
              <Label 
                htmlFor="email" 
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Email address
              </Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                placeholder="you@company.com" 
                required 
                className="h-11 px-4 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 
                  focus:border-slate-900 dark:focus:border-slate-400 focus:ring-1 focus:ring-slate-900 
                  dark:focus:ring-slate-400 transition-colors placeholder:text-slate-400" 
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            {/* Password input - improved UX */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label 
                  htmlFor="password" 
                  className="text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Password
                </Label>
                <Link 
                  href="#" 
                  className="text-xs font-medium text-slate-600 dark:text-slate-400 
                    hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  required
                  className="h-11 px-4 pr-11 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 
                    focus:border-slate-900 dark:focus:border-slate-400 focus:ring-1 focus:ring-slate-900 
                    dark:focus:ring-slate-400 transition-colors placeholder:text-slate-400"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 
                    hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? 
                    <EyeOff className="h-4 w-4" /> : 
                    <Eye className="h-4 w-4" />
                  }
                </button>
              </div>
            </div>

            {/* Error message - improved visibility */}
            {error && (
              <div className="p-3.5 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/50 
                border border-red-200 dark:border-red-900/50 rounded-lg flex items-start space-x-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Primary CTA - premium button design */}
            <Button 
              type="submit" 
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 
                text-white dark:text-slate-900 font-medium shadow-sm hover:shadow transition-all 
                disabled:opacity-50 disabled:cursor-not-allowed" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          {/* Divider - clean and minimal */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white dark:bg-slate-950 px-3 text-slate-500 dark:text-slate-500">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google OAuth - secondary action */}
          <Button 
            type="button"
            variant="outline" 
            className="w-full h-11 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 
              hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium 
              transition-colors" 
            disabled={isLoading}
          >
            <svg className="h-4 w-4 mr-2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
            </svg>
            Continue with Google
          </Button>

          {/* Waitlist CTA - Beta invite only */}
          <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
            Don't have an account?{" "}
            <Link 
              href="/waitlist" 
              className="font-medium text-slate-900 dark:text-white hover:underline transition-all"
            >
              Join the waitlist
            </Link>
          </p>

          {/* Footer links - trust & legal */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-center space-x-4 text-xs text-slate-500 dark:text-slate-500">
              <Link href="#" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                Privacy
              </Link>
              <span>·</span>
              <Link href="#" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                Terms
              </Link>
              <span>·</span>
              <Link href="#" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                Help
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
