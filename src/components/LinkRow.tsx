import { CONNECTOR_COLORS, LINK_STYLES } from "@/lib/model";
import type { Link, LinkStyle } from "@/lib/types";
import { field, select } from "./cardStyles";

interface Props {
  link: Link;
  /** Title of the item at the other end. */
  otherTitle: string;
  onPatch: (patch: Partial<Link>) => void;
  onRemove: () => void;
}

/** One connector in the edit card: where it goes, and how it looks (style, colour, label). */
export default function LinkRow({ link, otherTitle, onPatch, onRemove }: Props) {
  return (
    <div className="mb-2 border-t border-dashed border-black/30 pt-1.5">
      <div className="flex items-center justify-between py-0.5">
        <span className="truncate">↔ {otherTitle}</span>
        <button className="px-2 text-red-700" onClick={onRemove} aria-label="Cut string">
          ✂
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={link.style ?? "string"}
          onChange={(e) => onPatch({ style: e.target.value as LinkStyle })}
          className={select}
          aria-label="Connector style"
        >
          {LINK_STYLES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <div className="flex gap-1.5">
          {CONNECTOR_COLORS.map((c) => (
            <button
              key={c}
              aria-label={`Connector colour ${c}`}
              onClick={() => onPatch({ color: c })}
              className={`h-5 w-5 rounded-full border-2 ${(link.color ?? CONNECTOR_COLORS[0]) === c ? "border-stone-800" : "border-black/25"}`}
              style={{ background: c }}
            />
          ))}
        </div>
      </div>
      <input
        value={link.label ?? ""}
        onChange={(e) => onPatch({ label: e.target.value || undefined })}
        placeholder="Label (e.g. 20 min drive)"
        className={`${field} mt-1 text-sm`}
      />
    </div>
  );
}
