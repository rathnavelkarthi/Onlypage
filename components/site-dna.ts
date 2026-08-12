// ==========================================
// SITE DNA — a design *system*, not a palette.
//
// Idea B1 from the OnlyPage design overhaul: block builders output palettes;
// no block builder outputs a coherent system, because coherence needs a rule
// layer they do not have. A SiteDNA is that rule layer. Every block renders
// *through* the DNA, so radius, shadow, font pairing, texture and motion all
// follow one set of decisions. Mutating the DNA changes the whole site in one
// instruction — the "change the whole brand of your site in one sentence"
// feature.
//
// This module is browser-safe AND server-safe (no React / DOM imports), so the
// same rules run in the editor and inside the /api/ai/edit transform.
// ==========================================

import type { BlockCSSStyles, WebBlock } from "./builder-types";

/* Anti-slop rule (Idea B2): these fonts are the statistical median of every
   AI-generated site, so they are banned as a *display* face in generated
   output. They remain fine for body copy. */
export const BANNED_DISPLAY_FONTS = [
  "Inter",
  "Roboto",
  "Arial",
  "Open Sans",
  "Space Grotesk",
];

export type ScaleId = "compact" | "editorial" | "airy";
export type RadiusLanguage = "sharp" | "soft" | "round" | "pill";
export type ShadowLanguage = "none" | "paper" | "floating";
export type TextureId = "clean" | "grain" | "noise";
export type MotionId = "still" | "confident" | "playful";

export interface DNAPalette {
  ink: string; // darkest brand tone / dark grounds
  paper: string; // primary light ground
  surface: string; // secondary ground for rhythm / cards
  accent: string; // the single vivid colour (<= accentUsage of surface)
  muted: string; // secondary text
  onInk: string; // text on ink ground
  onAccent: string; // text on accent
}

export interface SiteDNA {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  fonts: { display: string; body: string };
  scale: ScaleId;
  radius: RadiusLanguage;
  shadow: ShadowLanguage;
  texture: TextureId;
  motion: MotionId;
  accentUsage: number; // advisory: max fraction of surface the accent may touch
  palette: DNAPalette;
  titleWeight: BlockCSSStyles["titleWeight"];
}

// ---- Curated DNA presets ----------------------------------------------------
// Each display font is drawn from the fonts already loaded in index.css and is
// NOT on the banned list. Body fonts may be plain sans (allowed for body).

