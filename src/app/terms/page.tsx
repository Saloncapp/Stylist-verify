import type { Metadata } from "next";
import { LegalDocument } from "@/components/layout/legal-document";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of use for Stylist Verify, operated by Saloncapp Technologies Private Limited.",
};

export default function TermsPage() {
  return (
    <LegalDocument title="Terms of Service" lastUpdated="September 8, 2026">
      <section>
        <h2>Agreement</h2>
        <p>
          These Terms of Service govern your use of Stylist Verify, an employment
          verification platform operated by Saloncapp Technologies Private
          Limited. By accessing or using the platform, you agree to these terms.
        </p>
      </section>

      <section>
        <h2>The service</h2>
        <p>
          Stylist Verify helps salon owners review verified stylist employment
          records so they can make informed hiring decisions. The platform is
          not designed to blacklist stylists. Records reflect factual employment
          history submitted by participating salons.
        </p>
      </section>

      <section>
        <h2>Accounts and eligibility</h2>
        <p>
          You must provide accurate information when creating an account and
          keep your login details secure. Salon owners are responsible for
          stylist records they add or update. You may only use the platform for
          lawful hiring and employment verification purposes.
        </p>
      </section>

      <section>
        <h2>Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Submit false, misleading, or unauthorized employment records</li>
          <li>Access another user’s account without permission</li>
          <li>Misuse verification results or personal information</li>
          <li>Interfere with the security or availability of the platform</li>
        </ul>
      </section>

      <section>
        <h2>Records and decisions</h2>
        <p>
          Verification results depend on information provided by participating
          salons. We do not guarantee that records are complete or that a hiring
          decision based on them will produce a particular outcome. Salon owners
          remain responsible for their own hiring decisions.
        </p>
      </section>

      <section>
        <h2>Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, Saloncapp Technologies Private
          Limited is not liable for indirect, incidental, or consequential
          damages arising from your use of Stylist Verify, including hiring
          outcomes or reliance on employment records.
        </p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>
          We may update these terms from time to time. Continued use of Stylist
          Verify after changes are posted means you accept the revised terms.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions about these terms can be sent to{" "}
          <a
            href="mailto:support@saloncapp.com"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            support@saloncapp.com
          </a>
          .
        </p>
      </section>
    </LegalDocument>
  );
}
