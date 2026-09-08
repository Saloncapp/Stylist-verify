import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { HomeBrandLink } from "@/components/layout/home-brand-link";

const footerLinkClass =
  "transition-colors hover:text-[#B5945F] focus-visible:text-[#B5945F] focus-visible:outline-none dark:hover:text-[#B5945F] dark:focus-visible:text-[#B5945F]";

const legalLinkClass =
  "text-white/75 underline-offset-4 transition-colors hover:text-[#B5945F] hover:underline focus-visible:text-[#B5945F] focus-visible:underline focus-visible:outline-none dark:text-white/75 dark:hover:text-[#B5945F] dark:focus-visible:text-[#B5945F]";

export function Footer() {
  return (
    <footer className="bg-[#0F6B5F] text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3 md:gap-8">
          <div className="sm:col-span-2 md:col-span-1">
            <HomeBrandLink className="group inline-flex items-center gap-2.5">
              <BrandMark size={40} className="size-10" variant="navbar" />
              <span className="font-semibold tracking-tight text-white transition-colors group-hover:text-[#B5945F] group-focus-visible:text-[#B5945F] dark:text-white dark:group-hover:text-[#B5945F] dark:group-focus-visible:text-[#B5945F]">
                Stylist Verify
              </span>
            </HomeBrandLink>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/75">
              A trusted employment verification platform for the salon industry.
              Make informed hiring decisions with verified stylist records.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold tracking-tight text-white">
              Platform
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-white/75">
              <li>
                <Link href="/verify" className={footerLinkClass}>
                  Verify Stylist
                </Link>
              </li>
              <li>
                <Link href="/#continue-with-mobile" className={footerLinkClass}>
                  Sign in
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold tracking-tight text-white">
              Contact
            </h3>
            <p className="mt-4 text-sm text-white/75">
              <a href="mailto:support@saloncapp.com" className={footerLinkClass}>
                support@saloncapp.com
              </a>
            </p>
            <p className="mt-2 text-sm text-white/75">
              Built for salon owners across India
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 border-t border-white/15 pt-6 text-sm text-white/70 md:flex-row md:justify-between md:gap-6">
          <p className="text-center md:text-left">
            © 2026 Saloncapp Technologies Private Limited.
          </p>
          <nav
            aria-label="Legal"
            className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1"
          >
            <Link href="/privacy" className={legalLinkClass}>
              Privacy Policy
            </Link>
            <span className="select-none text-white/40" aria-hidden="true">
              ·
            </span>
            <Link href="/terms" className={legalLinkClass}>
              Terms of Service
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
