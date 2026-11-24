"use client";

import { useId, type CSSProperties, type ReactNode } from "react";
import { fastenerLook, useFastenerMode } from "@/lib/fasteners";

export type FastenerKind = "tape" | "clip" | "staple" | "pin" | "binder";
export type FastenerSpot = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-right";

interface Props {
  /** A stable name for the panel, so its fastener differs from the others'. */
  id: string;
  /** Changes each time the panel opens, so "sometimes" mode can decide again. */
  visit?: number;
  at?: FastenerSpot;
  size?: "md" | "sm";
  /** Multiplies the size (use about 1.2 to 2 on the board, where everything is drawn bigger). */
  scale?: number;
  /** The chance (0..1) that this panel gets one this time (in "sometimes" mode, and always when `rare`). */
  chance?: number;
  /** For things on the board: even "always" mode only gives a fastener to the lucky few, by `chance`. */
  rare?: boolean;
  /** Override which kinds may be used (default: the kinds that suit the spot). Staples are only ever used top-left. */
  kinds?: FastenerKind[];
  /** Force a colour (0, 1 or 2) instead of picking one. */
  tint?: number;
  /** Nudge the position, e.g. { top: "-0.7rem" }. */
  offset?: CSSProperties;
}

/** What suits each spot: clips and tape on an edge, pushpins and binder clips on top. Staples live top-left only. */
const KINDS_AT: Record<FastenerSpot, FastenerKind[]> = {
  "top-left": ["tape", "clip", "staple", "pin"],
  "top-center": ["tape", "pin", "binder"],
  "top-right": ["tape", "clip"],
  "bottom-left": ["tape", "pin"],
  "bottom-right": ["tape"],
};

const TAPE = ["rgb(214 180 112 / 0.8)", "rgb(232 168 184 / 0.75)", "rgb(160 196 214 / 0.75)"];
const CLIP = ["#a9b2bc", "#8d97a2", "#9aa3ae"];
// One wire with three turns, in two halves that sit on either side of the page: the OUTER loop (down the right leg
// with its free end, round the wide bottom, up the left, over the rounded top) and the INNER loop (down the inner
// right leg, round a small U, up to the second free end). They join at the top, at (9.1, 4.3).
const CLIP_OUTER = "M10.6 11.8V28.95a4.05 4.05 0 0 1-8.1 0V4.3a3.3 3.3 0 0 1 6.6 0";
const CLIP_INNER = "M9.1 4.3V23.2a2.45 2.45 0 0 1-4.9 0V10.7";
/** Where the page's edge crosses the clip, in the clip drawing's 34 units of height. */
const CLIP_EDGE = 12.7;
const PIN = ["#d33a2f", "#3b82c4", "#e8b923"];
const SHADOW = "drop-shadow(0 1px 1.5px rgb(0 0 0 / 0.35))";

/** Size in rem of each kind, [width, height]; "sm" is for small things like the Add tiles. */
const SIZE: Record<FastenerKind, { md: [number, number]; sm: [number, number] }> = {
  tape: { md: [4.5, 1.25], sm: [2.75, 1.1] },
  clip: { md: [0.95, 2.95], sm: [0.7, 2.15] },
  staple: { md: [1.6, 0.6], sm: [1.25, 0.5] },
  pin: { md: [1.4, 1.4], sm: [1.1, 1.1] },
  binder: { md: [2.6, 2.2], sm: [1.9, 1.6] },
};

/**
 * A steel paper clip as it sits on a page: the top loop is above the page's edge, and below the edge the page slides
 * between the two wires, so only one half shows (the outer loop, or the inner one, chosen by the colour number) and
 * the other half disappears behind the paper. A thin highlight along the wire makes it look like polished steel.
 */
function PaperClip({ tint }: { tint: number }) {
  const id = useId();
  const innerInFront = tint === 1;
  const front = innerInFront ? CLIP_INNER : CLIP_OUTER;
  const back = innerInFront ? CLIP_OUTER : CLIP_INNER;
  const wire = (d: string) => (
    <>
      <path d={d} stroke={CLIP[tint]} strokeWidth={1.4} />
      <path d={d} stroke="#fff" strokeWidth={0.4} opacity={0.7} transform="translate(-0.3 -0.3)" />
    </>
  );
  return (
    <svg viewBox="1 0 11 34" fill="none" strokeLinecap="round" strokeLinejoin="round" className="block h-full w-full" style={{ filter: SHADOW }} aria-hidden>
      <defs>
        <clipPath id={id}>
          <rect x="0" y="0" width="14" height={CLIP_EDGE} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>{wire(back)}</g>
      {wire(front)}
    </svg>
  );
}

