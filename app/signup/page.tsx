"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function SignupPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to waitlist - signup is invite-only during beta
    router.push("/waitlist")
  }, [router])

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400 mx-auto mb-4" />
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Redirecting to waitlist...
        </p>
      </div>
    </div>
  )
}
