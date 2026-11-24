import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";

interface Props extends ComponentPropsWithoutRef<"div"> {
  /** Classes for the paper itself: padding and layout (colour, border and radius are already set). */
  paperClassName?: string;
  paperStyle?: CSSProperties;
  /** Fasteners go here, not in the children: they hang over the paper's edge, which the fold's clipping would cut off. */
  fasteners?: ReactNode;
  children: ReactNode;
}

/**
 * A floating paper panel with a folded (dog-eared) bottom-right corner. `className` and `style` go on the outer
 * element (position, size, animation); the paper inside is cut at the corner and carries a small flap, and the
 * outer element draws the shadow so it follows the cut. See Specs/StyleGuide.md.
 */
export default function Folded({ className = "", paperClassName = "", paperStyle, fasteners, children, ...rest }: Props) {
  return (
    <div {...rest} className={`dog-shadow ${className}`}>
      {fasteners}
      <div className={`dog-clip rounded-ui border border-line bg-paper text-ink ${paperClassName}`} style={paperStyle}>
        {children}
      </div>
    </div>
  );
}
