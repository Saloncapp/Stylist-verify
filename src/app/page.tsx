import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/landing/hero";
import { WhySection } from "@/components/landing/why-section";
import { HowItWorksSection } from "@/components/landing/how-it-works";
import { BenefitsSection } from "@/components/landing/benefits";
import { FAQSection } from "@/components/landing/faq";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <WhySection />
        <HowItWorksSection />
        <BenefitsSection />
        <FAQSection />
      </main>
      <Footer />
    </>
  );
}