function Art({ kind, tint }: { kind: Exclude<FastenerKind, "tape">; tint: number }): ReactNode {
  const svg = { className: "block h-full w-full", style: { filter: SHADOW }, "aria-hidden": true } as const;
  switch (kind) {
    case "clip":
      return <PaperClip tint={tint} />;
    case "staple":
      return (
        <svg viewBox="0 0 24 8" {...svg}>
          <rect x="1" y="2.5" width="22" height="3" rx="1.2" fill="#b4bcc5" />
          <rect x="1" y="2.5" width="3" height="3" rx="1" fill="#8f98a2" />
          <rect x="20" y="2.5" width="3" height="3" rx="1" fill="#8f98a2" />
          <rect x="4.5" y="3" width="15" height="1" rx="0.5" fill="#fff" opacity="0.55" />
        </svg>
      );
    case "pin":
      return (
        <svg viewBox="0 0 24 24" {...svg}>
          <circle cx="12" cy="12" r="9" fill={PIN[tint]} />
          <circle cx="12" cy="12" r="9" fill="none" stroke="#000" strokeOpacity="0.2" />
          <ellipse cx="9" cy="8.5" rx="3.6" ry="2.3" fill="#fff" opacity="0.5" />
        </svg>
      );
    case "binder":
      return (
        <svg viewBox="0 0 40 34" {...svg}>
          <path d="M12 14V7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v7" fill="none" stroke="#b4bcc5" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M4 32 9 12h22l5 20Z" fill="#2d2f33" />
          <path d="M9 12h22l1 4H8.2Z" fill="#fff" opacity="0.14" />
        </svg>
      );
  }
}

/** Where on the panel's corner or edge each kind sits, in rem times `k` (negative hangs over the edge). */
function placement(kind: FastenerKind, at: FastenerSpot, w: number, h: number, k: number): CSSProperties {
  const hangRem = kind === "clip" ? -1.1 : kind === "binder" ? -1.3 : kind === "pin" ? -0.55 : kind === "staple" ? 0.35 : -0.6;
  const sideRem = kind === "staple" ? 0.2 : kind === "pin" ? 1.25 : kind === "binder" ? 0.9 : 1.1;
  // a clip is placed so the page's edge crosses it exactly where the drawing expects (CLIP_EDGE of its 34 units)
  const hang = kind === "clip" ? `${-h * (CLIP_EDGE / 34)}rem` : `${hangRem * k}rem`;
  const side = `${sideRem * k}rem`;
  switch (at) {
    case "top-left":
      return { left: side, top: hang };
    case "top-right":
      return { right: side, top: hang };
    case "bottom-left":
      return { left: side, bottom: hang };
    case "bottom-right":
      return { right: side, bottom: hang };
    default:
      return { left: `calc(50% - ${w / 2}rem)`, top: hang };
  }
}

/**
 * An office supply holding a panel to the board: paper tape, a paper clip, a staple (menus and panels only, top-left only), a pushpin or a
 * binder clip. Place it inside a `relative` (or absolute) panel, outside anything that clips. Purely decorative (no
 * clicks), one per panel, never over text or controls. The Office supplies setting in the menu turns them on always,
 * only sometimes (random each time) or off. See Specs/StyleGuide.md.
 */
export default function Fastener({ id, visit = 0, at = "top-center", size = "md", scale = 1, chance = 0.6, rare = false, kinds, tint, offset }: Props) {
  const mode = useFastenerMode();
  if (mode === "off") return null;
  const look = fastenerLook(id, visit);
  if ((mode === "sometimes" || rare) && look.roll > chance) return null;

  // Staples only ever go top-left.
  const options = (kinds ?? KINDS_AT[at]).filter((k) => k !== "staple" || at === "top-left");
  if (options.length === 0) return null;
  const kind = options[Math.floor(look.kind * options.length) % options.length];
  const colour = tint ?? look.tint;
  const [baseW, baseH] = SIZE[kind][size];
  // tape comes in different lengths
  const w = (kind === "tape" ? baseW - 0.5 + look.wide * 1.5 : baseW) * scale;
  const h = baseH * scale;
  // a staple lies across the corner at about 40 degrees; everything else is only slightly crooked
  const rot = kind === "staple" ? -38 + look.rot : kind === "tape" ? look.rot : look.rot * 0.6;
  const style: CSSProperties = {
    ...placement(kind, at, w, h, scale),
    width: `${w}rem`,
    height: `${h}rem`,
    rotate: `${rot}deg`,
    translate: `${kind === "staple" ? 0 : look.jitter * scale}px 0`,
    ...offset,
  };
  if (kind === "tape") return <span className="tape" aria-hidden style={{ ...style, backgroundColor: TAPE[colour] }} />;
  return (
    <span className="fastener" aria-hidden style={style}>
      <Art kind={kind} tint={colour} />
    </span>
  );
}
