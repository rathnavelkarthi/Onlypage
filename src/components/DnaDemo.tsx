import { useMemo, useState } from "react";
import { BuilderRenderer } from "@/components/builder-renderer";
import { STYLE_FAMILY_TOKENS } from "@/components/builder-style-families";
import {
  SITE_DNA_PRESETS,
  applyDNAToBlocks,
  type SiteDNA,
} from "@/components/site-dna";
import type { WebBlock } from "@/components/builder-types";

const base = STYLE_FAMILY_TOKENS.minimal;
const uid = () => crypto.randomUUID();

function makeSampleSite(brand: string): WebBlock[] {
  return [
    {
      id: uid(),
      type: "Hero",
      variant: "split",
      title: `${brand} helps your business look considered.`,
      subtitle:
        "One design system, applied to every section — fonts, palette, radius, shadow and motion all move together.",
      badge: "STYLE DNA DEMO",
      btnText: "Start a project",
      secondaryBtnText: "See the system",
      imageUrl:
        "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=85&w=1400",
      styles: { ...base },
    },
    {
      id: uid(),
      type: "Features",
      variant: "bento-box",
      title: "One coherent system, not ninety loose blocks.",
      subtitle:
        "Every block renders through the DNA, so the page reads as one brand.",
      features: [
        {
          id: uid(),
          title: "Paired typography",
          desc: "Display and body fonts chosen together — never the AI-slop default.",
          icon: "Type",
        },
        {
          id: uid(),
          title: "Palette with rhythm",
          desc: "Ink, paper, surface and one accent alternate for depth.",
          icon: "Palette",
        },
        {
          id: uid(),
          title: "Radius & shadow language",
          desc: "Sharp, soft, round or pill — decided once, applied everywhere.",
          icon: "SquareStack",
        },
      ],
      styles: { ...base },
    },
    {
      id: uid(),
      type: "Testimonials",
      variant: "review-cards",
      title: "Change the whole brand in one sentence.",
      subtitle: "Mutate the DNA and every section follows instantly.",
      testimonials: [
        {
          id: uid(),
          name: "Maya Rao",
          role: "Founder · Common Ground",
          content:
            "It finally looks like one brand instead of a pile of templates.",
          avatar: "",
          rating: 5,
        },
        {
          id: uid(),
          name: "Aarav Mehta",
          role: "CEO · Morrow",
          content: "Every choice feels deliberate — and it took one click.",
          avatar: "",
          rating: 5,
        },
      ],
      styles: { ...base },
    },
    {
      id: uid(),
      type: "CTA",
      variant: "simple-cta",
      title: "Your idea deserves a place online.",
      subtitle: "Pick a design system below and watch the page transform.",
      btnText: "Create your page",
      styles: { ...base },
    },
  ];
}

export default function DnaDemo() {
  const sample = useMemo(() => makeSampleSite("OnlyPage"), []);
  const [dna, setDna] = useState<SiteDNA>(SITE_DNA_PRESETS[0]);
  const blocks = useMemo(() => applyDNAToBlocks(sample, dna), [sample, dna]);

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-5 py-3">
          <div className="mr-2">
            <p className="text-sm font-bold text-slate-900">Style DNA</p>
            <p className="text-xs font-medium text-slate-500">
              One sentence → whole-site design system
            </p>
          </div>
          <div className="flex flex-wrap gap-2" data-testid="dna-preset-list">
            {SITE_DNA_PRESETS.map((preset) => {
              const active = preset.id === dna.id;
              return (
                <button
                  key={preset.id}
                  data-testid={`dna-preset-${preset.id}`}
                  onClick={() => setDna(preset)}
                  className="editor-interactive flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold"
                  style={{
                    borderColor: active ? preset.palette.accent : "#e2e8f0",
                    background: active ? preset.palette.ink : "#fff",
                    color: active ? preset.palette.onInk : "#0f172a",
                  }}
                >
                  <span
                    className="inline-block size-3 rounded-full"
                    style={{ background: preset.palette.accent }}
                  />
                  {preset.name}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div
        className="mx-auto max-w-3xl px-5 py-3 text-center text-xs font-medium text-slate-500"
        data-testid="dna-active-label"
      >
        Active system: <span className="font-bold text-slate-900">{dna.name}</span>{" "}
        · display <span className="font-bold">{dna.fonts.display}</span> · body{" "}
        <span className="font-bold">{dna.fonts.body}</span>
      </div>

      <main data-testid="dna-canvas">
        {blocks.map((block) => (
          <BuilderRenderer
            key={block.id}
            block={block}
            isActive={false}
            onSelect={() => {}}
          />
        ))}
      </main>
    </div>
  );
}
