"use client";

import { useState, useSyncExternalStore } from "react";

/**
 * Office supplies that hold panels to the board: paper tape, paper clips, staples, pushpins and binder clips
 * (see ui/Fastener.tsx). A viewing preference only, stored on the device. "sometimes" gives some panels a fastener
 * and not others, a different one each time a panel opens.
 */
export type FastenerMode = "always" | "sometimes" | "off";

// The key keeps the name it had when tape was the only fastener, so an earlier choice carries over.
const KEY = "tether-tape-mode";
const DEFAULT: FastenerMode = "sometimes";
const listeners = new Set<() => void>();
let current: FastenerMode | null = null;

function read(): FastenerMode {
  try {
    const v = localStorage.getItem(KEY);
    return v === "always" || v === "off" || v === "sometimes" ? v : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

function snapshot(): FastenerMode {
  if (current === null) current = read();
  return current;
}

export function setFastenerMode(mode: FastenerMode) {
  current = mode;
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    // Private mode: the choice just won't be remembered.
  }
  listeners.forEach((l) => l());
}

export function useFastenerMode(): FastenerMode {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    snapshot,
    () => DEFAULT,
  );
}

// Different on every page load, so "sometimes" really does vary between visits.
const SESSION = Math.floor(Math.random() * 2 ** 31);
let visits = 0;

/** A number that is new each time the component that calls it mounts (for panels that mount whenever they open). */
export function useVisit(): number {
  const [visit] = useState(() => ++visits);
  return visit;
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface FastenerLook {
  /** 0..1: the fastener is shown in "sometimes" mode when this is below the panel's chance. */
  roll: number;
  /** 0..1: picks which kind of fastener, from the ones allowed at that spot. */
  kind: number;
  /** Degrees; never near zero, so it looks put on by hand. */
  rot: number;
  /** 0..1: how long a strip of tape is. */
  wide: number;
  /** Which colour (0, 1 or 2) of the chosen kind. */
  tint: number;
  /** Small sideways nudge, px. */
  jitter: number;
}

/** The look of one fastener: repeatable for the same panel and visit, different between panels, visits and page loads. */
export function fastenerLook(id: string, visit: number): FastenerLook {
  const h = hash(`${SESSION}:${id}:${visit}`);
  const k = hash(`${SESSION}:${id}:${visit}:kind`);
  const f = (shift: number) => ((h >>> shift) & 255) / 255;
  return {
    roll: f(0),
    kind: (k & 1023) / 1024,
    rot: (f(8) < 0.5 ? -1 : 1) * (2 + f(16) * 4),
    wide: f(24),
    tint: Math.floor(f(4) * 3) % 3,
    jitter: (f(12) - 0.5) * 24,
  };
}
