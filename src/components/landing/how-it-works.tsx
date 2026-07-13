"use client";

import { motion } from "framer-motion";

const steps = [
  {
    step: "01",
    title: "Register Your Salon",
    description:
      "Create a free account with your salon details. Start managing your stylist records in minutes.",
  },
  {
    step: "02",
    title: "Add & Manage Stylists",
    description:
      "Register stylists with their details, photos, and employment status. Update records as situations change.",
  },
  {
    step: "03",
    title: "Verify Before Hiring",
    description:
      "Search by Aadhaar or mobile number to view a stylist's complete employment history across salons.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-4 text-muted-foreground">
            Three simple steps to better hiring decisions
          </p>
        </div>

        <div className="relative mt-16">
          <div className="absolute left-0 right-0 top-12 hidden h-0.5 bg-border lg:block" />
          <div className="grid gap-8 lg:grid-cols-3">
            {steps.map((item, index) => (
              <motion.div
                key={item.step}
                className="relative text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.15 }}
              >
                <div className="relative z-10 mx-auto flex size-24 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
                  <span className="text-3xl font-bold text-primary">{item.step}</span>
                </div>
                <h3 className="mt-6 text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
