import type { Metadata } from "next";
import { LegalDocument } from "@/components/layout/legal-document";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Saloncapp Technologies Private Limited collects, uses, and protects information on Stylist Verify.",
};

export default function PrivacyPage() {
  return (
    <LegalDocument title="Privacy Policy" lastUpdated="September 8, 2026">
      <section>
        <h2>Who we are</h2>
        <p>
          Stylist Verify is operated by Saloncapp Technologies Private Limited
          (“we”, “us”, or “our”). This policy explains how we collect, use, and
          protect information when you use our employment verification platform
          for the salon industry.
        </p>
      </section>

      <section>
        <h2>Information we collect</h2>
        <p>Depending on how you use Stylist Verify, we may collect:</p>
        <ul>
          <li>
            Account details such as name, mobile number, salon information, and
            authentication data
          </li>
          <li>
            Stylist employment records, including name, contact details, Aadhaar
            number, address, photo, skill level, and employment status
          </li>
          <li>
            Verification search activity and related platform usage information
          </li>
        </ul>
      </section>

      <section>
        <h2>How we use information</h2>
        <p>We use this information to:</p>
        <ul>
          <li>Provide employment verification and related platform services</li>
          <li>Create and manage salon and stylist accounts</li>
          <li>Help salon owners review verified stylist employment history</li>
          <li>Maintain security, prevent misuse, and improve the product</li>
        </ul>
      </section>

      <section>
        <h2>How information is shared</h2>
        <p>
          Verified employment records may be shown to authorized salon owners
          who search the platform. We do not sell personal information. We may
          share information with service providers who help us operate Stylist
          Verify, or when required by law.
        </p>
      </section>

      <section>
        <h2>Security and retention</h2>
        <p>
          We store data securely and use encrypted authentication. We retain
          information for as long as needed to provide the service, meet legal
          obligations, and resolve disputes. Only authorized users can manage
          records they are permitted to access.
        </p>
      </section>

      <section>
        <h2>Your choices</h2>
        <p>
          Account holders may update certain profile and employment details from
          their dashboard. To request a correction, deletion, or other privacy
          inquiry, contact us using the details below.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          For privacy questions, email{" "}
          <a
            href="mailto:support@saloncapp.com"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            support@saloncapp.com
          </a>
          . Stylist Verify is a product of Saloncapp Technologies Private
          Limited.
        </p>
      </section>
    </LegalDocument>
  );
}
