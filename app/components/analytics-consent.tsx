"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const CONSENT_STORAGE_KEY = "qahwa-vibes-analytics-consent";
const PRIVACY_SETTINGS_EVENT = "qahwa-vibes:open-privacy-settings";
// Public env only: this is safe to expose and lets deployments disable GA by
// omitting NEXT_PUBLIC_GA_ID.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

type AnalyticsConsent = "allowed" | "declined";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function getSavedConsent() {
  const savedConsent = window.localStorage.getItem(CONSENT_STORAGE_KEY);

  if (savedConsent === "allowed" || savedConsent === "declined") {
    return savedConsent;
  }

  return null;
}

export default function AnalyticsConsentManager() {
  const pathname = usePathname();
  const [hasMounted, setHasMounted] = useState(false);
  const [consent, setConsent] = useState<AnalyticsConsent | null>(null);
  const [isBannerOpen, setIsBannerOpen] = useState(false);
  const [isGaReady, setIsGaReady] = useState(false);

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      const savedConsent = getSavedConsent();

      // Read consent after mount so the first client render matches the server.
      setConsent(savedConsent);
      setIsBannerOpen(savedConsent === null);
      setHasMounted(true);
    }, 0);

    return () => {
      window.clearTimeout(restoreTimer);
    };
  }, []);

  useEffect(() => {
    function openPrivacySettings() {
      setIsBannerOpen(true);
    }

    window.addEventListener(PRIVACY_SETTINGS_EVENT, openPrivacySettings);

    return () => {
      window.removeEventListener(PRIVACY_SETTINGS_EVENT, openPrivacySettings);
    };
  }, []);

  useEffect(() => {
    if (!GA_ID || consent !== "allowed" || !isGaReady || !window.gtag) {
      return;
    }

    // Track App Router navigations after consent. Google checks may not detect
    // this tag until a visitor accepts analytics and the script is allowed to load.
    window.gtag("event", "page_view", {
      page_path: `${pathname}${window.location.search}`,
      page_title: document.title,
    });
  }, [consent, isGaReady, pathname]);

  function saveConsent(nextConsent: AnalyticsConsent) {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, nextConsent);
    setConsent(nextConsent);
    setIsBannerOpen(false);
  }

  function setupGoogleAnalytics() {
    if (!GA_ID) {
      return;
    }

    window.dataLayer = window.dataLayer ?? [];
    window.gtag = (...args: unknown[]) => {
      window.dataLayer?.push(args);
    };
    // Runs only after consent and script load, never during initial render.
    window.gtag("js", new Date());
    window.gtag("config", GA_ID, { send_page_view: false });
    setIsGaReady(true);
  }

  if (!hasMounted) {
    return null;
  }

  return (
    <>
      {consent === "allowed" && GA_ID ? (
        // Consent-gated GA load. Google's automatic "tag detected" checker may
        // report no tag until someone clicks "Allow analytics."
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
          onLoad={setupGoogleAnalytics}
        />
      ) : null}

      {isBannerOpen ? (
        <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-[1.35rem] border border-[#7d5132]/60 bg-[#fff4d2] p-4 text-[#2f2018] shadow-[0_22px_60px_rgba(42,23,16,0.28)] sm:bottom-5 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-bold leading-6 text-[#573826]">
              Qahwa Vibes uses optional analytics to understand what people
              enjoy and improve the site.
            </p>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => saveConsent("allowed")}
                className="rounded-full border border-[#5a3725]/80 bg-[#d96f32] px-4 py-2 text-sm font-black uppercase tracking-wide text-[#fff4d2] shadow-[0_8px_18px_rgba(42,23,16,0.18)] transition hover:bg-[#e58a43] focus:outline-none focus:ring-4 focus:ring-[#d96f32]/30"
              >
                Allow analytics
              </button>
              <button
                type="button"
                onClick={() => saveConsent("declined")}
                className="rounded-full border border-[#7d5132]/55 bg-[#f8e4b6] px-4 py-2 text-sm font-black uppercase tracking-wide text-[#5a3725] transition hover:bg-[#fff0c7] focus:outline-none focus:ring-4 focus:ring-[#5f744e]/25"
              >
                No thanks
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function openPrivacySettings() {
  window.dispatchEvent(new Event(PRIVACY_SETTINGS_EVENT));
}
