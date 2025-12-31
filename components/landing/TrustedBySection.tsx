export function TrustedBySection() {
  return (
    <section className="py-12 border-y border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-sm text-slate-500 mb-10">
          Trusted by startups, enterprises, and industry giants alike.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-12 grayscale opacity-40">
          <div className="flex items-center space-x-1">
            <div className="h-8 w-8 bg-slate-300 rounded"></div>
            <div className="h-8 w-8 bg-slate-300 rounded"></div>
          </div>
          <div className="text-xl font-bold text-slate-400">Google</div>
          <div className="h-8 w-8 bg-slate-300 rounded"></div>
          <div className="text-xl font-bold text-slate-400">HubSpot</div>
          <div className="h-8 w-8 bg-slate-300 rounded"></div>
          <div className="text-xl font-bold text-slate-400">Walmart</div>
        </div>
      </div>
    </section>
  )
}

