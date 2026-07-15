"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "Is Salon Staff a blacklist platform?",
    answer:
      "No. Salon Staff is not designed to blacklist stylists. It provides verified employment records so salon owners can make informed hiring decisions based on factual history.",
  },
  {
    question: "How do I verify a stylist?",
    answer:
      "Use the Verify Stylist page and search by the stylist's Aadhaar number or mobile number. If records exist, you'll see their employment history across all participating salons.",
  },
  {
    question: "Can the same stylist appear under multiple salons?",
    answer:
      "Yes. If a stylist has worked at multiple salons that use Salon Staff, all employment records will appear in chronological order on the verification page.",
  },
  {
    question: "What information is required to register a stylist?",
    answer:
      "You'll need the stylist's name, mobile number, level (L1–L4), Aadhaar number, address, photo, and current employment status.",
  },
  {
    question: "Is my salon data secure?",
    answer:
      "Yes. All data is stored securely with encrypted authentication. Only authorized salon owners can manage their own stylist records.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-muted-foreground">
            Everything you need to know about Salon Staff
          </p>
        </div>

        <div className="mt-12 divide-y divide-border rounded-2xl border border-border bg-card">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={faq.question}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-6 py-4 text-left text-base font-medium transition-colors hover:text-primary"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                >
                  {faq.question}
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 text-muted-foreground transition-transform",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-4 text-sm leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
