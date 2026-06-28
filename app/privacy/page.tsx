import type { Metadata } from "next";
import Link from "next/link";
import PrivacySettingsButton from "../components/privacy-settings-button";

export const metadata: Metadata = {
  title: "Privacy | Qahwa Vibes",
  description:
    "Plain-language privacy notes for Qahwa Vibes analytics, browser storage, and Ko-fi.",
  alternates: {
    canonical: "/privacy",
  },
};

const sections = [
  {
    title: "Optional analytics",
    body: "Qahwa Vibes uses Google Analytics only if you choose Allow analytics. Analytics helps understand what people enjoy and where the site can improve. If you choose No thanks, Google Analytics does not load.",
  },
  {
    title: "Browser storage",
    body: "The site uses browser storage to remember your sound volumes, mute states, and analytics preference. These settings stay in your browser so your café mix feels familiar when you return.",
  },
  {
    title: "Every sound still works",
    body: "You can decline analytics and still use every feature: Start and Pause, looping ambience sounds, sliders, mute buttons, presets, and saved sound preferences.",
  },
  {
    title: "Ko-fi",
    body: "The Ko-fi button opens an external service. Ko-fi has its own privacy policy and handles anything you choose to do there.",
  },
  {
    title: "Changing your choice",
    body: "Use Privacy settings in the footer to reopen the analytics choice and update your preference at any time.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="qahwa-stage relative min-h-screen overflow-hidden bg-[#ead7af] text-[#2f2018]">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#ead7af_0%,#e2c691_42%,#c97839_76%,#51684c_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_16%,rgba(255,207,122,0.62),transparent_24%),linear-gradient(180deg,rgba(255,244,210,0.18),rgba(42,23,16,0.2))]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6 sm:px-8">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="w-fit rounded-full border border-[#7d5132]/55 bg-[#fff4d2]/85 px-4 py-2 text-sm font-black uppercase tracking-[0.14em] text-[#5a3725] shadow-[0_10px_24px_rgba(42,23,16,0.14)] transition hover:bg-[#fff0c7]"
          >
            Back to Qahwa Vibes
          </Link>
          <PrivacySettingsButton />
        </header>

        <section className="poster-paper rounded-[2.25rem] border border-[#7d5132]/55 bg-[#f2dfb8] p-6 shadow-[0_24px_80px_rgba(42,23,16,0.22)] sm:p-9">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#9a542e]">
            Privacy notes
          </p>
          <h1 className="mt-4 text-4xl font-black leading-none text-[#2a1710] sm:text-6xl">
            Qahwa Vibes Privacy
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[#573826]">
            A simple explanation of what Qahwa Vibes stores, what is optional,
            and how you stay in control.
          </p>

          <div className="mt-8 grid gap-4">
            {sections.map((section) => (
              <article
                key={section.title}
                className="rounded-[1.5rem] border border-[#7d5132]/45 bg-[#fff4d2]/78 p-5 shadow-[0_12px_28px_rgba(42,23,16,0.12)]"
              >
                <h2 className="text-xl font-black text-[#2a1710]">
                  {section.title}
                </h2>
                <p className="mt-3 leading-7 text-[#5a3725]">{section.body}</p>
              </article>
            ))}
          </div>
        </section>

        <footer className="mt-auto flex flex-col items-center gap-3 rounded-t-[1.5rem] border-x-2 border-t-2 border-[#4d3122] bg-[#2a1710]/92 px-5 py-5 text-center text-sm font-bold text-[#f2dfb8] sm:flex-row sm:justify-center sm:gap-5">
          <span>
            Made for slow mornings, late study nights, and coffee thoughts.
          </span>
          <Link
            href="/"
            className="font-black text-[#f6c36e] underline-offset-4 transition hover:text-[#fff4d2] hover:underline focus:outline-none focus:ring-2 focus:ring-[#f6c36e]/50"
          >
            Home
          </Link>
          <PrivacySettingsButton />
        </footer>
      </div>
    </main>
  );
}
