import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, BarChart2, Brain, CheckCircle2, Database, Globe, Layers, Shield, Sparkles, Zap } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
              <Layers className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">SWIX<span className="text-primary">REPORT</span></span>
          </div>
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-muted-foreground">
            <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-primary transition-colors">How it Works</Link>
            <Link href="#pricing" className="hover:text-primary transition-colors">Pricing</Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button className="shadow-lg shadow-primary/20">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden hero-aurora-bg">
        <div className="network-lines absolute inset-0 z-0 opacity-30"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8 backdrop-blur-md shadow-lg shadow-blue-500/10 hover:bg-white/10 transition-colors cursor-default">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span className="text-sm font-medium text-blue-100 tracking-wide">AI-Powered Analytics 2.0</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-8 leading-tight drop-shadow-sm">
            Transform Data into <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-300 to-purple-300 animate-pulse-slow">Intelligent Action</span>
          </h1>

          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-12 leading-relaxed font-light">
            Stop drowning in spreadsheets. SWIXREPORT uses advanced neural networks to analyze your data, predict trends, and generate actionable insights in seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link href="/signup">
              <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-white text-slate-900 hover:bg-blue-50 border-none shadow-[0_0_40px_rgba(59,130,246,0.4)] hover:shadow-[0_0_60px_rgba(59,130,246,0.6)] transition-all duration-300 hover:scale-105 font-semibold">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#demo">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-slate-600/50 bg-slate-900/30 text-white hover:bg-white/10 hover:text-white backdrop-blur-sm transition-all duration-300 hover:border-slate-500">
                Watch Demo
              </Button>
            </Link>
          </div>

          {/* Hero Visual */}
          <div className="mt-24 relative mx-auto max-w-6xl perspective-1000">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur-2xl opacity-20 animate-pulse-slow"></div>
            <div className="relative bg-slate-950/80 border border-white/10 rounded-2xl shadow-2xl overflow-hidden aspect-[16/9] flex items-center justify-center group backdrop-blur-xl transform rotate-x-12 hover:rotate-x-0 transition-transform duration-700 ease-out">
              <div className="absolute inset-0 bg-[url('https://lh3.googleusercontent.com/aida-public/AB6AXuCllxHE-hh8gFnUG7U0wq2pvGGV_jo1tXH6iWpxM-Wat1rFsfyHAnXSmWsWrG1jsiQ3bWrRgC3Pp5zU4n5q-FN4nHQoJZ9pB0hPANn7V0CKGyoBY0GZadXQ1HL0E5cnveF2S9KSiCzSGL8Yy1JamS_MIv1V1NDpLTZPHolBRTNoKZ43UGLCi4bNVxo_FfZf0C3qg6KAvZh23vL5MCxttshiFPK-nztoUaSNJxhjoHaG5iowJXfM28Hly90Qh9JuLHUMa7tK4irffqGE')] bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity duration-500 mix-blend-luminosity"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>

              <div className="text-center p-8 relative z-10 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-white/10 group-hover:scale-110 transition-transform duration-500 shadow-glow">
                  <Sparkles className="h-10 w-10 text-blue-300 drop-shadow-[0_0_10px_rgba(147,197,253,0.5)]" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-3 tracking-tight">Interactive Dashboard Preview</h3>
                <p className="text-slate-400 text-lg max-w-md mx-auto">Experience the power of real-time AI analytics with our immersive interface.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-base font-semibold text-primary uppercase tracking-wide mb-2">Features</h2>
            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">Everything you need to master your data</h3>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Built for modern teams who need speed, accuracy, and depth in their analytics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: "AI-Driven Insights",
                description: "Our neural engine automatically detects anomalies, trends, and opportunities in your data without manual querying."
              },
              {
                icon: Database,
                title: "Universal Connectors",
                description: "Connect to PostgreSQL, MongoDB, Snowflake, and more with just a few clicks. We handle the pipeline."
              },
              {
                icon: Zap,
                title: "Real-time Processing",
                description: "Stream data in real-time and get instant updates on your dashboard. No more waiting for daily batches."
              },
              {
                icon: Shield,
                title: "Enterprise Security",
                description: "Bank-grade encryption, SOC2 compliance, and granular role-based access control for your peace of mind."
              },
              {
                icon: BarChart2,
                title: "Custom Visualizations",
                description: "Create stunning, interactive charts and reports that tell a story. Export to PDF, CSV, or share live links."
              },
              {
                icon: Globe,
                title: "Global Scale",
                description: "Built on a distributed edge network to ensure low latency and high availability wherever you are."
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                  <feature.icon className="h-6 w-6 text-primary group-hover:text-white transition-colors" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{feature.title}</h4>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 bg-white dark:bg-background overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-6">
                From Raw Data to <br />
                <span className="text-primary">Strategic Decisions</span>
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
                SWIXREPORT simplifies the complex data journey into three seamless steps.
              </p>

              <div className="space-y-8">
                {[
                  {
                    step: "01",
                    title: "Connect Your Sources",
                    desc: "Link your databases, CRMs, and spreadsheets securely in minutes."
                  },
                  {
                    step: "02",
                    title: "Ask Questions",
                    desc: "Use natural language to query your data. 'Show me revenue by region'."
                  },
                  {
                    step: "03",
                    title: "Get AI Insights",
                    desc: "Receive auto-generated reports, forecasts, and anomaly alerts instantly."
                  }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{item.title}</h4>
                      <p className="text-slate-600 dark:text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl blur-3xl"></div>
              <div className="relative bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl p-6 rotate-2 hover:rotate-0 transition-transform duration-500">
                {/* Mock UI for "How it works" */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center gap-3 text-slate-300 mb-2">
                      <Brain className="h-5 w-5 text-purple-400" />
                      <span className="font-mono text-sm">Analyzing sales_data.csv...</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full w-2/3 bg-purple-500 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 h-32 flex items-end gap-1">
                      <div className="w-1/4 bg-blue-500 h-[40%] rounded-t"></div>
                      <div className="w-1/4 bg-blue-500 h-[60%] rounded-t"></div>
                      <div className="w-1/4 bg-blue-500 h-[30%] rounded-t"></div>
                      <div className="w-1/4 bg-blue-400 h-[80%] rounded-t animate-pulse"></div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 h-32 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-white mb-1">+127%</div>
                        <div className="text-xs text-green-400">Growth Rate</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to unlock your data's potential?</h2>
          <p className="text-xl text-blue-100 mb-10">
            Join thousands of data-driven companies using SWIXREPORT to grow faster.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-white text-primary hover:bg-slate-100 border-none shadow-xl">
                Get Started for Free
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-white text-white hover:bg-white/10 hover:text-white">
                Contact Sales
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-blue-200">No credit card required • 14-day free trial • Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-white">
                  <Layers className="h-5 w-5" />
                </div>
                <span className="text-xl font-bold text-white tracking-tight">SWIX<span className="text-primary">REPORT</span></span>
              </div>
              <p className="text-sm text-slate-400">
                Next-generation analytics platform powered by advanced AI neural networks.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Integrations</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Changelog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
            <p>&copy; 2024 SWIXREPORT Inc. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="#" className="hover:text-white transition-colors"><Globe className="h-5 w-5" /></Link>
              <Link href="#" className="hover:text-white transition-colors"><Shield className="h-5 w-5" /></Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
