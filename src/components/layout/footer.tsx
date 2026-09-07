import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { HomeBrandLink } from "@/components/layout/home-brand-link";

export function Footer() {
  return (
    <footer className="border-t border-primary-foreground/15 bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <HomeBrandLink className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-90">
              <BrandMark size={40} className="size-10" />
              <span className="font-semibold text-primary-foreground">
                Stylist Verify
              </span>
            </HomeBrandLink>
            <p className="mt-4 text-sm leading-relaxed text-primary-foreground/75">
              A trusted employ ment verification platform for the salon industry.
              Make informed hiring decisions with verified stylist records.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-primary-foreground">
              Platform
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-primary-foreground/75">
              <li>
                <Link
                  href="/verify"
                  className="transition-colors hover:text-primary-foreground"
                >
                  Verify Stylist
                </Link>
              </li>
              <li>
                <Link
                  href="/#continue-with-mobile"
                  className="transition-colors hover:text-primary-foreground"
                >
                  Sign in
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-primary-foreground">
              Contact
            </h3>
            <p className="mt-4 text-sm text-primary-foreground/75">
              support@stylistverify.com
            </p>
            <p className="mt-1 text-sm text-primary-foreground/75">
              Built for salon owners across India
            </p>
          </div>
        </div>

        <div className="mt-10 border-t border-primary-foreground/15 pt-6 text-center text-sm text-primary-foreground/65">
          © 2026 Salon Capp. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