export const SITE_DNA_PRESETS: SiteDNA[] = [
  {
    id: "quiet-luxury",
    name: "Quiet Luxury",
    description:
      "Serif headlines, warm neutrals, generous air, near-flat surfaces. Understated and expensive.",
    keywords: [
      "luxury", "premium", "elegant", "quiet", "refined", "boutique",
      "high-end", "sophisticated", "classy", "upscale", "minimal-luxury",
    ],
    fonts: { display: "Cormorant Garamond", body: "Plus Jakarta Sans" },
    scale: "airy",
    radius: "sharp",
    shadow: "paper",
    texture: "grain",
    motion: "still",
    accentUsage: 0.05,
    titleWeight: "normal",
    palette: {
      ink: "#1C1917",
      paper: "#FAF8F5",
      surface: "#FFFFFF",
      accent: "#8A7355",
      muted: "#57534E",
      onInk: "#FAF8F5",
      onAccent: "#FFFFFF",
    },
  },
  {
    id: "noir-luxe",
    name: "Noir Luxe",
    description:
      "Dark cinematic ground, gold accent, soft floating cards. Opulent and modern.",
    keywords: [
      "dark", "gold", "cinematic", "black", "opulent", "night", "premium-dark",
      "elegant-dark", "moody", "dramatic", "expensive",
    ],
    fonts: { display: "Playfair Display", body: "Lexend" },
    scale: "editorial",
    radius: "round",
    shadow: "floating",
    texture: "noise",
    motion: "confident",
    accentUsage: 0.06,
    titleWeight: "bold",
    palette: {
      ink: "#080808",
      paper: "#0E0E10",
      surface: "#17171A",
      accent: "#E0B82F",
      muted: "#9A9A9A",
      onInk: "#F5F5F5",
      onAccent: "#080808",
    },
  },
  {
    id: "bold-poster",
    name: "Bold Poster",
    description:
      "Oversized type, hard contrast, one vivid accent. Loud and confident.",
    keywords: [
      "bold", "loud", "poster", "brutal", "punchy", "energetic", "striking",
      "vibrant", "playful", "fun", "sporty", "youthful", "electric",
    ],
    fonts: { display: "Syne", body: "DM Sans" },
    scale: "compact",
    radius: "sharp",
    shadow: "none",
    texture: "noise",
    motion: "playful",
    accentUsage: 0.12,
    titleWeight: "black",
    palette: {
      ink: "#0A0A0A",
      paper: "#FFFFFF",
      surface: "#F4F4F0",
      accent: "#D9F035",
      muted: "#525252",
      onInk: "#FFFFFF",
      onAccent: "#0A0A0A",
    },
  },
  {
    id: "warm-editorial",
    name: "Warm Editorial",
    description:
      "Cream ground, earthy terracotta, organic serif. Nature-distilled and handmade.",
    keywords: [
      "warm", "editorial", "organic", "earthy", "natural", "handmade",
      "artisan", "cozy", "craft", "wellness", "calm-warm", "rustic", "cream",
    ],
    fonts: { display: "Lora", body: "Nunito" },
    scale: "editorial",
    radius: "soft",
    shadow: "paper",
    texture: "grain",
    motion: "confident",
    accentUsage: 0.08,
    titleWeight: "semibold",
    palette: {
      ink: "#2B2118",
      paper: "#FDF9F3",
      surface: "#FFFFFF",
      accent: "#C2683A",
      muted: "#6B5847",
      onInk: "#FDF9F3",
      onAccent: "#FFFFFF",
    },
  },
  {
    id: "mono-technical",
    name: "Mono Technical",
    description:
      "Monospaced type, hairline rules, square corners, zero elevation. Precise and exact.",
    keywords: [
      "technical", "mono", "developer", "code", "precise", "engineering",
      "startup", "saas", "product", "grid", "structural", "utilitarian",
    ],
    fonts: { display: "Space Mono", body: "JetBrains Mono" },
    scale: "compact",
    radius: "sharp",
    shadow: "none",
    texture: "clean",
    motion: "still",
    accentUsage: 0.07,
    titleWeight: "semibold",
    palette: {
      ink: "#18181B",
      paper: "#FAFAFA",
      surface: "#FFFFFF",
      accent: "#2563EB",
      muted: "#52525B",
      onInk: "#FAFAFA",
      onAccent: "#FFFFFF",
    },
  },
  {
    id: "soft-airy",
    name: "Soft & Airy",
    description:
      "Light grounds, rounded pills, diffuse shadows, teal accent. Friendly and calm.",
    keywords: [
      "friendly", "soft", "airy", "modern", "clean", "calm", "approachable",
      "fresh", "light", "wellness-tech", "gentle", "rounded",
    ],
    fonts: { display: "Outfit", body: "Plus Jakarta Sans" },
    scale: "airy",
    radius: "pill",
    shadow: "floating",
    texture: "clean",
    motion: "playful",
    accentUsage: 0.09,
    titleWeight: "bold",
    palette: {
      ink: "#0F2A2A",
      paper: "#F7FBFB",
      surface: "#FFFFFF",
      accent: "#0EA5A4",
      muted: "#48605F",
      onInk: "#F7FBFB",
      onAccent: "#FFFFFF",
    },
  },
];

export function getDNA(id: string): SiteDNA | undefined {
  return SITE_DNA_PRESETS.find((d) => d.id === id);
}

// ---- Natural-language → DNA (keyless) --------------------------------------
// Scores each preset against the words in the prompt so "make this feel premium
// and dark" maps to Noir Luxe, "make it playful" to Bold Poster, etc.

export function classifyPromptToDNA(prompt: string): SiteDNA {
  const text = (prompt || "").toLowerCase();
  let best = SITE_DNA_PRESETS[0];
  let bestScore = -1;
  for (const dna of SITE_DNA_PRESETS) {
    let score = 0;
    if (text.includes(dna.id.replace("-", " "))) score += 5;
    if (text.includes(dna.name.toLowerCase())) score += 5;
    for (const kw of dna.keywords) {
      if (text.includes(kw)) score += kw.includes("-") ? 3 : 2;
    }
    if (score > bestScore) {
      bestScore = score;
      best = dna;
    }
  }
  // Nothing matched — a generic "make it premium/better" nudges to Quiet Luxury.
  return bestScore <= 0 ? getDNA("quiet-luxury")! : best;
}

// ---- DNA → concrete block styles -------------------------------------------

const RADIUS_PX: Record<RadiusLanguage, { card: number; button: number }> = {
  sharp: { card: 2, button: 4 },
  soft: { card: 16, button: 12 },
  round: { card: 24, button: 16 },
  pill: { card: 24, button: 999 },
};

const SHADOW_TOKEN: Record<ShadowLanguage, BlockCSSStyles["cardShadow"]> = {
  none: "none",
  paper: "sm",
  floating: "xl",
};

const SCALE_FACTOR: Record<ScaleId, { pad: number; line: number }> = {
  compact: { pad: 0.85, line: 1.5 },
  editorial: { pad: 1.0, line: 1.7 },
  airy: { pad: 1.2, line: 1.65 },
};

const MOTION_MAP: Record<
  MotionId,
  { hoverEffect: string; clickResponse: string; buttonHoverScale: boolean }
