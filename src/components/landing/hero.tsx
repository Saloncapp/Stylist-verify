"use client";

import { motion } from "framer-motion";
import { ArrowRight, Search, Shield, Users } from "lucide-react";
import { LinkButton } from "@/components/link-button";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-4xl text-center">
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
          className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Verify Stylist Employment{" "}
          <span className="text-primary">Before You Hire</span>
        </motion.h1>

        <motion.p
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Stylist Verify helps salon owners make informed hiring decisions with
          verified employment records — not blacklists, just transparent history.
        </motion.p>

        <motion.div
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <LinkButton href="/verify" size="lg" className="h-12 px-8 text-base">
            <Search className="mr-2 size-5" />
            Verify Stylist
          </LinkButton>
          <LinkButton
            href="/register"
            size="lg"
            variant="outline"
            className="h-12 px-8 text-base"
          >
            Register Your Salon
            <ArrowRight className="ml-2 size-5" />
          </LinkButton>
        </motion.div>

        <motion.div
          className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3"
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
              className="rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <stat.icon className="mx-auto size-6 text-primary" />
              <p className="mt-3 text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
