"use client";

import { openPrivacySettings } from "./analytics-consent";

export default function PrivacySettingsButton() {
  return (
    <button
      type="button"
      onClick={openPrivacySettings}
      className="font-black text-[#f6c36e] underline-offset-4 transition hover:text-[#fff4d2] hover:underline focus:outline-none focus:ring-2 focus:ring-[#f6c36e]/50"
    >
      Privacy settings
    </button>
  );
}
