import { ExternalLink } from "lucide-react";
import { normalizeOptionalUrl } from "@/lib/salon-constants";
import type { SalonIdentityFields } from "@/types";

const NO_DATA = "No data available";

function displayText(value?: string | number | null): string {
  if (value == null || String(value).trim() === "") return NO_DATA;
  return String(value);
}

function OptionalLink({
  href,
  label,
}: {
  href?: string;
  label: string;
}) {
  const url = href ? normalizeOptionalUrl(href) : "";
  if (!url) {
    return <span>{NO_DATA}</span>;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
    >
      {label}
      <ExternalLink className="size-3.5" />
    </a>
  );
}

export function SalonInfoDetails({
  salonAddress,
  googleMapsLocation,
  websiteUrl,
  establishmentYear,
  className,
}: Partial<SalonIdentityFields> & { className?: string }) {
  return (
    <div className={className}>
      <p className="text-sm font-medium">Salon Information</p>
      <div className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
        <p className="sm:col-span-2">
          <span className="text-muted-foreground">Salon Address:</span>{" "}
          {displayText(salonAddress)}
        </p>
        <p>
          <span className="text-muted-foreground">Google Maps Location:</span>{" "}
          <OptionalLink href={googleMapsLocation} label="View on Google Maps" />
        </p>
        <p>
          <span className="text-muted-foreground">Salon Website:</span>{" "}
          <OptionalLink href={websiteUrl} label="Visit website" />
        </p>
        <p>
          <span className="text-muted-foreground">Establishment Year:</span>{" "}
          {displayText(establishmentYear)}
        </p>
      </div>
    </div>
  );
}
