"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const benefits = [
  "Verify employment history before making hiring decisions",
  "Track active, relieved, and absconded stylists in one dashboard",
  "View complete cross-salon employment records chronologically",
  "Maintain documented remarks for every status change",
  "Upload stylist photos for easy identification",
  "Secure, centralized records accessible anytime",
  "Not a blacklist — transparent, factual employment data",
  "Designed specifically for the Indian salon industry",
];

export function BenefitsSection() {
  return (
    <section id="benefits" className="bg-muted/40 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Benefits for Salon Owners
            </h2>
            <p className="mt-4 text-muted-foreground">
              Stylist Verify gives you the tools to hire smarter and manage your
              team with complete visibility.
            </p>
          </div>

          <motion.ul
            className="space-y-4"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
                <span className="text-sm leading-relaxed">{benefit}</span>
              </li>
            ))}
          </motion.ul>
        </div>
      </div>
    </section>
  );
}
