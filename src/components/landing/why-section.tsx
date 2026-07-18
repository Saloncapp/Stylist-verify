"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Eye, FileCheck, TrendingUp } from "lucide-react";

const reasons = [
  {
    icon: AlertTriangle,
    title: "Frequent Job Changes",
    description:
      "Stylists often move between salons without proper documentation, leaving owners without reliable references.",
  },
  {
    icon: Eye,
    title: "No Centralized Records",
    description:
      "Employment history is scattered across phone calls and informal networks — there's no single source of truth.",
  },
  {
    icon: FileCheck,
    title: "Informed Hiring",
    description:
      "Stylist Verify provides verified employment records so you can hire with confidence, not guesswork.",
  },
  {
    icon: TrendingUp,
    title: "Industry Growth",
    description:
      "Better hiring decisions lead to stronger teams, lower turnover, and healthier salon businesses.",
  },
];

export function WhySection() {
  return (
    <section id="why" className="bg-muted/40 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Why Stylist Verify?
          </h2>
          <p className="mt-4 text-muted-foreground">
            The salon industry faces unique hiring challenges. We built a solution
            specifically for salon owners.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {reasons.map((item, index) => (
            <motion.div
              key={item.title}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <item.icon className="size-5" />
              </div>
              <h3 className="mt-4 font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
