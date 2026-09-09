import type { Metadata } from "next";
import { LegalDocument } from "@/components/layout/legal-document";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Saloncapp Technologies Private Limited collects, uses, and protects information on Stylist Verify.",
};

export default function PrivacyPage() {
  return (
    <LegalDocument title="Privacy Policy" lastUpdated="September 9, 2026">
      <section>
        <h2>Who we are</h2>
        <p>
          Stylist Verify is operated by Saloncapp Technologies Private Limited
          (“we”, “us”, or “our”). This policy explains how we collect, use, and
          protect information when you use our employment verification platform
          and related hiring tools for the salon industry, including job posts,
          applicant interest, and open-to-work discovery for salon owners and
          stylists.
        </p>
      </section>

      <section>
        <h2>Information we collect</h2>
        <p>Depending on how you use Stylist Verify, we may collect:</p>
        <ul>
          <li>
            Account and authentication details such as name, mobile number,
            salon information, phone OTP verification data, recovery PIN (stored
            hashed), and related session data
          </li>
          <li>
            Salon profile details such as salon name, address, logo, contact
            information, maps links, website, and social links
          </li>
          <li>
            Stylist employment records, including name, contact details, Aadhaar
            number, address, photo, skill level, employment status and remarks,
            role, employment type, joining and leaving dates, performance
            ratings, manager feedback, specialist services, and related
            certificates or letters
          </li>
          <li>
            Hiring and matching information such as job posts, applications,
            interest requests, and open-to-work preferences
          </li>
          <li>
            Uploaded photos and documents used for profiles or employment
            records
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
          <li>
            Provide employment verification and related platform services,
            including identity matching and search by Aadhaar or mobile number
          </li>
          <li>Create and manage salon and stylist accounts, including recovery</li>
          <li>
            Help salon owners review verified stylist employment history and
            make hiring decisions
          </li>
          <li>
            Support job posting, applicant interest, and open-to-work matching
            between salons and stylists
          </li>
          <li>Maintain security, prevent misuse, and improve the product</li>
        </ul>
      </section>

      <section>
        <h2>How information is shared</h2>
        <p>
          Verified employment records may be shown to authorized salon owners who
          search the platform; Aadhaar and similar identifiers may be shown in
          masked form where appropriate. Open-to-work profiles and applicant or
          interest details may be shared with relevant salons. Job posts may be
          shown to stylists. We do not sell personal information. We may share
          information with service providers who help us operate Stylist Verify
          (such as authentication, hosting, and file storage providers), or when
          required by law.
        </p>
      </section>

      <section>
        <h2>Security and retention</h2>
        <p>
          We store data securely. Aadhaar numbers are stored hashed and
          encrypted, recovery PINs are stored hashed, and authentication uses
          secure phone verification. We retain information for as long as needed
          to provide the service, meet legal obligations, and resolve disputes.
          Only authorized users can manage records they are permitted to access.
        </p>
      </section>

      <section>
        <h2>Your choices</h2>
        <p>
          Stylists may update certain profile details and open-to-work settings
          from their dashboard. Salon owners may update salon profile information
          and the stylist employment records they submit. Salon-submitted
          employment history is not freely editable by stylists. To request a
          correction, deletion, or other privacy inquiry—including a dispute
          about an employment record—contact us using the details below.
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
