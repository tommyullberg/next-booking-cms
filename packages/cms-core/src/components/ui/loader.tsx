"use client";

import React from "react";
import { motion } from "framer-motion";

export type LoaderVariant = "scanner" | "radar" | "cards";
export type LoaderTheme = "emerald" | "amber" | "sky";

export interface LoaderProps {
  variant?: LoaderVariant;
  theme?: LoaderTheme;
  label?: string;
  sublabel?: string;
  className?: string;
}

const THEME_STYLES: Record<
  LoaderTheme,
  {
    accentText: string;
    badgeBg: string;
    glowColor: string;
    beamGradient: string;
    cellActive: string;
    barBg: string;
    ringStroke: string;
    cardBorder: string;
  }
> = {
  emerald: {
    accentText: "text-emerald-600 dark:text-emerald-400",
    badgeBg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300",
    glowColor: "rgba(16, 185, 129, 0.35)",
    beamGradient: "from-transparent via-emerald-400/80 to-transparent",
    cellActive: "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)]",
    barBg: "bg-gradient-to-t from-emerald-600 to-teal-300",
    ringStroke: "#10b981",
    cardBorder: "border-emerald-500/40",
  },
  amber: {
    accentText: "text-amber-600 dark:text-amber-400",
    badgeBg: "bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300",
    glowColor: "rgba(245, 158, 11, 0.35)",
    beamGradient: "from-transparent via-amber-400/80 to-transparent",
    cellActive: "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.7)]",
    barBg: "bg-gradient-to-t from-amber-600 to-yellow-300",
    ringStroke: "#f59e0b",
    cardBorder: "border-amber-500/40",
  },
  sky: {
    accentText: "text-sky-600 dark:text-sky-400",
    badgeBg: "bg-sky-500/15 border-sky-500/30 text-sky-700 dark:text-sky-300",
    glowColor: "rgba(14, 165, 233, 0.35)",
    beamGradient: "from-transparent via-sky-400/80 to-transparent",
    cellActive: "bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.7)]",
    barBg: "bg-gradient-to-t from-sky-600 to-cyan-300",
    ringStroke: "#0ea5e9",
    cardBorder: "border-sky-500/40",
  },
};

const HIGHLIGHT_CELLS = new Set([2, 3, 4, 8, 9, 10, 11, 15, 16, 18]);

