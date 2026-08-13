import React, { useState } from 'react';
import { WandSparkles, ArrowRight } from 'lucide-react';
import { SITE_DNA_PRESETS, type SiteDNA } from '@/components/site-dna';

const RADIUS: Record<SiteDNA['radius'], number> = { sharp: 4, soft: 14, round: 22, pill: 26 };
const SHADOW: Record<SiteDNA['shadow'], string> = {
  none: 'none',
  paper: '0 1px 2px rgba(24,32,29,0.08), 0 8px 24px rgba(24,32,29,0.06)',
  floating: '0 24px 60px rgba(24,32,29,0.22)',
};
const SENTENCE: Record<string, string> = {
  'quiet-luxury': 'make it feel premium and refined',
  'noir-luxe': 'make it dark, cinematic and gold',
  'bold-poster': 'make it bold and playful',
  'warm-editorial': 'make it warm, earthy and organic',
  'mono-technical': 'make it look technical and precise',
  'soft-airy': 'make it soft, friendly and airy',
};

export default function StyleDnaShowcase() {
  const [dna, setDna] = useState<SiteDNA>(SITE_DNA_PRESETS[0]);
  const p = dna.palette;
  const r = RADIUS[dna.radius];
  const lum = (hex: string) => {
    const h = hex.replace('#', '');
    if (h.length < 6) return 1;
    const [rr, gg, bb] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
    return (0.299 * rr + 0.587 * gg + 0.114 * bb) / 255;
  };
  const dark = lum(p.paper) < 0.5;
  const heading = dark ? p.onInk : p.ink;
  const cardText = lum(p.surface) < 0.5 ? p.onInk : p.ink;

  return (
    <section id="style-dna" className="border-y border-[#18201d]/10 bg-white py-18 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#70a10d]">
            <WandSparkles size={14} /> Style DNA
          </p>
          <h2 className="mt-3 text-4xl font-black tracking-[-0.06em] sm:text-5xl">
            Change your whole brand in one sentence.
          </h2>
          <p className="mt-5 text-base leading-7 text-[#53605a]">
            Other builders hand you a pile of blocks. OnlyPage generates a coherent design
            system — fonts, colour, spacing, corners and motion move together. Tap a direction
            and watch every section follow.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          {/* Controls */}
          <div>
            {/* Command bar mock */}
            <div className="flex items-center gap-2 rounded-xl border border-[#18201d]/15 bg-[#f7f7f4] px-4 py-3">
              <WandSparkles size={15} className="shrink-0 text-[#70a10d]" />
              <span className="text-sm font-semibold text-[#18201d]" data-testid="dna-sentence">“{SENTENCE[dna.id]}”</span>
            </div>

            <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-[#96a099]">Pick a direction</p>
            <div className="mt-3 flex flex-wrap gap-2" data-testid="dna-chip-list">
              {SITE_DNA_PRESETS.map((preset) => {
                const active = preset.id === dna.id;
                return (
                  <button
                    key={preset.id}
                    data-testid={`dna-chip-${preset.id}`}
                    onClick={() => setDna(preset)}
                    className="inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-bold transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400"
                    style={{
                      borderColor: active ? preset.palette.accent : 'rgba(24,32,29,0.15)',
                      background: active ? '#18201d' : '#fff',
                      color: active ? '#fff' : '#18201d',
                    }}
                  >
                    <span className="inline-block size-2.5 rounded-full" style={{ background: preset.palette.accent }} />
                    {preset.name}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-xl border border-[#18201d]/10 bg-[#f7f7f4] p-4 text-xs font-semibold text-[#53605a]">
              Now applying: <span className="text-[#18201d]">{dna.fonts.display}</span> display ·{' '}
              <span className="text-[#18201d]">{dna.fonts.body}</span> body ·{' '}
              <span className="capitalize text-[#18201d]">{dna.radius}</span> corners ·{' '}
              <span className="capitalize text-[#18201d]">{dna.texture}</span> texture
            </div>
          </div>

          {/* Live preview */}
          <div
            data-testid="dna-preview"
            className="overflow-hidden transition-all duration-500"
            style={{
              background: p.paper,
              borderRadius: r + 6,
              boxShadow: SHADOW[dna.shadow] === 'none' ? '0 0 0 1px rgba(24,32,29,0.12)' : SHADOW[dna.shadow],
              fontFamily: dna.fonts.body,
            }}
          >
            {/* browser chrome */}
            <div className="flex items-center gap-2 px-5 py-3" style={{ background: p.ink }}>
              <span className="size-2 rounded-full" style={{ background: '#cf7964' }} />
              <span className="size-2 rounded-full" style={{ background: '#e2bb58' }} />
              <span className="size-2 rounded-full" style={{ background: '#7aa964' }} />
              <span className="ml-2 font-mono text-[11px]" style={{ color: p.onInk, opacity: 0.6 }}>
                yourbrand.onlypage.in
              </span>
            </div>

            <div className="p-7 transition-all duration-500 sm:p-10">
              <span
                className="inline-block px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em]"
                style={{ background: p.accent, color: p.onAccent, borderRadius: dna.radius === 'pill' ? 999 : r }}
              >
                New collection
              </span>
              <h3
                className="mt-5 leading-[0.98]"
                style={{
                  fontFamily: dna.fonts.display,
                  color: heading,
                  fontWeight: dna.titleWeight === 'black' ? 900 : dna.titleWeight === 'normal' ? 500 : 700,
                  fontSize: 'clamp(1.9rem, 3.4vw, 2.9rem)',
                  letterSpacing: '-0.02em',
                }}
              >
                Made to be remembered.
              </h3>
              <p className="mt-4 max-w-md text-sm leading-6" style={{ color: p.muted }}>
                The same content, rendered through one design system. Every choice feels deliberate.
              </p>
              <button
                className="mt-6 inline-flex items-center gap-2 px-5 py-3 text-sm font-bold transition"
                style={{ background: p.accent, color: p.onAccent, borderRadius: dna.radius === 'pill' ? 999 : r }}
              >
                Shop the collection <ArrowRight size={15} />
              </button>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {['Free delivery', '2-year promise', 'Made locally'].map((t) => (
                  <div
                    key={t}
                    className="p-4"
                    style={{
                      background: p.surface,
                      color: cardText,
                      borderRadius: r,
                      border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : 'rgba(24,32,29,0.08)'}`,
                    }}
                  >
                    <div className="size-2.5 rounded-full" style={{ background: p.accent }} />
                    <p className="mt-3 text-sm font-bold" style={{ fontFamily: dna.fonts.display, color: cardText }}>{t}</p>
                    <p className="mt-1 text-xs" style={{ color: p.muted }}>Trusted by real customers.</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
