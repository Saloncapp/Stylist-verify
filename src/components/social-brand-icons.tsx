import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

type IconProps = SVGProps<SVGSVGElement> & { className?: string };

export function GoogleMapsIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("size-5", className)}
      aria-hidden="true"
      {...props}
    >
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
    </svg>
  );
}

export function InstagramIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("size-5", className)}
      aria-hidden="true"
      {...props}
    >
      <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
    </svg>
  );
}

export function FacebookIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("size-5", className)}
      aria-hidden="true"
      {...props}
    >
      <path d="M13.5 8.5V6.75c0-.69.56-1.25 1.25-1.25h1.5V3h-2.75C11.01 3 9.5 4.51 9.5 6.5V8.5H7v2.75h2.5V21h3.75v-9.75H17l.5-2.75h-4z" />
    </svg>
  );
}

export function WhatsAppIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("size-5", className)}
      aria-hidden="true"
      {...props}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.435 9.884-9.884 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

export function YoutubeIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("size-5", className)}
      aria-hidden="true"
      {...props}
    >
      <path d="M21.8 8.001a2.75 2.75 0 0 0-1.94-1.94C18.2 6 12 6 12 6s-6.2 0-7.86.061A2.75 2.75 0 0 0 2.2 8.001 28.9 28.9 0 0 0 2.14 12a28.9 28.9 0 0 0 .06 3.999 2.75 2.75 0 0 0 1.94 1.94C5.8 18 12 18 12 18s6.2 0 7.86-.061a2.75 2.75 0 0 0 1.94-1.94c.061-.666.06-2.333.06-3.999 0-1.666 0-3.333-.06-3.999zM10 15.5v-7l6 3.5-6 3.5z" />
    </svg>
  );
}

export const SOCIAL_LINK_BRAND_STYLES = {
  "Google Maps": {
    iconClassName: "text-[#EA4335]",
    buttonClassName:
      "bg-[#EA4335]/10 hover:bg-[#EA4335]/20 hover:shadow-[0_2px_8px_rgba(234,67,53,0.25)]",
  },
  Website: {
    iconClassName: "text-primary",
    buttonClassName:
      "bg-primary/10 hover:bg-primary/15 hover:shadow-[0_2px_8px_rgba(59,130,246,0.2)]",
  },
  Instagram: {
    iconClassName: "text-white",
    buttonClassName:
      "bg-gradient-to-br from-[#833AB4] via-[#E4405F] to-[#F77737] hover:opacity-90 hover:shadow-[0_2px_8px_rgba(228,64,95,0.35)]",
  },
  Facebook: {
    iconClassName: "text-[#1877F2]",
    buttonClassName:
      "bg-[#1877F2]/10 hover:bg-[#1877F2]/20 hover:shadow-[0_2px_8px_rgba(24,119,242,0.25)]",
  },
  WhatsApp: {
    iconClassName: "text-[#25D366]",
    buttonClassName:
      "bg-[#25D366]/10 hover:bg-[#25D366]/20 hover:shadow-[0_2px_8px_rgba(37,211,102,0.25)]",
  },
  YouTube: {
    iconClassName: "text-[#FF0000]",
    buttonClassName:
      "bg-[#FF0000]/10 hover:bg-[#FF0000]/20 hover:shadow-[0_2px_8px_rgba(255,0,0,0.2)]",
  },
} as const;
