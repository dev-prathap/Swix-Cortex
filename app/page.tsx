import { Navbar } from "@/components/landing/Navbar"
import { HeroSection } from "@/components/landing/HeroSection"
import { StatsSection } from "@/components/landing/StatsSection"
import { VideoSection } from "@/components/landing/VideoSection"
import { IntegrationSection } from "@/components/landing/IntegrationSection"
import { FeaturesSection } from "@/components/landing/FeaturesSection"
import { BenefitsSection } from "@/components/landing/BenefitsSection"
import { ComparisonSection } from "@/components/landing/ComparisonSection"
import { TestimonialsSection } from "@/components/landing/TestimonialsSection"
import { FAQSection } from "@/components/landing/FAQSection"
import { CTASection } from "@/components/landing/CTASection"
import { Footer } from "@/components/landing/Footer"
import { TrustedBySection } from "@/components/landing/TrustedBySection"

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />
      <HeroSection />
      <TrustedBySection />
      <StatsSection />
      <FeaturesSection />
      <VideoSection />
      <IntegrationSection />
      <BenefitsSection />
      <ComparisonSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  )
}
