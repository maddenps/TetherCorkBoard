"use client";

import { useState } from "react";
import { PAPER_COLORS } from "@/lib/board";
import { FIELD_TYPES, defaultTypes, newField, newType } from "@/lib/model";
import type { FieldDef, FieldType, ItemType } from "@/lib/types";

interface Props {
  types: ItemType[];
  onChange: (types: ItemType[]) => void;
  onClose: () => void;
}

const input =
  "w-full rounded-md border border-stone-300 bg-white px-2 py-1.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-zinc-500 dark:bg-zinc-600 dark:text-white";
const smallBtn =
  "shrink-0 rounded-md bg-stone-300 px-2.5 py-1.5 text-sm font-medium text-stone-900 active:bg-stone-400 dark:bg-zinc-500 dark:text-white dark:active:bg-zinc-400";

/**
 * Design the item types for this board: a name, whether it is a note or a section, a paper colour, and any
 * number of fields (text, number, link, checkbox, choice). Changes apply to the board straight away.
 */
export default function TypesEditor({ types, onChange, onClose }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(types[0]?.id ?? null);
  const current = types.find((t) => t.id === selectedId) ?? null;

  const patchType = (patch: Partial<ItemType>) => onChange(types.map((t) => (t.id === selectedId ? { ...t, ...patch } : t)));
  const patchField = (id: string, patch: Partial<FieldDef>) =>
    current && patchType({ fields: current.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)) });

  function addType() {
    const t = newType();
    onChange([...types, t]);
    setSelectedId(t.id);
  }

  function deleteType() {
    if (!current) return;
    if (!confirm(`Delete the type "${current.name}"? Items made from it stay, but stop showing its fields.`)) return;
    const rest = types.filter((t) => t.id !== current.id);
    onChange(rest);
    setSelectedId(rest[0]?.id ?? null);
  }

  function moveField(index: number, dir: -1 | 1) {
    if (!current) return;
    const next = [...current.fields];
    const to = index + dir;
    if (to < 0 || to >= next.length) return;
    [next[index], next[to]] = [next[to], next[index]];
    patchType({ fields: next });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3" role="dialog" aria-label="Item types">
      <div className="flex max-h-full w-full max-w-xl flex-col rounded-xl bg-stone-100 p-4 text-stone-900 shadow-2xl dark:bg-zinc-700 dark:text-zinc-50">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Item types</h2>
          <button className={smallBtn} onClick={onClose}>
            Done
          </button>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          {types.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedId(t.id)}
              className={`rounded-full border-2 px-3 py-1 text-sm font-semibold text-stone-900 ${t.id === selectedId ? "border-stone-900" : "border-transparent"}`}
              style={{ background: t.color }}
            >
              {t.name || "(unnamed)"}
            </button>
          ))}
          <button className={smallBtn} onClick={addType}>
            + New type
          </button>
          {types.length === 0 && (
            <button className={smallBtn} onClick={() => onChange(defaultTypes())}>
              Restore starter types
            </button>
          )}
        </div>

        {current ? (
          <div className="min-h-0 space-y-3 overflow-y-auto">
            <div className="flex flex-wrap items-end gap-3">
              <label className="min-w-0 flex-1 text-sm">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-zinc-300">Name</span>
                <input className={input} value={current.name} onChange={(e) => patchType({ name: e.target.value })} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-zinc-300">Looks like</span>
                <select className={input} value={current.kind} onChange={(e) => patchType({ kind: e.target.value === "section" ? "section" : "note" })}>
                  <option value="note">Sticky note</option>
                  <option value="section">Section (holds other items)</option>
                </select>
              </label>
            </div>

            <div className="flex gap-2">
              {PAPER_COLORS.map((c) => (
                <button
                  key={c}
                  aria-label={`Colour ${c}`}
                  onClick={() => patchType({ color: c })}
                  className={`h-8 w-8 rounded-sm border-2 ${current.color === c ? "border-stone-900 dark:border-white" : "border-black/20"}`}
                  style={{ background: c }}
                />
              ))}
            </div>

            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-zinc-300">Fields</div>
              {current.fields.length === 0 && <div className="py-2 text-sm text-stone-500 dark:text-zinc-300">No fields yet.</div>}
              {current.fields.map((f, i) => (
                <div key={f.id} className="mb-2 rounded-md bg-stone-200 p-2 dark:bg-zinc-600">
                  <div className="flex items-center gap-2">
                    <input className={input} value={f.name} onChange={(e) => patchField(f.id, { name: e.target.value })} aria-label="Field name" />
                    <select
                      className={`${input} w-auto`}
                      value={f.type}
                      onChange={(e) => {
                        const type = e.target.value as FieldType;
                        patchField(f.id, { type, options: type === "select" ? f.options ?? ["Option 1", "Option 2"] : undefined });
                      }}
                      aria-label="Field type"
                    >
                      {FIELD_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <button className={smallBtn} onClick={() => moveField(i, -1)} aria-label="Move field up">
                      ↑
                    </button>
                    <button className={smallBtn} onClick={() => moveField(i, 1)} aria-label="Move field down">
                      ↓
                    </button>
                    <button className={`${smallBtn} text-red-700 dark:text-red-300`} onClick={() => patchType({ fields: current.fields.filter((x) => x.id !== f.id) })} aria-label="Delete field">
                      ✕
                    </button>
                  </div>
                  {f.type === "select" && (
                    <input
                      className={`${input} mt-2`}
                      value={(f.options ?? []).join(", ")}
                      onChange={(e) => patchField(f.id, { options: e.target.value.split(",").map((o) => o.trim()).filter(Boolean) })}
                      placeholder="Choices, separated by commas"
                      aria-label="Choices"
                    />
                  )}
                </div>
              ))}
              <button className={smallBtn} onClick={() => patchType({ fields: [...current.fields, newField()] })}>
                + Add field
              </button>
            </div>

            <div className="pt-1">
              <button className={`${smallBtn} text-red-700 dark:text-red-300`} onClick={deleteType}>
                Delete this type
              </button>
            </div>
          </div>
        ) : (
          <div className="py-4 text-sm text-stone-500 dark:text-zinc-300">Pick a type to edit it, or make a new one.</div>
        )}
      </div>
    </div>
  );
}
