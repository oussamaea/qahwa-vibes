"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import PrivacySettingsButton from "./components/privacy-settings-button";

type SoundId =
  | "cafe-chatter"
  | "espresso"
  | "cups"
  | "rain"
  | "street"
  | "keyboard";

type SoundSetting = {
  volume: number;
  muted: boolean;
};

type SoundConfig = {
  id: SoundId;
  label: string;
  detail: string;
  icon: string;
  src: string;
  defaultVolume: number;
};

type MoodPreset = {
  name: string;
  note: string;
  icon: string;
  volumes: Record<SoundId, number>;
};

const STORAGE_KEY = "qahwa-vibes-mixer";

const SOUND_CONFIGS: SoundConfig[] = [
  {
    id: "cafe-chatter",
    label: "Café chatter",
    detail: "Soft voices from the next table",
    icon: "☕",
    src: "/sounds/cafe-chatter.mp3",
    defaultVolume: 0.35,
  },
  {
    id: "espresso",
    label: "Espresso machine",
    detail: "Counter steam and tiny rituals",
    icon: "🎧",
    src: "/sounds/espresso.mp3",
    defaultVolume: 0.12,
  },
  {
    id: "cups",
    label: "Cups & plates",
    detail: "Porcelain clinks on an old tray",
    icon: "✍️",
    src: "/sounds/cups.mp3",
    defaultVolume: 0.1,
  },
  {
    id: "rain",
    label: "Gentle rain",
    detail: "Rain tapping the window after class",
    icon: "🌧️",
    src: "/sounds/rain.mp3",
    defaultVolume: 0.25,
  },
  {
    id: "street",
    label: "Small town street",
    detail: "A warm block humming outside",
    icon: "📚",
    src: "/sounds/street.mp3",
    defaultVolume: 0.08,
  },
  {
    id: "keyboard",
    label: "Keyboard typing",
    detail: "Study notes, essays, and focus",
    icon: "⌨️",
    src: "/sounds/keyboard.mp3",
    defaultVolume: 0.1,
  },
];

const MOOD_PRESETS: MoodPreset[] = [
  {
    name: "Study Mode",
    note: "Focused, soft, desk lamp energy",
    icon: "📚",
    volumes: {
      "cafe-chatter": 0.16,
      espresso: 0.08,
      cups: 0.05,
      rain: 0.18,
      street: 0.03,
      keyboard: 0.32,
    },
  },
  {
    name: "Rainy Night",
    note: "Window seat, headphones, late notes",
    icon: "🌧️",
    volumes: {
      "cafe-chatter": 0.1,
      espresso: 0.05,
      cups: 0.03,
      rain: 0.5,
      street: 0.02,
      keyboard: 0.16,
    },
  },
  {
    name: "Busy Café",
    note: "Lively but still easy to think",
    icon: "☕",
    volumes: {
      "cafe-chatter": 0.48,
      espresso: 0.24,
      cups: 0.22,
      rain: 0.06,
      street: 0.16,
      keyboard: 0.08,
    },
  },
];

const DEFAULT_SETTINGS = SOUND_CONFIGS.reduce(
  (settings, sound) => ({
    ...settings,
    [sound.id]: { volume: sound.defaultVolume, muted: false },
  }),
  {} as Record<SoundId, SoundSetting>,
);

function clampVolume(value: unknown, fallback: number) {
  const volume = Number(value);

  if (!Number.isFinite(volume)) {
    return fallback;
  }

  return Math.min(1, Math.max(0, volume));
}

function parseSavedSettings(savedSettings: string | null) {
  try {
    if (!savedSettings) {
      return null;
    }

    const parsedSettings = JSON.parse(savedSettings) as Partial<
      Record<SoundId, Partial<SoundSetting>>
    >;

    return SOUND_CONFIGS.reduce((settings, sound) => {
      const saved = parsedSettings[sound.id];

      settings[sound.id] = {
        volume: clampVolume(saved?.volume, sound.defaultVolume),
        muted: Boolean(saved?.muted),
      };

      return settings;
    }, {} as Record<SoundId, SoundSetting>);
  } catch {
    return null;
  }
}

