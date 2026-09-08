import type { ReactNode } from "react";
import { Footer } from "@/components/layout/footer";
import { LegalBackButton } from "@/components/layout/legal-back-button";
import { Navbar } from "@/components/layout/navbar";

type LegalDocumentProps = {
  title: string;
  lastUpdated: string;
  children: ReactNode;
};

export function LegalDocument({
  title,
  lastUpdated,
  children,
}: LegalDocumentProps) {
  return (
    <>
      <Navbar variant="auth" />
      <main className="flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-start gap-3 sm:-ml-11 sm:gap-2">
            <LegalBackButton />
            <article className="min-w-0 flex-1">
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {title}
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Last updated {lastUpdated}
              </p>
              <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground [&_h2]:text-base [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground [&_p+p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
                {children}
              </div>
            </article>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
