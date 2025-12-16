"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Search, Bell, User, ChevronDown, Loader2 } from "lucide-react"

export default function SignupPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [showPassword, setShowPassword] = useState(false)

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)
        setError("")

        const formData = new FormData(event.currentTarget)
        const name = formData.get("name") as string
        const email = formData.get("email") as string
        const password = formData.get("password") as string

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name, email, password }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || "Something went wrong")
            }

            router.push("/dashboard")
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="bg-background text-foreground font-sans antialiased h-screen flex flex-col overflow-hidden">
            <nav className="w-full h-16 bg-surface-light/90 dark:bg-surface-dark/90 backdrop-blur-sm border-b border-border flex items-center justify-between px-6 z-50 fixed top-0">
                <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold tracking-tight text-primary dark:text-blue-400">SWIXREPORT</span>
                </div>
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-primary">
                        <Search className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-primary">
                        <Bell className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center space-x-2 border-l border-border pl-4">
                        <Button variant="ghost" className="flex items-center space-x-1 text-muted-foreground hover:text-primary p-0 hover:bg-transparent">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                <User className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <ChevronDown className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </nav>
            <div className="flex flex-1 h-full pt-16">
                <div className="hidden lg:flex lg:w-1/2 relative neural-bg flex-col justify-end p-12 overflow-hidden">
                    <div className="glow-accent top-1/4 left-1/4 animate-pulse-slow"></div>
                    <div className="glow-accent bottom-1/4 right-1/4 animate-pulse-slow" style={{ animationDelay: "1s" }}></div>
                    <div className="network-lines"></div>
                    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40 z-0" xmlns="http://www.w3.org/2000/svg">
                        <path className="animate-float" d="M0,300 Q150,150 300,300 T600,300" fill="none" stroke="url(#gradient1)" strokeWidth="2"></path>
                        <path className="animate-float" d="M-50,400 Q200,200 450,400 T800,350" fill="none" stroke="url(#gradient2)" strokeWidth="1.5" style={{ animationDelay: "0.5s" }}></path>
                        <path className="animate-float" d="M-100,500 Q250,300 500,500 T900,450" fill="none" stroke="url(#gradient3)" strokeWidth="1" style={{ animationDelay: "1s" }}></path>
                        <defs>
                            <linearGradient id="gradient1" x1="0%" x2="100%" y1="0%" y2="0%">
                                <stop offset="0%" style={{ stopColor: "#3b82f6", stopOpacity: 0 }}></stop>
                                <stop offset="50%" style={{ stopColor: "#60a5fa", stopOpacity: 1 }}></stop>
                                <stop offset="100%" style={{ stopColor: "#3b82f6", stopOpacity: 0 }}></stop>
                            </linearGradient>
                            <linearGradient id="gradient2" x1="0%" x2="100%" y1="0%" y2="0%">
                                <stop offset="0%" style={{ stopColor: "#818cf8", stopOpacity: 0 }}></stop>
                                <stop offset="50%" style={{ stopColor: "#a5b4fc", stopOpacity: 1 }}></stop>
                                <stop offset="100%" style={{ stopColor: "#818cf8", stopOpacity: 0 }}></stop>
                            </linearGradient>
                            <linearGradient id="gradient3" x1="0%" x2="100%" y1="0%" y2="0%">
                                <stop offset="0%" style={{ stopColor: "#2dd4bf", stopOpacity: 0 }}></stop>
                                <stop offset="50%" style={{ stopColor: "#5eead4", stopOpacity: 1 }}></stop>
                                <stop offset="100%" style={{ stopColor: "#2dd4bf", stopOpacity: 0 }}></stop>
                            </linearGradient>
                        </defs>
                    </svg>
                    <div className="relative z-10 max-w-lg mb-12">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                            Join the Future <br />
                            <span className="text-blue-400">of Data Analytics</span>
                        </h2>
                        <p className="text-slate-300 text-lg leading-relaxed mb-8">
                            Start your journey with SWIXREPORT today. Get instant access to powerful AI-driven insights and transform your decision-making process.
                        </p>
                        <div className="flex items-center space-x-2">
                            <div className="h-1 w-2 bg-slate-600 rounded-full"></div>
                            <div className="h-1 w-12 bg-blue-500 rounded-full"></div>
                            <div className="h-1 w-2 bg-slate-600 rounded-full"></div>
                        </div>
                    </div>
                </div>
                <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-surface-light dark:bg-surface-dark transition-colors duration-300">
                    <div className="w-full max-w-md space-y-8">
                        <div className="text-center lg:text-left">
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">Sign Up</h1>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Create your account to get started with SWIXREPORT.
                            </p>
                        </div>
                        <form onSubmit={onSubmit} className="mt-8 space-y-6">
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input id="name" name="name" type="text" placeholder="John Doe" required className="bg-white dark:bg-slate-800" disabled={isLoading} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email address</Label>
                                    <Input id="email" name="email" type="email" placeholder="name@company.com" required className="bg-white dark:bg-slate-800" disabled={isLoading} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            required
                                            className="bg-white dark:bg-slate-800 pr-10"
                                            disabled={isLoading}
                                        />
                                        <div
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-muted-foreground hover:text-foreground"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900 rounded-lg">
                                    {error}
                                </div>
                            )}

                            <div className="flex items-center">
                                <Checkbox id="terms" className="mr-2" required />
                                <Label htmlFor="terms" className="text-sm text-muted-foreground">
                                    I agree to the <Link href="#" className="text-primary hover:underline">Terms of Service</Link> and <Link href="#" className="text-primary hover:underline">Privacy Policy</Link>
                                </Label>
                            </div>
                            <div>
                                <Button type="submit" className="w-full shadow-lg shadow-blue-900/20" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating Account...
                                        </>
                                    ) : (
                                        "Create Account"
                                    )}
                                </Button>
                            </div>
                        </form>
                        <div className="relative mt-6">
                            <div aria-hidden="true" className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="bg-surface-light dark:bg-surface-dark px-2 text-muted-foreground">Or sign up with</span>
                            </div>
                        </div>
                        <div className="mt-6">
                            <Button variant="outline" className="w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200" disabled={isLoading}>
                                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                                </svg>
                                Continue with Google
                            </Button>
                        </div>
                        <div className="text-center text-sm">
                            <span className="text-muted-foreground">Already have an account?</span>
                            <Link href="/login" className="font-medium text-primary hover:text-primary/90 ml-1 transition-colors">Log In</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