> = {
  still: { hoverEffect: "none", clickResponse: "none", buttonHoverScale: false },
  confident: { hoverEffect: "lift", clickResponse: "scale-down", buttonHoverScale: true },
  playful: { hoverEffect: "scale", clickResponse: "bounce", buttonHoverScale: true },
};

/** Which ground a block sits on, so a single system still has visual rhythm. */
export type SectionRole = "ground" | "paper" | "surface" | "emphasis";

function roleFor(block: WebBlock, contentIndex: number): SectionRole {
  const t = block.type;
  if (t === "Navigation" || t === "Footer") return "ground";
  if (t === "Hero" || t === "CTA") return "emphasis";
  return contentIndex % 2 === 0 ? "paper" : "surface";
}

/**
 * Concrete style overrides for one block, derived entirely from the DNA + the
 * role the block plays in the page rhythm. User-authored layout (paddings kept
 * proportional, textAlign, sizes) is preserved; only the *system* is replaced.
 */
export function dnaToBlockStyles(
  dna: SiteDNA,
  role: SectionRole,
  base: BlockCSSStyles,
): Partial<BlockCSSStyles> {
  const p = dna.palette;
  const radius = RADIUS_PX[dna.radius];
  const scale = SCALE_FACTOR[dna.scale];
  const motion = MOTION_MAP[dna.motion];

  let background = p.paper;
  let text = dna.palette.ink;
  let subtitle = p.muted;
  let cardBg = p.surface;
  let cardText = dna.palette.ink;

  if (role === "ground") {
    background = p.ink;
    text = p.onInk;
    subtitle = p.muted;
    cardBg = p.surface;
    cardText = isDark(p.surface) ? p.onInk : p.ink;
  } else if (role === "emphasis") {
    background = p.ink;
    text = p.onInk;
    subtitle = p.muted;
    cardBg = p.surface;
    cardText = isDark(p.surface) ? p.onInk : p.ink;
  } else if (role === "surface") {
    background = p.surface;
    cardBg = p.paper;
  } else {
    background = p.paper;
    cardBg = p.surface;
  }

  const onGround = isDark(background);
  if (onGround) {
    text = p.onInk;
    subtitle = p.muted;
    cardText = isDark(cardBg) ? p.onInk : p.ink;
  }

  return {
    fontFamily: dna.fonts.display,
    titleWeight: dna.titleWeight,
    lineHeight: scale.line,
    paddingTop: clampPad(base.paddingTop * scale.pad),
    paddingBottom: clampPad(base.paddingBottom * scale.pad),

    backgroundColor: background,
    useGradient: false,
    backgroundGradient: "",
    textColor: text,
    subtitleColor: subtitle,
    accentColor: p.accent,
    badgeBgColor: onGround ? withAlpha(p.accent, 0.16) : tint(p.accent),
    badgeTextColor: onGround ? p.accent : shade(p.accent),

    cardBgColor: cardBg,
    cardTextColor: cardText,
    cardBorderColor: onGround ? "rgba(255,255,255,0.12)" : "#E7E2DA",
    cardBorderWidth: 1,
    cardBorderRadius: radius.card,
    cardShadow: onGround ? "none" : SHADOW_TOKEN[dna.shadow],

    buttonBgColor: p.accent,
    buttonTextColor: p.onAccent,
    buttonBorderRadius: radius.button,
    buttonHoverScale: motion.buttonHoverScale,

    borderStyle: "solid",
    hoverEffect: motion.hoverEffect,
    clickResponse: motion.clickResponse,
  };
}

/**
 * Re-render an entire site through one DNA. Returns brand-new blocks; the
 * caller never mutates the originals. This is the engine behind the one-sentence
 * brand change.
 */
export function applyDNAToBlocks(blocks: WebBlock[], dna: SiteDNA): WebBlock[] {
  let contentIndex = 0;
  return blocks.map((block) => {
    const role = roleFor(block, contentIndex);
    if (role === "paper" || role === "surface") contentIndex += 1;
    const overrides = dnaToBlockStyles(dna, role, block.styles);
    return { ...block, styles: { ...block.styles, ...overrides } };
  });
}

// ---- tiny colour helpers (no deps) -----------------------------------------

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return null;
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

function isDark(color: string): boolean {
  const rgb = hexToRgb(color);
  if (!rgb) return /rgba?\(\s*(\d+)/.test(color) ? false : color.startsWith("#0") || color.startsWith("#1");
  const [r, g, b] = rgb;
  // relative luminance
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum < 0.5;
}

function withAlpha(hex: string, a: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a})`;
}

function tint(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#F1EEE8";
  const [r, g, b] = rgb.map((c) => Math.round(c + (255 - c) * 0.82)) as [number, number, number];
  return `rgb(${r}, ${g}, ${b})`;
}

function shade(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const [r, g, b] = rgb.map((c) => Math.round(c * 0.7)) as [number, number, number];
  return `rgb(${r}, ${g}, ${b})`;
}

function clampPad(px: number): number {
  return Math.max(40, Math.min(160, Math.round(px)));
}