export function Loader({
  variant = "scanner",
  theme = "emerald",
  label = "Söker lediga boenden...",
  sublabel = "Kontrollerar kalendrar, bytesdagar och prisperioder",
  className = "",
}: LoaderProps) {
  const styles = THEME_STYLES[theme];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`rounded-3xl border border-neutral-300 dark:border-slate-800 bg-neutral-100/90 dark:bg-slate-900/90 p-6 shadow-lg relative overflow-hidden ${className}`}
    >
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        {variant === "scanner" && <ScannerGraphic theme={theme} />}
        {variant === "radar" && <RadarGraphic theme={theme} />}
        {variant === "cards" && <CardsWaveGraphic theme={theme} />}

        <div className="space-y-1">
          <div className={`text-xs font-bold tracking-wide ${styles.accentText}`}>
            {label}
          </div>
          {sublabel && (
            <p className="text-[11px] text-neutral-600 dark:text-slate-400">
              {sublabel}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Förslag 1: Calendar Matrix Scanner
 * 7x3 calendar grid with sweeping laser scan line and glowing matched dates
 */
function ScannerGraphic({ theme }: { theme: LoaderTheme }) {
  const styles = THEME_STYLES[theme];
  const cells = Array.from({ length: 21 }, (_, i) => i);

  return (
    <div className="w-full max-w-md space-y-4">
      <div className="relative mx-auto w-56 rounded-2xl border border-neutral-300 dark:border-slate-700/80 bg-white/90 dark:bg-slate-950/90 p-3 shadow-inner overflow-hidden">
        {/* Mini calendar header */}
        <div className="flex items-center justify-between mb-2 px-0.5">
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 dark:bg-slate-600" />
            <span className="h-1.5 w-8 rounded-full bg-neutral-300 dark:bg-slate-700" />
          </div>
          <span className="h-1.5 w-5 rounded-full bg-neutral-300 dark:bg-slate-700" />
        </div>

        {/* 7x3 Day Cells */}
        <div className="grid grid-cols-7 gap-1.5 relative z-10">
          {cells.map((idx) => {
            const isMatch = HIGHLIGHT_CELLS.has(idx);
            const row = Math.floor(idx / 7);
            const col = idx % 7;
            const delay = row * 0.25 + col * 0.08;

            return (
              <motion.div
                key={idx}
                animate={
                  isMatch
                    ? {
                        scale: [1, 1.18, 1],
                        opacity: [0.35, 1, 0.35],
                      }
                    : {
                        opacity: [0.25, 0.5, 0.25],
                      }
                }
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  delay,
                  ease: "easeInOut",
                }}
                className={`h-4 rounded-[5px] ${
                  isMatch
                    ? styles.cellActive
                    : "bg-neutral-300 dark:bg-slate-800"
                }`}
              />
            );
          })}
        </div>

        {/* Sweeping vertical laser scanner bar */}
        <motion.div
          animate={{ y: ["-10%", "115%", "-10%"] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          className={`pointer-events-none absolute left-0 right-0 top-0 h-6 bg-gradient-to-b ${styles.beamGradient} opacity-60 blur-[1px] z-20`}
        />
      </div>

      {/* 2 Shimmering Skeleton Cards matching the result list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {[0, 1].map((cardIdx) => (
          <div
            key={cardIdx}
            className="relative overflow-hidden rounded-2xl border border-neutral-300/80 dark:border-slate-800 bg-white/70 dark:bg-slate-950/60 p-3.5 space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-28 rounded-md bg-neutral-300 dark:bg-slate-800" />
              <div className={`h-4 w-12 rounded-full border ${styles.badgeBg}`} />
            </div>
            <div className="h-2.5 w-36 rounded-md bg-neutral-200 dark:bg-slate-800/70" />
            <div className="flex items-center justify-between pt-2 border-t border-neutral-200 dark:border-slate-800/80">
              <div className="h-3.5 w-16 rounded-md bg-neutral-300 dark:bg-slate-800" />
              <div className="h-6 w-20 rounded-lg bg-neutral-300 dark:bg-slate-800" />
            </div>
            <motion.div
              animate={{ x: ["-120%", "220%"] }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                delay: cardIdx * 0.25,
                ease: "linear",
              }}
              className="pointer-events-none absolute inset-y-0 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Förslag 2: Booking Radar & Orbital Rings
 * Dual counter-rotating rings with sweeping radar beam and glowing target blips
 */
function RadarGraphic({ theme }: { theme: LoaderTheme }) {
  const styles = THEME_STYLES[theme];

  return (
    <div className="relative flex items-center justify-center w-28 h-28">
      {/* Expanding pulse wave */}
      <motion.div
        animate={{ scale: [0.75, 1.35], opacity: [0.55, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
        style={{ borderColor: styles.ringStroke }}
        className="absolute inset-2 rounded-full border-2"
      />

      {/* Outer rotating dashed ring */}
      <motion.svg
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        viewBox="0 0 100 100"
        className="w-28 h-28 absolute inset-0"
      >
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={styles.ringStroke}
          strokeWidth="1.5"
          strokeDasharray="8 6"
          strokeOpacity="0.45"
        />
        <circle cx="50" cy="5" r="3" fill={styles.ringStroke} />
      </motion.svg>

      {/* Inner counter-rotating arc ring */}
      <motion.svg
        animate={{ rotate: -360 }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
        viewBox="0 0 100 100"
        className="w-20 h-20 absolute"
      >
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={styles.ringStroke}
          strokeWidth="2.5"
          strokeDasharray="65 180"
          strokeLinecap="round"
        />
      </motion.svg>

      {/* Sweeping Radar Beam */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
        style={{
          background: `conic-gradient(from 0deg, transparent 0deg, transparent 260deg, ${styles.glowColor} 360deg)`,
        }}
        className="w-20 h-20 rounded-full"
      />

      {/* Pulsing target blips inside radar */}
      {[
        { top: "30%", left: "62%", delay: 0.2 },
        { top: "64%", left: "34%", delay: 0.9 },
        { top: "58%", left: "66%", delay: 1.5 },
      ].map((dot, idx) => (
        <motion.span
          key={idx}
          style={{ top: dot.top, left: dot.left }}
          animate={{ scale: [0, 1.3, 0], opacity: [0, 1, 0] }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            delay: dot.delay,
            ease: "easeInOut",
          }}
          className={`absolute h-2 w-2 rounded-full ${styles.cellActive}`}
        />
      ))}

      {/* Center core */}
      <div
        className={`relative z-10 h-3.5 w-3.5 rounded-full ${styles.cellActive}`}
      />
    </div>
  );
}

/**
 * Förslag 3: Harmonic Wave & Floating Cards
 * Cycling 3D mini cottage cards + glowing harmonic wave bars
 */
function CardsWaveGraphic({ theme }: { theme: LoaderTheme }) {
  const styles = THEME_STYLES[theme];
  const bars = [0, 1, 2, 3, 4, 5, 6];

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Stacked floating mini cards */}
      <div className="relative h-16 w-44 flex items-center justify-center">
        {[0, 1, 2].map((idx) => (
          <motion.div
            key={idx}
            animate={{
              y: [idx * 6 - 6, idx === 1 ? -10 : 6, idx * 6 - 6],
              scale: [1 - idx * 0.06, idx === 1 ? 1.04 : 0.92, 1 - idx * 0.06],
              rotateZ: [idx === 0 ? -4 : idx === 2 ? 4 : 0, idx === 0 ? 3 : -3, idx === 0 ? -4 : idx === 2 ? 4 : 0],
            }}
            transition={{
              duration: 2.1,
              repeat: Infinity,
              delay: idx * 0.25,
              ease: "easeInOut",
            }}
            style={{ zIndex: 3 - idx }}
            className={`absolute w-36 rounded-xl border ${styles.cardBorder} bg-white dark:bg-slate-950 p-2.5 shadow-md flex items-center justify-between`}
          >
            <div className="space-y-1.5">
              <div className="h-2 w-16 rounded-full bg-neutral-300 dark:bg-slate-700" />
              <div className="h-1.5 w-10 rounded-full bg-neutral-200 dark:bg-slate-800" />
            </div>
            <div className={`h-4 w-4 rounded-lg ${styles.cellActive} opacity-85`} />
          </motion.div>
        ))}
      </div>

      {/* Harmonic Sine Wave Bars */}
      <div className="flex items-end justify-center gap-1.5 h-8">
        {bars.map((b) => (
          <motion.span
            key={b}
            animate={{
              height: ["8px", "28px", "10px"],
            }}
            transition={{
              duration: 1.1,
              repeat: Infinity,
              delay: b * 0.12,
              ease: "easeInOut",
            }}
            className={`w-2 rounded-full ${styles.barBg} shadow-sm`}
          />
        ))}
      </div>
    </div>
  );
}

