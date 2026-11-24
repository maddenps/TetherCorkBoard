"use client";

import type { ItemKind, ItemType } from "@/lib/types";
import Drawer from "./ui/Drawer";
import { Icon, type IconName } from "./ui/icons";
import { groupLabel, rowBtn } from "./ui/styles";
import Fastener from "./ui/Fastener";
import { useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Name of the section new items will land in, or null for the open board. */
  parentName: string | null;
  types: ItemType[];
  onAdd: (kind: ItemKind) => void;
  onAddPhoto: () => void;
  onAddType: (type: ItemType) => void;
  onOpenTypes: () => void;
}

const BASICS: { kind: ItemKind | "photo"; icon: IconName; label: string; hint: string }[] = [
  { kind: "section", icon: "section", label: "Section", hint: "Holds other items" },
  { kind: "note", icon: "note", label: "Note", hint: "A sticky note" },
  { kind: "photo", icon: "photo", label: "Photo", hint: "From your device" },
  { kind: "pin", icon: "pin", label: "Pin", hint: "Marks a spot on a map" },
];

/** Right-hand drawer: everything you can put on the board, grouped as basic items and your own types. */
export default function AddDrawer({ open, onClose, parentName, types, onAdd, onAddPhoto, onAddType, onOpenTypes }: Props) {
  // Counts how many times the drawer has opened, so "sometimes" tape is decided again each time.
  const [visit, setVisit] = useState(0);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setVisit((v) => v + 1);
  }
  return (
    <Drawer
      open={open}
      side="right"
      title="Add"
      subtitle={parentName ? `New items go inside “${parentName}”.` : "New items go on the open board."}
      onClose={onClose}
    >
      <div className={groupLabel}>Basics</div>
      <div className="grid grid-cols-2 gap-2 px-1">
        {BASICS.map((b) => (
          <button
            key={b.kind}
            className="chrome-focus relative flex flex-col items-start gap-2 rounded-ui border border-line bg-paper-2 p-3 text-left text-ink shadow-paper transition hover:bg-paper-3 active:translate-y-px"
            onClick={() => {
              if (b.kind === "photo") onAddPhoto();
              else onAdd(b.kind);
              onClose();
            }}
          >
            <Fastener id={`add-${b.kind}`} visit={visit} at="top-left" size="sm" chance={0.4} />
            <span className="flex h-10 w-10 items-center justify-center rounded-ui-sm bg-thread text-on-thread">
              <Icon name={b.icon} className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-bold">{b.label}</span>
              <span className="block text-xs text-ink-soft">{b.hint}</span>
            </span>
          </button>
        ))}
      </div>

      <div className={groupLabel}>From your types</div>
      {types.length === 0 && <p className="px-3 pb-2 text-sm text-ink-soft">No types yet. Design some to give items their own fields.</p>}
      {types.map((t) => (
        <button
          key={t.id}
          className={rowBtn}
          onClick={() => {
            onAddType(t);
            onClose();
          }}
        >
          <span className="h-5 w-5 shrink-0 rounded-ui-sm border border-line" style={{ background: t.color }} aria-hidden />
          <span className="min-w-0 flex-1 truncate font-semibold">{t.name}</span>
          <span className="text-xs text-ink-faint">{t.kind}</span>
        </button>
      ))}
      <button
        className={rowBtn}
        onClick={() => {
          onClose();
          onOpenTypes();
        }}
      >
        <Icon name="tag" className="h-5 w-5 text-ink-soft" />
        <span className="flex-1 font-semibold">Edit types and packs…</span>
        <Icon name="chevronRight" className="h-4 w-4 text-ink-faint" />
      </button>
    </Drawer>
  );
}