export default function Home() {
  const [settings, setSettings] =
    useState<Record<SoundId, SoundSetting>>(DEFAULT_SETTINGS);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackError, setPlaybackError] = useState("");
  const audioRefs = useRef<Partial<Record<SoundId, HTMLAudioElement>>>({});
  const hasRestoredSettingsRef = useRef(false);

  const activeSounds = useMemo(
    () =>
      SOUND_CONFIGS.filter((sound) => {
        const soundSetting = settings[sound.id];

        return !soundSetting.muted && soundSetting.volume > 0;
      }),
    [settings],
  );

  useEffect(() => {
    const audioElements = audioRefs.current;

    return () => {
      Object.values(audioElements).forEach((audio) => audio?.pause());
    };
  }, []);

  useEffect(() => {
    const savedSettings = parseSavedSettings(
      window.localStorage.getItem(STORAGE_KEY),
    );

    // Defer restoration until after hydration so server and first client
    // render stay byte-for-byte aligned.
    const restoreTimer = window.setTimeout(() => {
      hasRestoredSettingsRef.current = true;

      if (savedSettings) {
        setSettings(savedSettings);
      }
    }, 0);

    return () => {
      window.clearTimeout(restoreTimer);
    };
  }, []);

  useEffect(() => {
    SOUND_CONFIGS.forEach((sound) => {
      const audio = audioRefs.current[sound.id];
      const soundSetting = settings[sound.id];

      if (!audio) {
        return;
      }

      audio.volume = soundSetting.volume;
      audio.muted = soundSetting.muted;
    });

    if (!hasRestoredSettingsRef.current) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  function prepareAudio() {
    SOUND_CONFIGS.forEach((sound) => {
      if (!audioRefs.current[sound.id]) {
        const audio = new Audio(sound.src);
        audio.loop = true;
        audio.preload = "auto";
        audioRefs.current[sound.id] = audio;
      }

      const audio = audioRefs.current[sound.id];
      const soundSetting = settings[sound.id];

      if (audio) {
        audio.volume = soundSetting.volume;
        audio.muted = soundSetting.muted;
      }
    });
  }

  async function togglePlayback() {
    setPlaybackError("");
    prepareAudio();

    if (isPlaying) {
      Object.values(audioRefs.current).forEach((audio) => audio?.pause());
      setIsPlaying(false);
      return;
    }

    try {
      await Promise.all(
        Object.values(audioRefs.current).map((audio) => audio?.play()),
      );
      setIsPlaying(true);
    } catch {
      setPlaybackError("Audio could not start. Try tapping Start again.");
      setIsPlaying(false);
    }
  }

  function updateVolume(soundId: SoundId, volume: number) {
    setSettings((currentSettings) => ({
      ...currentSettings,
      [soundId]: {
        ...currentSettings[soundId],
        volume,
      },
    }));
  }

  function toggleMute(soundId: SoundId) {
    setSettings((currentSettings) => ({
      ...currentSettings,
      [soundId]: {
        ...currentSettings[soundId],
        muted: !currentSettings[soundId].muted,
      },
    }));
  }

  function applyMoodPreset(preset: MoodPreset) {
    setSettings((currentSettings) =>
      SOUND_CONFIGS.reduce((nextSettings, sound) => {
        const volume = preset.volumes[sound.id];

        nextSettings[sound.id] = {
          ...currentSettings[sound.id],
          volume,
          muted: false,
        };

        return nextSettings;
      }, {} as Record<SoundId, SoundSetting>),
    );
  }

  return (
    <main className="qahwa-stage relative min-h-screen overflow-hidden bg-[#ead7af] text-[#2f2018]">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#ead7af_0%,#e2c691_38%,#c97839_68%,#51684c_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,207,122,0.72),transparent_24%),radial-gradient(circle_at_18%_78%,rgba(92,64,43,0.22),transparent_26%),linear-gradient(180deg,rgba(255,244,210,0.18),rgba(42,23,16,0.2))]" />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col px-3 py-4 sm:px-7 sm:py-6 lg:min-h-screen lg:px-10">
        <div className="hidden justify-end lg:flex">
          <div className="flex items-center gap-3 rounded-full border border-[#7d5132]/45 bg-[#fff4d2]/80 px-3 py-2 shadow-[0_10px_24px_rgba(42,23,16,0.14)]">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#6d452d]">
              Help keep the café open.
            </p>
            <a
              href="https://ko-fi.com/qahwavibes"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rotate-[-1deg] items-center justify-center rounded-full border border-[#5a3725]/70 bg-[#f6c36e] px-3.5 py-1.5 text-xs font-black uppercase tracking-wide text-[#4a2a1b] shadow-[0_8px_18px_rgba(42,23,16,0.16)] transition duration-300 hover:-translate-y-0.5 hover:rotate-0 hover:bg-[#ffd783] focus:outline-none focus:ring-4 focus:ring-[#d96f32]/30"
            >
              Buy me a qahwa ☕
            </a>
          </div>
        </div>

        <section className="grid flex-1 gap-5 py-4 sm:py-6 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:gap-8 lg:py-8">
          <div className="qahwa-light absolute left-1/2 top-12 h-72 w-[min(88vw,760px)] -translate-x-1/2 rounded-full bg-[#f6b65a]/55 blur-3xl" />
          <div className="poster-paper relative overflow-hidden rounded-[2.25rem] border border-[#7d5132]/55 bg-[#f2dfb8] p-5 shadow-[0_24px_80px_rgba(42,23,16,0.24)] sm:p-8">
            <div className="absolute right-4 top-4 rotate-6 rounded-full border border-[#8b5030] bg-[#f6c36e] px-3 py-1 text-xs font-black uppercase text-[#4a2a1b] shadow-sm sm:right-5 sm:top-5">
              study night
            </div>
            <div className="absolute -bottom-10 -right-10 h-36 w-36 rounded-full border-[18px] border-[#523225]/80 bg-[#d88945] opacity-90 shadow-inner sm:h-44 sm:w-44" />
            <div className="absolute -bottom-3 -right-4 h-20 w-20 rounded-full border-[10px] border-[#f2dfb8] bg-[#2a1710] sm:h-24 sm:w-24" />

            <div className="relative">
              <div className="qahwa-logo-badge w-fit">
                <span className="text-xs font-black uppercase tracking-[0.2em]">
                  QV
                </span>
                <span className="h-px w-12 bg-[#fff4d2]/60" />
                <span className="text-[0.68rem] font-black uppercase tracking-[0.18em]">
                  analog cafe desk
                </span>
              </div>

              <h1 className="mt-7 max-w-xl text-4xl font-black leading-none text-[#2a1710] sm:text-6xl lg:text-8xl">
                Qahwa Vibes
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-[#573826] sm:text-2xl">
                A cozy café corner for studying, relaxing, and getting lost in
                the mood.
              </p>

              <div className="mx-auto mt-7 flex max-w-xs flex-col items-center gap-2 text-center sm:mx-0 sm:items-start sm:text-left lg:hidden">
                <p className="rounded-full bg-[#fff4d2]/75 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-[#6d452d] shadow-inner">
                  Help keep the café open.
                </p>
                <a
                  href="https://ko-fi.com/qahwavibes"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex rotate-[-1deg] items-center justify-center rounded-full border border-[#5a3725]/80 bg-[#f6c36e] px-4 py-2 text-sm font-black uppercase tracking-wide text-[#4a2a1b] shadow-[0_10px_22px_rgba(42,23,16,0.18)] transition duration-300 hover:-translate-y-0.5 hover:rotate-0 hover:bg-[#ffd783] focus:outline-none focus:ring-4 focus:ring-[#d96f32]/35"
                >
                  Buy me a qahwa ☕
                </a>
              </div>

              <div className="mt-9 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center sm:gap-4">
                <button
                  type="button"
                  onClick={togglePlayback}
                  className="group inline-flex min-h-16 items-center justify-center gap-4 rounded-full border border-[#2a1710] bg-[#d96f32] px-8 text-lg font-black uppercase tracking-wide text-[#fff4d2] shadow-[0_14px_28px_rgba(42,23,16,0.24)] transition duration-300 hover:-translate-y-1 hover:bg-[#e58a43] focus:outline-none focus:ring-4 focus:ring-[#5f744e]/35"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff4d2] text-[#2a1710] transition group-hover:rotate-6">
                    {isPlaying ? "Ⅱ" : "▶"}
                  </span>
                  {isPlaying ? "Pause" : "Start"}
                </button>

                <div className="rounded-2xl border border-[#8b5b39] bg-[#fff4d2]/78 px-5 py-4 text-sm font-bold text-[#5a3725] shadow-inner">
                  {isPlaying
                    ? `${activeSounds.length} sounds on the table`
                    : "Press Start when your cup is ready"}
                </div>
              </div>

              {playbackError ? (
                <p className="mt-4 rounded-xl bg-[#7d2d1f] px-4 py-3 text-sm font-bold text-[#fff4d2]">
                  {playbackError}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-5">
            <section className="poster-paper rounded-[2rem] border border-[#7d5132]/55 bg-[#fff4d2] p-5 shadow-[0_18px_55px_rgba(42,23,16,0.2)]">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-[#9a542e]">
                    quick presets
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-[#2a1710]">
                    Pick a table mood
                  </h2>
                </div>
                <span className="w-fit rotate-2 rounded-md bg-[#5f744e] px-3 py-1 text-xs font-black uppercase text-[#fff4d2] shadow-[3px_3px_0_#2a1710]">
                  cassette mix
                </span>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {MOOD_PRESETS.map((preset, index) => {
                  const tilt = index === 1 ? "-rotate-1" : "rotate-1";

                  return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => applyMoodPreset(preset)}
                    className={`rounded-[1.45rem] border border-[#5a3725]/80 bg-[#f8e4b6] p-4 text-left shadow-[0_12px_22px_rgba(42,23,16,0.16)] transition duration-300 hover:-translate-y-1 hover:rotate-0 hover:bg-[#fff0c7] focus:outline-none focus:ring-4 focus:ring-[#d96f32]/35 ${tilt}`}
                  >
                    <span className="text-2xl">{preset.icon}</span>
                    <span className="mt-3 block text-base font-black text-[#2a1710]">
                      {preset.name}
                    </span>
                    <span className="mt-1 block text-sm leading-5 text-[#67422b]">
                      {preset.note}
                    </span>
                  </button>
                  );
                })}
              </div>
            </section>

            <section className="poster-paper rounded-[2rem] border border-[#7d5132]/55 bg-[#f2dfb8] p-5 shadow-[0_18px_55px_rgba(42,23,16,0.18)]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-[#9a542e]">
                    now playing
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-[#2a1710]">
                    {isPlaying ? "Your study lounge is live" : "Waiting on Start"}
                  </h2>
                </div>
                <div className="rounded-full border border-[#6d452d] bg-[#fff4d2] px-4 py-2 text-sm font-black text-[#5a3725]">
                  {activeSounds.length || "No"} active
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {activeSounds.length ? (
                  activeSounds.map((sound) => (
                    <span
                      key={sound.id}
                      className="rounded-full border border-[#6d452d] bg-[#fff9e8] px-3 py-2 text-sm font-bold text-[#4a2a1b]"
                    >
                      {sound.icon} {sound.label}
                    </span>
                  ))
                ) : (
                  <span className="rounded-full border border-dashed border-[#8b5b39] bg-[#fff9e8] px-3 py-2 text-sm font-bold text-[#67422b]">
                    No active layers yet
                  </span>
                )}
              </div>
            </section>
          </div>
        </section>

        <section className="grid gap-4 pb-8 sm:grid-cols-2 lg:grid-cols-3">
          {SOUND_CONFIGS.map((sound, index) => {
            const soundSetting = settings[sound.id];
            const volumePercent = Math.round(soundSetting.volume * 100);
            const tilt = index % 2 === 0 ? "-rotate-1" : "rotate-1";

            return (
              <article
                key={sound.id}
                className={`poster-paper relative rounded-[1.8rem] border border-[#7d5132]/60 bg-[#fff4d2] p-5 shadow-[0_16px_42px_rgba(42,23,16,0.17)] transition duration-300 hover:-translate-y-1 hover:rotate-0 hover:bg-[#fff8df] ${tilt}`}
              >
                <span className="absolute -top-3 left-5 rounded-full border border-[#5a3725]/80 bg-[#f6c36e] px-3 py-1 text-xs font-black uppercase tracking-wide text-[#4a2a1b] shadow-sm">
                  track {index + 1}
                </span>

                <div className="mt-2 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#5a3725]/75 bg-[#f2dfb8] text-2xl shadow-inner">
                      {sound.icon}
                    </span>
                    <div>
                      <h2 className="text-lg font-black text-[#2a1710]">
                        {sound.label}
                      </h2>
                      <p className="mt-1 text-sm leading-5 text-[#67422b]">
                        {sound.detail}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleMute(sound.id)}
                    aria-label={`${soundSetting.muted ? "Unmute" : "Mute"} ${sound.label}`}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#2a1710] bg-[#5f744e] text-lg font-black text-[#fff4d2] shadow-[0_8px_18px_rgba(42,23,16,0.22)] transition hover:bg-[#4f6545] focus:outline-none focus:ring-4 focus:ring-[#d96f32]/35"
                  >
                    {soundSetting.muted ? "×" : "♪"}
                  </button>
                </div>

                <div className="mt-6">
                  <div className="mb-3 flex items-center justify-between text-xs font-black uppercase tracking-[0.16em] text-[#8b5030]">
                    <span>{soundSetting.muted ? "Muted" : "Volume"}</span>
                    <span>{volumePercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={soundSetting.volume}
                    onChange={(event) =>
                      updateVolume(sound.id, Number(event.target.value))
                    }
                    aria-label={`${sound.label} volume`}
                    className="qahwa-slider w-full"
                    style={
                      {
                        "--slider-progress": `${volumePercent}%`,
                      } as CSSProperties
                    }
                  />
                </div>
              </article>
            );
          })}
        </section>

        <footer className="flex flex-col items-center gap-3 rounded-t-[1.5rem] border-x-2 border-t-2 border-[#4d3122] bg-[#2a1710]/92 px-5 py-5 text-center text-sm font-bold text-[#f2dfb8] sm:flex-row sm:justify-center sm:gap-5">
          <span>
            Made for slow mornings, late study nights, and coffee thoughts.
          </span>
          <Link
            href="/privacy"
            className="font-black text-[#f6c36e] underline-offset-4 transition hover:text-[#fff4d2] hover:underline focus:outline-none focus:ring-2 focus:ring-[#f6c36e]/50"
          >
            Privacy
          </Link>
          <PrivacySettingsButton />
        </footer>
      </div>
    </main>
  );
}
