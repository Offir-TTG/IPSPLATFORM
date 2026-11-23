/**
 * The portal's choice chips: one connected bar with dividers, the chosen
 * segment filled (same shape as the admin's, in the portal's colours).
 * Put the bar class on the wrapper and the segment class on each button.
 */

/** On a light page: white bar, purple pick. */
export const portalBar =
  'inline-flex shrink-0 overflow-hidden rounded-full border border-[#e3dcef] bg-white [&>*+*]:border-s [&>*+*]:border-[#e9e3f1]';

/**
 * One segment. `on` fills it in the portal purple; pass a colour in `style`
 * (see portalSegStyle) where a space's own accent should fill it instead.
 */
export const portalSeg = (on: boolean) =>
  `inline-flex shrink-0 items-center justify-center gap-[7px] whitespace-nowrap border-0 px-3.5 py-2 text-sm transition-colors focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#5b3a8e]/50 disabled:opacity-60 ${
    on ? 'bg-[#5b3a8e] font-semibold text-white' : 'bg-white font-medium text-[#221a2e] hover:bg-[#faf8fd]'
  }`;

/** Fill a chosen segment with a space's accent colour instead of the purple. */
export const portalSegStyle = (on: boolean, accent?: string) => (on && accent ? { background: accent } : undefined);

/** On a coloured header: see-through bar, white pick. */
export const heroBar =
  'inline-flex shrink-0 overflow-hidden rounded-full border border-white/30 bg-white/[.10] [&>*+*]:border-s [&>*+*]:border-white/25';

export const heroSeg = (on: boolean) =>
  `inline-flex shrink-0 items-center justify-center whitespace-nowrap border-0 px-4 py-[9px] text-[14.5px] font-semibold transition-colors focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/70 ${
    on ? 'bg-white text-[#2a1846]' : 'bg-transparent text-white hover:bg-white/[.14]'
  }`;
