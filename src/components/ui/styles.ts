// Shared class strings for the app chrome (top bar, drawers, dialogs, panels). Colours come from the tokens in
// globals.css, so they follow the theme with no dark: variants. The rules behind them live in Specs/StyleGuide.md.

const press = "transition active:translate-y-px";

/** An icon-only button, 44px square (minimum tap target). */
export const iconBtn = `chrome-focus inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-ui text-ink hover:bg-paper-2 active:bg-paper-3 ${press}`;

/** The one main action in a view: filled thread red. */
export const primaryBtn = `chrome-focus inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-ui bg-thread px-4 text-sm font-bold text-on-thread shadow-paper hover:bg-thread-deep ${press}`;

/** An ordinary action: a paper button with a hairline border. */
export const secondaryBtn = `chrome-focus inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-ui border border-line bg-paper px-4 text-sm font-semibold text-ink hover:bg-paper-2 active:bg-paper-3 ${press}`;

/** A destructive action: same as secondary but in thread red. */
export const dangerBtn = `chrome-focus inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-ui border border-line bg-paper px-4 text-sm font-semibold text-thread hover:bg-paper-2 active:bg-paper-3 ${press}`;

/** A full-width row in a list or menu (icon, label, optional detail). */
export const rowBtn = `chrome-focus flex min-h-11 w-full items-center gap-3 rounded-ui px-3 py-2 text-left text-ink hover:bg-paper-2 active:bg-paper-3 ${press}`;

/** Small uppercase heading above a group of controls. */
export const groupLabel = "px-3 pb-1 pt-5 text-xs font-bold uppercase tracking-widest text-ink-faint";

/** A floating paper panel (search, hints, banners). */
export const panel = "rounded-ui border border-line bg-paper text-ink shadow-paper";

/** A text field in the chrome. */
export const inputField =
  "chrome-focus w-full rounded-ui border border-line bg-paper-2 px-3 py-2.5 text-base text-ink placeholder:text-ink-faint";

/** A small label button, e.g. a breadcrumb step. */
export const chip = `chrome-focus inline-flex h-9 max-w-44 items-center truncate rounded-ui border border-line bg-paper px-3.5 text-sm font-semibold text-ink shadow-paper hover:bg-paper-2 active:bg-paper-3 ${press}`;
