"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, ArrowRight } from "lucide-react"

export function TestimonialsSection() {
  const testimonials = [
    {
      name: 'Mitchell',
      handle: '@saasfm',
      text: 'It has completely transformed how our small sales team manages our platform. Simple yet powerful.',
      rating: 4
    },
    {
      name: 'John Cage',
      handle: '@johny',
      text: 'Finally, a dashboard that shows everything—users, orders, revenue—all in one place.',
      rating: 4
    },
    {
      name: 'Ethan Parker',
      handle: '@Ethanprk2',
      text: 'The interface is intuitive and we cut our deal cycle in half since making the move.',
      rating: 4
    }
  ]

  return (
    <section id="testimonials" className="py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">TESTIMONIALS</p>
          <h2 className="text-[40px] font-bold mb-4 text-slate-900 leading-tight">
            Trusted by People Who Sell Smarter
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Real stories from users who simplified their sales process.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {testimonials.map((testimonial, i) => (
            <Card key={i} className="p-6 hover:shadow-lg transition-shadow border-slate-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-slate-300"></div>
                <div>
                  <p className="font-bold text-slate-900">{testimonial.name}</p>
                  <p className="text-sm text-slate-500">{testimonial.handle}</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">{testimonial.text}</p>
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, starIdx) => (
                  <Star key={starIdx} className={`h-4 w-4 ${starIdx < testimonial.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                ))}
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <span className="text-5xl font-bold text-slate-900">4.5</span>
            <Star className="h-8 w-8 fill-amber-400 text-amber-400" />
          </div>
          <p className="text-sm text-slate-500 mb-6">Start out of 5</p>
          <Button variant="outline" className="rounded-full">
            View all testimonials <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}
