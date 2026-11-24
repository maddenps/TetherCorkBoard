"use client";

import { useEffect } from "react";

interface Props {
  title: string;
  photos: string[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}

const nav =
  "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/90 text-2xl font-bold text-stone-800 shadow-md active:bg-stone-200 disabled:opacity-30";

/** The photos tied to a note or section, shown as a little stack of prints you can page through. */
export default function PhotoViewer({ title, photos, index, onIndex, onClose }: Props) {
  const last = photos.length - 1;
  const i = Math.min(Math.max(index, 0), last);

  // Arrow keys page through; Escape is handled by Board (it closes this first).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") onIndex(Math.max(0, i - 1));
      else if (e.key === "ArrowRight") onIndex(Math.min(last, i + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [i, last, onIndex]);

  if (photos.length === 0) return null;

  return (
    <div
      data-modal
      className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/75 p-4"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClose}
      role="dialog"
      aria-label={`Photos for ${title || "item"}`}
    >
      <div className="flex w-full max-w-3xl items-center justify-between text-white" onClick={(e) => e.stopPropagation()}>
        <div className="min-w-0 truncate text-lg font-bold">
          {title || "Photos"} <span className="font-normal opacity-80">· {i + 1} of {photos.length}</span>
        </div>
        <button className={nav} onClick={onClose} aria-label="Close photos">
          ✕
        </button>
      </div>

      <div className="flex w-full max-w-3xl items-center gap-3" onClick={(e) => e.stopPropagation()}>
        <button className={nav} onClick={() => onIndex(i - 1)} disabled={i === 0} aria-label="Previous photo">
          ‹
        </button>
        {/* The stack: a couple of prints peeking out behind the one on top. */}
        <div className="relative flex min-w-0 flex-1 items-center justify-center">
          {i < last && <div className="absolute inset-2 -rotate-3 rounded-sm bg-stone-100 shadow-lg" aria-hidden />}
          {i < last - 1 && <div className="absolute inset-2 rotate-3 rounded-sm bg-stone-200 shadow-lg" aria-hidden />}
          <div className="relative rounded-sm bg-white p-2 shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photos[i]} alt={`${title || "Photo"} ${i + 1}`} draggable={false} className="max-h-96 max-w-full rounded-sm object-contain" />
          </div>
        </div>
        <button className={nav} onClick={() => onIndex(i + 1)} disabled={i === last} aria-label="Next photo">
          ›
        </button>
      </div>

      {photos.length > 1 && (
        <div className="flex max-w-3xl gap-2 overflow-x-auto pb-1" onClick={(e) => e.stopPropagation()}>
          {photos.map((src, n) => (
            <button
              key={n}
              onClick={() => onIndex(n)}
              className={`h-14 w-14 shrink-0 overflow-hidden rounded-sm border-2 ${n === i ? "border-white" : "border-transparent opacity-60"}`}
              aria-label={`Photo ${n + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" draggable={false} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
