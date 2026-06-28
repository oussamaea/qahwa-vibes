"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const CONSENT_STORAGE_KEY = "qahwa-vibes-analytics-consent";
const PRIVACY_SETTINGS_EVENT = "qahwa-vibes:open-privacy-settings";

type AnalyticsConsent = "allowed" | "declined";
type AnalyticsStorage = "granted" | "denied";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function getSavedConsent() {
  try {
    const savedConsent = window.localStorage.getItem(CONSENT_STORAGE_KEY);

    if (savedConsent === "allowed" || savedConsent === "declined") {
      return savedConsent;
    }
  } catch {
    return null;
  }

  return null;
}

function getGoogleAnalyticsId() {
  // Public env only: this is safe to expose and lets deployments disable GA by
  // omitting NEXT_PUBLIC_GA_ID.
  return process.env.NEXT_PUBLIC_GA_ID;
}

function ensureGoogleTag() {
  window.dataLayer = window.dataLayer ?? [];
  window.gtag =
    window.gtag ??
    ((...args: unknown[]) => {
      window.dataLayer?.push(args);
    });
}

function getAnalyticsStorage(consent: AnalyticsConsent | null): AnalyticsStorage {
  return consent === "allowed" ? "granted" : "denied";
}

function setConsentModeDefault(consent: AnalyticsConsent | null) {
  ensureGoogleTag();

  // Consent Mode must be set before the GA config call. Ads consent remains
  // denied because Qahwa Vibes only uses GA4, not Google Ads.
  window.gtag?.("consent", "default", {
    analytics_storage: getAnalyticsStorage(consent),
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });

  if (process.env.NODE_ENV !== "production") {
    console.info("GA consent mode initialized");
  }
}

function updateConsentMode(consent: AnalyticsConsent) {
  ensureGoogleTag();

  window.gtag?.("consent", "update", {
    analytics_storage: getAnalyticsStorage(consent),
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
}

export default function AnalyticsConsentManager() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [hasMounted, setHasMounted] = useState(false);
  const [consent, setConsent] = useState<AnalyticsConsent | null>(null);
  const [isBannerOpen, setIsBannerOpen] = useState(false);
  const [isConsentModeReady, setIsConsentModeReady] = useState(false);
  const [isGaReady, setIsGaReady] = useState(false);
  const hasInitializedGaRef = useRef(false);

  const gaId = getGoogleAnalyticsId();
  const currentPath = useMemo(() => {
    const queryString = searchParams.toString();

    return queryString ? `${pathname}?${queryString}` : pathname;
  }, [pathname, searchParams]);

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      const savedConsent = getSavedConsent();

      // Read consent after mount so the first client render matches the server.
      setConsentModeDefault(savedConsent);
      setConsent(savedConsent);
      setIsBannerOpen(savedConsent === null);
      setIsConsentModeReady(true);
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
    if (!gaId || consent !== "allowed" || !isGaReady || !window.gtag) {
      return;
    }

    // Track App Router navigations only after analytics storage is granted.
    window.gtag("event", "page_view", {
      page_path: currentPath,
      page_title: document.title,
    });
  }, [consent, currentPath, gaId, isGaReady]);

  function saveConsent(nextConsent: AnalyticsConsent) {
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, nextConsent);
    } catch {
      // The live consent update still works even if storage is unavailable.
    }

    updateConsentMode(nextConsent);
    setConsent(nextConsent);
    setIsBannerOpen(false);

    if (
      nextConsent === "allowed" &&
      process.env.NODE_ENV !== "production" &&
      gaId
    ) {
      console.info(`Qahwa Vibes analytics enabled: ${gaId}`);
    }
  }

  function setupGoogleAnalytics() {
    if (!gaId || hasInitializedGaRef.current) {
      return;
    }

    hasInitializedGaRef.current = true;
    ensureGoogleTag();
    const gtag = window.gtag;

    if (!gtag) {
      return;
    }

    // Config runs once after Consent Mode defaults and never during render.
    gtag("js", new Date());
    gtag("config", gaId, { send_page_view: false });
    if (consent === "allowed" && process.env.NODE_ENV !== "production") {
      console.info(`Qahwa Vibes analytics enabled: ${gaId}`);
    }
    setIsGaReady(true);
  }

  if (!hasMounted) {
    return null;
  }

  return (
    <>
      {gaId && isConsentModeReady ? (
        // Advanced Consent Mode: the tag loads on first page load, but Consent
        // Mode defaults are set first and analytics storage stays denied until
        // the visitor clicks "Allow analytics."
        <Script
          id="qahwa-google-tag"
          src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
          strategy="afterInteractive"
          onLoad={setupGoogleAnalytics}
          onReady={setupGoogleAnalytics}
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
