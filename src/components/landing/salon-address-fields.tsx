"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Info, Loader2, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { handleDigitInput } from "@/lib/digit-input";
import {
  listCitiesForDistrict,
  listDistrictsForState,
  listIndianStates,
} from "@/lib/india-location-data";
import { cn } from "@/lib/utils";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export interface SalonAddressValue {
  state: string;
  district: string;
  city: string;
  area: string;
  pinCode: string;
}

interface SalonAddressFieldsProps {
  value: SalonAddressValue;
  errors?: Partial<Record<keyof SalonAddressValue, string>>;
  disabled?: boolean;
  compact?: boolean;
  onChange: (next: SalonAddressValue) => void;
}

function firstLetter(value: string): string {
  const ch = value.trim().charAt(0).toUpperCase();
  return /^[A-Z]$/.test(ch) ? ch : "";
}

/**
 * Searchable location picker with optional A–Z first-letter filter.
 * Optional custom entry for City / Town when catalog has no match.
 */
function AlphabetFilterSelect({
  id,
  label,
  placeholder,
  value,
  options,
  disabled,
  compact,
  error,
  required,
  allowCustom,
  customMode = false,
  searchPlaceholder = "Search…",
  onSelectOption,
  onEnterCustom,
  onCustomChange,
  onCancelCustom,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  options: string[];
  disabled?: boolean;
  compact?: boolean;
  error?: string;
  required?: boolean;
  allowCustom?: boolean;
  customMode?: boolean;
  searchPlaceholder?: string;
  onSelectOption: (value: string) => void;
  onEnterCustom?: () => void;
  onCustomChange?: (value: string) => void;
  onCancelCustom?: () => void;
}) {
  const controlHeight = compact ? "h-9" : "h-11";
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [letter, setLetter] = useState<string | null>(null);

  const fieldLabel = (
    <Label htmlFor={id}>
      <span>
        {label}
        {required ? (
          <span
            className="ml-0.5 inline-block text-destructive"
            aria-hidden="true"
          >
            *
          </span>
        ) : null}
      </span>
    </Label>
  );

  const availableLetters = useMemo(() => {
    const set = new Set<string>();
    for (const option of options) {
      const ch = firstLetter(option);
      if (ch) set.add(ch);
    }
    return ALPHABET.filter((ch) => set.has(ch));
  }, [options]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return options.filter((option) => {
      if (letter && firstLetter(option) !== letter) return false;
      if (q && !option.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [options, letter, query]);

  useEffect(() => {
    if (!open || customMode) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, customMode]);

  useEffect(() => {
    if (disabled || customMode) {
      setOpen(false);
      setQuery("");
      setLetter(null);
    }
  }, [disabled, customMode]);

  function resetFilters() {
    setQuery("");
    setLetter(null);
  }

  function handleOpenChange(next: boolean) {
    if (disabled) return;
    setOpen(next);
    if (!next) resetFilters();
  }

  if (customMode) {
    return (
      <div className={cn(compact ? "space-y-1.5" : "space-y-2")}>
        {fieldLabel}
        <Input
          id={id}
          className={controlHeight}
          placeholder={`Enter ${label.toLowerCase()}`}
          value={value}
          disabled={disabled}
          autoFocus
          aria-required={required || undefined}
          onChange={(e) => onCustomChange?.(e.target.value)}
          onBlur={() => {
            if (value.trim().length >= 2) {
              onSelectOption(value.trim());
            }
          }}
        />
        <button
          type="button"
          className="text-xs font-medium text-primary underline-offset-4 hover:underline disabled:opacity-50"
          onClick={() => onCancelCustom?.()}
          disabled={disabled}
        >
          Choose from list
        </button>
        {error && <p className="text-xs text-destructive sm:text-sm">{error}</p>}
      </div>
    );
  }

  return (
    <div ref={rootRef} className={cn(compact ? "space-y-1.5" : "space-y-2")}>
      {fieldLabel}
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-required={required || undefined}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-[color,box-shadow]",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "dark:bg-input/30",
          controlHeight,
          !value && "text-muted-foreground"
        )}
        onClick={() => handleOpenChange(!open)}
      >
        <span className="truncate text-left">{value || placeholder}</span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 opacity-50 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="rounded-xl border border-border bg-background p-2 shadow-sm">
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              disabled={disabled}
              placeholder={searchPlaceholder}
              className="h-8 pl-8 pr-8 text-sm"
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
            />
            {query && (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {availableLetters.length > 0 && (
            <div className="mb-2 space-y-1">
              <div className="flex items-center justify-between gap-2 px-0.5">
                <p className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
                  Filter by letter
                  <span className="font-normal normal-case tracking-normal">
                    {" "}
                    (optional)
                  </span>
                </p>
                {letter && (
                  <button
                    type="button"
                    className="text-[0.65rem] font-medium text-primary hover:underline"
                    onClick={() => setLetter(null)}
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {availableLetters.map((ch) => {
                  const active = letter === ch;
                  return (
                    <button
                      key={ch}
                      type="button"
                      disabled={disabled}
                      aria-pressed={active}
                      className={cn(
                        "flex size-6 items-center justify-center rounded text-[0.7rem] font-medium transition-colors",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                      onClick={() => setLetter(active ? null : ch)}
                    >
                      {ch}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div
            role="listbox"
            aria-label={label}
            className="max-h-44 overflow-y-auto overscroll-contain rounded-lg border border-border/60"
          >
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                No matches
              </p>
            ) : (
              filtered.map((option) => {
                const selected = option === value;
                return (
                  <button
                    key={option}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={cn(
                      "flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                      selected && "bg-accent/60"
                    )}
                    onClick={() => {
                      onSelectOption(option);
                      handleOpenChange(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "size-3.5 shrink-0",
                        selected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate">{option}</span>
                  </button>
                );
              })
            )}
          </div>

          {allowCustom && (
            <button
              type="button"
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-primary hover:bg-muted/70"
              onClick={() => {
                handleOpenChange(false);
                onEnterCustom?.();
              }}
            >
              <Plus className="size-3.5" />
              Enter custom…
            </button>
          )}
        </div>
      )}

      {allowCustom && options.length === 0 && !disabled && !open && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-0 text-xs text-primary"
          onClick={() => onEnterCustom?.()}
        >
          <Plus className="mr-1 size-3.5" />
          Add {label.toLowerCase()} manually
        </Button>
      )}
      {error && <p className="text-xs text-destructive sm:text-sm">{error}</p>}
    </div>
  );
}

export function SalonAddressFields({
  value,
  errors,
  disabled,
  compact = true,
  onChange,
}: SalonAddressFieldsProps) {
  const states = useMemo(() => listIndianStates(), []);
  const districts = useMemo(
    () => listDistrictsForState(value.state),
    [value.state]
  );

  const [customCities, setCustomCities] = useState<string[]>([]);
  const [cityCustomMode, setCityCustomMode] = useState(false);
  const [pinLookingUp, setPinLookingUp] = useState(false);
  const pinReq = useRef(0);
  const lastResolvedPin = useRef("");
  const valueRef = useRef(value);
  valueRef.current = value;

  const cities = useMemo(() => {
    const catalog = listCitiesForDistrict(value.state, value.district);
    const set = new Set(catalog);
    for (const city of customCities) {
      if (city.trim()) set.add(city.trim());
    }
    if (value.city.trim()) set.add(value.city.trim());
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [value.state, value.district, value.city, customCities]);

  const gap = compact ? "gap-2.5" : "gap-3";
  const controlHeight = compact ? "h-9" : "h-11";

  function patch(partial: Partial<SalonAddressValue>) {
    onChange({ ...valueRef.current, ...partial });
  }

  useEffect(() => {
    const pin = value.pinCode.trim();
    if (!/^\d{6}$/.test(pin)) {
      setPinLookingUp(false);
      lastResolvedPin.current = "";
      return;
    }
    if (pin === lastResolvedPin.current) return;

    const reqId = ++pinReq.current;
    const controller = new AbortController();

    const timer = window.setTimeout(() => {
      setPinLookingUp(true);

      void (async () => {
        try {
          const res = await fetch(
            `/api/locations/pincode?pin=${encodeURIComponent(pin)}`,
            { signal: controller.signal }
          );
          const result = await res.json();
          if (pinReq.current !== reqId) return;

          if (result.success && result.data?.found) {
            const catalog = result.data.catalog as
              | { state?: string; district?: string; city?: string }
              | undefined;
            const nextState = (catalog?.state || "").trim();
            const nextDistrict = (catalog?.district || "").trim();
            const nextCity = (catalog?.city || "").trim();

            const stateOk =
              Boolean(nextState) && listIndianStates().includes(nextState);
            const districtOk =
              stateOk &&
              Boolean(nextDistrict) &&
              listDistrictsForState(nextState).includes(nextDistrict);
            const cityOk =
              districtOk &&
              Boolean(nextCity) &&
              listCitiesForDistrict(nextState, nextDistrict).includes(
                nextCity
              );

            lastResolvedPin.current = pin;
            setCityCustomMode(false);
            onChange({
              ...valueRef.current,
              pinCode: pin,
              state: stateOk ? nextState : "",
              district: districtOk ? nextDistrict : "",
              city: cityOk ? nextCity : "",
              area: "",
            });
          } else {
            lastResolvedPin.current = pin;
          }
        } catch (error) {
          if (controller.signal.aborted) return;
          if (pinReq.current !== reqId) return;
          console.error(error);
        } finally {
          if (pinReq.current === reqId) setPinLookingUp(false);
        }
      })();
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [value.pinCode, onChange]);

  return (
    <div className={cn(compact ? "space-y-1.5" : "space-y-2")}>
      <Label>Salon Address</Label>

      <div
        className={cn(
          "rounded-xl border border-border/80 bg-muted/20",
          compact ? "space-y-2.5 p-3" : "space-y-3 p-3.5 sm:p-4"
        )}
      >
        <div className={cn("grid grid-cols-1", gap)}>
          <div className={cn(compact ? "space-y-1.5" : "space-y-2")}>
            <Label htmlFor="salon-pin">PIN Code</Label>
            <div className="relative">
              <Input
                id="salon-pin"
                className={controlHeight}
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6-digit PIN"
                value={value.pinCode}
                disabled={disabled}
                aria-describedby="salon-pin-hint"
                onChange={(e) => {
                  handleDigitInput(e, 6);
                  const next = e.target.value;
                  if (next.trim() !== lastResolvedPin.current) {
                    lastResolvedPin.current = "";
                  }
                  patch({ pinCode: next });
                }}
              />
              {pinLookingUp && (
                <Loader2 className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>
            <p
              id="salon-pin-hint"
              className="flex gap-1.5 text-xs font-medium leading-5 text-info"
              role="note"
            >
              <span className="inline-flex h-5 w-3.5 shrink-0 items-center justify-center">
                <Info className="size-3.5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                Enter PIN code to auto-fill State, District & City.
              </span>
            </p>
            {errors?.pinCode && (
              <p className="text-xs text-destructive sm:text-sm">
                {errors.pinCode}
              </p>
            )}
          </div>

          <AlphabetFilterSelect
            id="salon-state"
            label="State"
            placeholder="Select state"
            searchPlaceholder="Search state…"
            value={value.state}
            options={states}
            disabled={disabled}
            compact={compact}
            required
            error={errors?.state}
            onSelectOption={(state) => {
              setCityCustomMode(false);
              setCustomCities([]);
              patch({
                state,
                district: "",
                city: "",
                area: "",
              });
            }}
          />

          <AlphabetFilterSelect
            id="salon-district"
            label="District"
            placeholder={value.state ? "Select district" : "Select state first"}
            searchPlaceholder="Search district…"
            value={value.district}
            options={districts}
            disabled={disabled || !value.state}
            compact={compact}
            required
            error={errors?.district}
            onSelectOption={(district) => {
              setCityCustomMode(false);
              setCustomCities([]);
              patch({
                district,
                city: "",
                area: "",
              });
            }}
          />

          <AlphabetFilterSelect
            id="salon-city"
            label="City / Town"
            placeholder={
              !value.district ? "Select district first" : "Select city / town"
            }
            searchPlaceholder="Search city / town…"
            value={value.city}
            options={cities}
            disabled={disabled || !value.district.trim()}
            allowCustom
            customMode={cityCustomMode}
            compact={compact}
            required
            error={errors?.city}
            onSelectOption={(city) => {
              const trimmed = city.trim();
              setCityCustomMode(false);
              if (
                trimmed &&
                !listCitiesForDistrict(value.state, value.district).includes(
                  trimmed
                )
              ) {
                setCustomCities((prev) =>
                  prev.includes(trimmed) ? prev : [...prev, trimmed]
                );
              }
              patch({
                city: trimmed,
                area: "",
              });
            }}
            onEnterCustom={() => {
              setCityCustomMode(true);
              patch({
                city: "",
                area: "",
              });
            }}
            onCustomChange={(city) => {
              patch({
                city,
                area: "",
              });
            }}
            onCancelCustom={() => {
              setCityCustomMode(false);
              patch({
                city: "",
                area: "",
              });
            }}
          />
        </div>
      </div>
    </div>
  );
}
