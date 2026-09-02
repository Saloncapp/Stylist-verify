"use client";

import { motion } from "framer-motion";
import { Search, Shield, Users } from "lucide-react";
import { LinkButton } from "@/components/link-button";
import { ContinueWithMobileForm } from "@/components/landing/continue-with-mobile";
import { HOME_HERO_ID } from "@/components/layout/home-brand-link";

export function HeroSection() {
  return (
    <section
      id={HOME_HERO_ID}
      className="relative scroll-mt-20 overflow-hidden px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute right-0 top-24 h-[400px] w-[500px] rounded-full bg-primary/[0.03] blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-8 xl:gap-10">
        <div className="min-w-0">
          <div className="mx-auto flex w-full max-w-2xl flex-col items-center text-center lg:mx-0 lg:max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
                <Shield className="size-4" />
                Trusted Employment Verification
              </span>
            </motion.div>

            <motion.h1
              className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Verify Stylist Employment{" "}
              <span className="text-primary">Before You Hire</span>
            </motion.h1>

            <motion.p
              className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Stylist Verify helps salon owners make informed hiring decisions with
              verified employment records — not blacklists, just transparent history.
            </motion.p>

            <motion.div
              className="mt-8 flex w-full justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <LinkButton
                href="/verify"
                size="lg"
                className="h-12 w-full max-w-xs px-8 text-base sm:w-auto"
              >
                <Search className="mr-2 size-5 shrink-0" />
                Verify Stylist
              </LinkButton>
            </motion.div>
          </div>

          <motion.div
            className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {[
              { icon: Shield, label: "Verified Records", value: "100%" },
              { icon: Users, label: "Salon Network", value: "Growing" },
              { icon: Search, label: "Instant Lookup", value: "< 5 sec" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-border bg-card/80 p-5 text-center shadow-sm"
              >
                <stat.icon className="mx-auto size-5 text-primary" />
                <p className="mt-2 text-xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          className="mx-auto w-full max-w-[26rem] shrink-0 self-start lg:sticky lg:top-20 lg:mx-0 lg:w-[26rem] lg:max-w-none lg:self-start"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <ContinueWithMobileForm />
        </motion.div>
      </div>
    </section>
  );
}
