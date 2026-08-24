"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  Suspense,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AddStylistDialog } from "@/components/dashboard/add-stylist-dialog";
import type { HiringApplicationCard } from "@/types";

type AddStylistContextValue = {
  openAddStylist: () => void;
  openHireApplicant: (
    application: HiringApplicationCard,
    onComplete?: (application: HiringApplicationCard) => void
  ) => void;
};

const AddStylistContext = createContext<AddStylistContextValue | null>(null);

export function useAddStylist() {
  const ctx = useContext(AddStylistContext);
  if (!ctx) {
    throw new Error("useAddStylist must be used within AddStylistProvider");
  }
  return ctx;
}

function AddStylistQueryOpener({
  onOpen,
}: {
  onOpen: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("add") === "1") {
      onOpen();
      const next = new URLSearchParams(searchParams.toString());
      next.delete("add");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }, [searchParams, pathname, router, onOpen]);

  return null;
}

export function AddStylistProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [hireApplication, setHireApplication] =
    useState<HiringApplicationCard | null>(null);
  const hireCompleteRef = useRef<
    ((application: HiringApplicationCard) => void) | null
  >(null);

  const openAddStylist = useCallback(() => {
    setHireApplication(null);
    hireCompleteRef.current = null;
    setOpen(true);
  }, []);

  const openHireApplicant = useCallback(
    (
      application: HiringApplicationCard,
      onComplete?: (application: HiringApplicationCard) => void
    ) => {
      setHireApplication(application);
      hireCompleteRef.current = onComplete ?? null;
      setOpen(true);
    },
    []
  );

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (!next) {
      setHireApplication(null);
      hireCompleteRef.current = null;
    }
  }, []);

  const handleHireComplete = useCallback(
    (application: HiringApplicationCard) => {
      hireCompleteRef.current?.(application);
    },
    []
  );

  const value = useMemo(
    () => ({ openAddStylist, openHireApplicant }),
    [openAddStylist, openHireApplicant]
  );

  return (
    <AddStylistContext.Provider value={value}>
      {children}
      <Suspense fallback={null}>
        <AddStylistQueryOpener onOpen={openAddStylist} />
      </Suspense>
      <AddStylistDialog
        open={open}
        onOpenChange={handleOpenChange}
        hireApplication={hireApplication}
        onHireComplete={handleHireComplete}
      />
    </AddStylistContext.Provider>
  );
}
