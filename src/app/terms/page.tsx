import type { Metadata } from "next";
import { LegalDocument } from "@/components/layout/legal-document";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of use for Stylist Verify, operated by Saloncapp Technologies Private Limited.",
};

export default function TermsPage() {
  return (
    <LegalDocument title="Terms of Service" lastUpdated="September 9, 2026">
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
          Stylist Verify is used by salon owners and stylists. Salon owners can
          review verified stylist employment records and use related hiring tools
          such as job posts, applicant interest, and open-to-work discovery.
          Stylists can create profiles, view their employment history, mark
          themselves open to work, and express interest in salon jobs. The
          platform is not designed to blacklist stylists. Records reflect factual
          employment history submitted by participating salons, including
          employment status and related remarks.
        </p>
      </section>

      <section>
        <h2>Accounts and eligibility</h2>
        <p>
          Accounts are available for salon owners and stylists. You must provide
          accurate information when creating an account and keep your phone-based
          login, OTP access, and recovery PIN secure. Salon owners are
          responsible for stylist records they add or update. Stylists are
          responsible for the accuracy of their own profile and account
          information. You may only use the platform for lawful hiring,
          employment verification, and related job-matching purposes.
        </p>
      </section>

      <section>
        <h2>Sensitive information</h2>
        <p>
          Some records may include sensitive personal information such as Aadhaar
          number, photo, contact details, and address. You may submit this
          information only when you are authorized to do so and only if it is
          accurate. You must not collect, share, or use such information except
          for lawful Stylist Verify purposes.
        </p>
      </section>

      <section>
        <h2>Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Submit false, misleading, or unauthorized employment records</li>
          <li>
            Mark employment status (including Relieved or Abscond) or add remarks
            without a factual basis
          </li>
          <li>
            Submit personal or sensitive stylist data without proper
            authorization
          </li>
          <li>Access another user&apos;s account without permission</li>
          <li>
            Misuse verification results, job applications, applicant information,
            or other personal information
          </li>
          <li>Interfere with the security or availability of the platform</li>
        </ul>
      </section>

      <section>
        <h2>Records and decisions</h2>
        <p>
          Verification results depend on information provided by participating
          salons, including employment status and remarks. We do not guarantee
          that records are complete or that a hiring decision based on them will
          produce a particular outcome. Salon owners remain responsible for their
          own hiring decisions. If you believe a record is inaccurate, contact us
          at{" "}
          <a
            href="mailto:support@saloncapp.com"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            support@saloncapp.com
          </a>{" "}
          to request a review or correction.
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
        <h2>Governing law</h2>
        <p>
          These terms are governed by the laws of India. Courts in India have
          jurisdiction over disputes arising from these terms or your use of
          Stylist Verify, subject to applicable law.
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
