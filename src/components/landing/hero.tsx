"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Search, Shield, Users } from "lucide-react";
import { LinkButton } from "@/components/link-button";
import { ContinueWithMobileForm } from "@/components/landing/continue-with-mobile";
import { HOME_HERO_ID } from "@/components/layout/home-brand-link";

export function HeroSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id={HOME_HERO_ID}
      className="relative scroll-mt-20 overflow-hidden px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-primary/[0.04]" />
        <div className="absolute -right-24 -top-32 size-[28rem] rounded-full bg-primary/[0.07]" />
        <div className="absolute -bottom-40 -left-20 size-[22rem] rounded-full bg-brand-highlight/20" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-8 xl:gap-10">
        <div className="min-w-0">
          <div className="mx-auto flex w-full max-w-2xl flex-col items-center text-center lg:mx-0 lg:max-w-3xl">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 0.4, delay: 0.08, ease: [0.22, 1, 0.36, 1] }
              }
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-accent/30 bg-brand-accent-soft px-4 py-1.5 text-sm font-medium text-brand-accent">
                <Shield className="size-4" />
                Trusted Employment Verification
              </span>
            </motion.div>

            <motion.h1
              className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]"
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] }
              }
            >
              Verify Stylist Employment{" "}
              <span className="text-primary">Before You Hire</span>
            </motion.h1>

            <motion.p
              className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-[1.05rem]"
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 0.4, delay: 0.28, ease: [0.22, 1, 0.36, 1] }
              }
            >
              Access verified stylist employment history in one place. Make confident
              hiring decisions with transparent records - without blacklists or guesswork.
            </motion.p>

            <motion.div
              className="mt-8 flex w-full justify-center"
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 0.4, delay: 0.42, ease: [0.22, 1, 0.36, 1] }
              }
            >
              <LinkButton
                href="/verify"
                size="lg"
                className="group relative h-12 w-full max-w-xs overflow-hidden px-8 text-base transition-[background-color,color] duration-500 ease-out hover:bg-[#B5945F] hover:text-[#0B2F2A] dark:hover:bg-[#B5945F] dark:hover:text-[#0B2F2A] sm:w-auto"
              >
                {!reduceMotion ? (
                  <motion.span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 -skew-x-12 bg-gradient-to-r from-transparent via-brand-highlight/50 to-transparent"
                    initial={{ x: "-120%", opacity: 0 }}
                    animate={{
                      x: ["-120%", "280%", "-120%"],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 1.1,
                      delay: 0.72,
                      ease: "easeInOut",
                      times: [0, 0.5, 1],
                    }}
                  />
                ) : null}
                <motion.span
                  className="relative z-20 mr-2 inline-flex shrink-0"
                  initial={reduceMotion ? false : { scale: 0.85, opacity: 0.6 }}
                  animate={
                    reduceMotion
                      ? { scale: 1, opacity: 1, rotate: 0 }
                      : {
                          // Forward once, then reverse once, settle at rest
                          scale: [0.85, 1.12, 1, 1.12, 0.85, 1],
                          opacity: [0.6, 1, 1, 1, 0.6, 1],
                          rotate: [0, -12, 0, -12, 0, 0],
                        }
                  }
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : {
                          duration: 1,
                          delay: 0.55,
                          ease: [0.22, 1, 0.36, 1],
                          times: [0, 0.18, 0.36, 0.54, 0.72, 1],
                        }
                  }
                >
                  <Search className="size-5 transition-transform duration-200 ease-out group-hover:scale-125" />
                </motion.span>
                <span className="relative z-20">Verify Stylist</span>
              </LinkButton>
            </motion.div>
          </div>

          <motion.div
            className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3"
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 0.4, delay: 0.7, ease: [0.22, 1, 0.36, 1] }
            }
          >
            {[
              { icon: Shield, label: "Verified Records", value: "100%" },
              { icon: Users, label: "Salon Network", value: "Growing" },
              { icon: Search, label: "Instant Lookup", value: "< 5 sec" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-[#D5E5E1] bg-[#F4F8F7] p-5 text-center shadow-[0_4px_12px_-2px_rgba(11,47,42,0.12),0_16px_40px_-12px_rgba(15,107,95,0.28),0_0_0_1px_rgba(15,107,95,0.06)]"
              >
                <stat.icon className="mx-auto size-5 text-[#B5945F]" />
                <p className="mt-2 text-xl font-bold text-[#0A544A]">
                  {stat.value}
                </p>
                <p className="text-sm text-[#0A544A]">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          className="mx-auto w-full max-w-[26rem] shrink-0 self-start lg:sticky lg:top-20 lg:mx-0 lg:w-[26rem] lg:max-w-none lg:self-start"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 0.45, delay: 0.35, ease: [0.22, 1, 0.36, 1] }
          }
        >
          <ContinueWithMobileForm />
        </motion.div>
      </div>
    </section>
  );
}
