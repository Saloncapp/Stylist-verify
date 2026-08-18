"use client";

import type { ComponentType } from "react";
import Image from "next/image";
import { Globe, Mail, Phone, Store } from "lucide-react";
import {
  FacebookIcon,
  GoogleMapsIcon,
  InstagramIcon,
  SOCIAL_LINK_BRAND_STYLES,
  WhatsAppIcon,
  YoutubeIcon,
} from "@/components/social-brand-icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SalonTypeBadge } from "@/components/salon-type-badge";
import {
  normalizeOptionalUrl,
  whatsappContactUrl,
} from "@/lib/salon-constants";
import type { SalonVisitProfile } from "@/types";
import { cn } from "@/lib/utils";

const NO_DATA = "No data available";

interface VisitSalonDialogProps {
  salon: SalonVisitProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SocialLinkLabel = keyof typeof SOCIAL_LINK_BRAND_STYLES;

interface SocialLinkConfig {
  href: string;
  label: SocialLinkLabel;
  icon: ComponentType<{ className?: string }>;
}

function displayValue(value?: string): string {
  return value?.trim() ? value.trim() : NO_DATA;
}

function SocialLink({ href, label, icon: Icon }: SocialLinkConfig) {
  const brand = SOCIAL_LINK_BRAND_STYLES[label];

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-xl border border-border/60 transition-all duration-200",
        "hover:-translate-y-0.5 active:translate-y-0",
        brand.buttonClassName
      )}
    >
      <Icon className={cn("size-5", brand.iconClassName)} />
    </a>
  );
}

export function VisitSalonDialog({
  salon,
  open,
  onOpenChange,
}: VisitSalonDialogProps) {
  if (!salon) return null;

  const mapsUrl = salon.googleMapsLocation
    ? normalizeOptionalUrl(salon.googleMapsLocation)
    : "";
  const websiteUrl = salon.websiteUrl
    ? normalizeOptionalUrl(salon.websiteUrl)
    : "";
  const instagramUrl = salon.instagramUrl
    ? normalizeOptionalUrl(salon.instagramUrl)
    : "";
  const facebookUrl = salon.facebookUrl
    ? normalizeOptionalUrl(salon.facebookUrl)
    : "";
  const youtubeUrl = salon.youtubeUrl
    ? normalizeOptionalUrl(salon.youtubeUrl)
    : "";
  const whatsappUrl = whatsappContactUrl(salon.whatsappNumber);
  const phoneHref = salon.salonNumber ? `tel:+91${salon.salonNumber}` : "";
  const emailHref = salon.salonEmail ? `mailto:${salon.salonEmail}` : "";

  const socialLinks = (
    [
      { href: mapsUrl, label: "Google Maps", icon: GoogleMapsIcon },
      { href: websiteUrl, label: "Website", icon: Globe },
      { href: instagramUrl, label: "Instagram", icon: InstagramIcon },
      { href: facebookUrl, label: "Facebook", icon: FacebookIcon },
      { href: whatsappUrl, label: "WhatsApp", icon: WhatsAppIcon },
      { href: youtubeUrl, label: "YouTube", icon: YoutubeIcon },
    ] satisfies SocialLinkConfig[]
  ).filter((link) => Boolean(link.href));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Visit Salon</DialogTitle>
          <DialogDescription>
            Salon details for this employment record
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted">
              {salon.salonLogoUrl ? (
                <Image
                  src={salon.salonLogoUrl}
                  alt={`${salon.salonName} logo`}
                  fill
                  className="object-cover"
                />
              ) : (
                <Store className="size-7 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold">{salon.salonName}</p>
              <SalonTypeBadge type={salon.salonType} className="mt-1.5" />
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4 text-sm">
            <p>
              <span className="text-muted-foreground">Salon Address:</span>{" "}
              {displayValue(salon.salonAddress)}
            </p>
            <p className="flex items-start gap-2">
              <Phone className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span>
                <span className="text-muted-foreground">Salon Phone:</span>{" "}
                {salon.salonNumber ? (
                  <a
                    href={phoneHref}
                    className="font-medium text-primary hover:underline"
                  >
                    {salon.salonNumber}
                  </a>
                ) : (
                  NO_DATA
                )}
              </span>
            </p>
            <p className="flex items-start gap-2">
              <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span>
                <span className="text-muted-foreground">Salon Email:</span>{" "}
                {salon.salonEmail ? (
                  <a
                    href={emailHref}
                    className="break-all font-medium text-primary hover:underline"
                  >
                    {salon.salonEmail}
                  </a>
                ) : (
                  NO_DATA
                )}
              </span>
            </p>
          </div>

          {socialLinks.length > 0 ? (
            <div>
              <p className="mb-3 text-sm font-medium">Connect with Salon</p>
              <div className="flex flex-wrap gap-2.5">
                {socialLinks.map((link) => (
                  <SocialLink key={link.label} {...link} />
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No external salon links available.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
