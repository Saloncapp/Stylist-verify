import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <ShieldCheck className="size-4" />
              </div>
              <span className="font-semibold">StylistVerify</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              A trusted employment verification platform for the salon industry.
              Make informed hiring decisions with verified stylist records.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Platform</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/verify" className="hover:text-foreground">
                  Verify Stylist
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-foreground">
                  Register Salon
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-foreground">
                  Login
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Contact</h3>
            <p className="mt-4 text-sm text-muted-foreground">
              support@stylistverify.com
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Built for salon owners across India
            </p>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} StylistVerify. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
