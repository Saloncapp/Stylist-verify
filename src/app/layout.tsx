import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { themeInitScript } from "@/lib/theme-script";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Stylist Verify - Employment Verification for Salons",
    template: "%s | Stylist Verify",
  },
  description:
    "Verify stylist employment history before hiring. A trusted verification platform for the salon industry.",
  applicationName: "Stylist Verify",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://stylistverify.com"
  ),
  openGraph: {
    title: "Stylist Verify - Employment Verification for Salons",
    description:
      "Verify stylist employment history before hiring. A trusted verification platform for the salon industry.",
    siteName: "Stylist Verify",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stylist Verify — Employment Verification for Salons",
    description:
      "Verify stylist employment history before hiring. A trusted verification platform for the salon industry.",
  },
  icons: {
    icon: [{ url: "/icon.png" }, { url: "/favicon.png" }],
    apple: [{ url: "/apple-icon.png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} h-full`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
          suppressHydrationWarning
        />
      </head>
      <body className="min-h-full flex flex-col font-sans antialiased">
        <ThemeProvider>
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
