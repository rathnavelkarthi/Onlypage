# OnlyPage — Design Overhaul (Style DNA)

## Original problem statement
Implement the "OnlyPage Design Overhaul Proposal" on the existing repo
`rathnavelkarthi/Onlypage` (Vite + React 19 + Express + Supabase + Gemini).
Goal: kill the "AI-slop" look and out-design block website builders. User
priorities: working page-builder MVP, then Wave 2 (Style DNA system), then
Wave 1 (system foundation). Free integrations welcome. Work on the repo and
push to GitHub (via the platform "Save to GitHub" button).

## Stack / run model (this environment)
- Node/Vite/Express app served on port 3000 (frontend + vite middleware) and a
  second API-only instance of the same `server.ts` on 8001 (`API_ONLY=true`).
- Supervisor programs: `onlypage_web` (3000) and `onlypage_api` (8001) in
  `/etc/supervisor/conf.d/onlypage.conf`. `.env` at repo root.
- Ingress: `/api/*` -> 8001, everything else -> 3000 (matches the app's
  relative `/api` fetches).
- NOTE: `DISABLE_HMR=true` disables Vite file-watching, so **restart
  `onlypage_web` after editing client code** or Vite serves a cached transform.

## What's been implemented (2026-08-12)
- **Style DNA system (Wave 2 / Idea B1)** — new `components/site-dna.ts`:
  `SiteDNA` type + 6 curated presets (Quiet Luxury, Noir Luxe, Bold Poster,
  Warm Editorial, Mono Technical, Soft & Airy). `applyDNAToBlocks()` re-renders
  a whole site through one system (paired fonts, palette with section rhythm,
  radius/shadow/motion language). Anti-slop rule (Idea B2): banned display
  fonts (Inter/Roboto/Arial/Open Sans/Space Grotesk) — none used as display.
- **"Change the whole brand in one sentence"** — `/api/ai/edit` keyless path
  now classifies the prompt to a DNA (`classifyPromptToDNA`) and returns the
  whole site re-styled coherently. Gemini path preserved when a key is present.
- **Editor command palette** — `visual-builder.tsx` adds `Restyle site — <DNA>`
  commands that apply a DNA client-side to all blocks + header + footer.
- **No-login demo** — `src/components/DnaDemo.tsx` at `/?demo=dna`; live preset
  switcher rendering the real `BuilderRenderer` through each DNA. Verified for
  all 6 presets.
- **Wave 1 foundation (Idea A1/B3)** — `src/index.css`: 4px spacing scale,
  texture/craft utilities (`.dna-grain`, `.dna-noise`, `.hairline`,
  `.dna-dropcap`, `.dna-rise`).

## Verified
- `/api/ai/edit` (8001) returns coherent DNA for 6 distinct prompts; page rhythm
  applied (Hero/CTA = ink ground, content alternates paper/surface).
- `/?demo=dna` renders and switches all 6 systems (screenshots captured).
- Landing (`ModernLanding`) unchanged and healthy.

## Known limits / not done
- The full editor + dashboard are gated behind Supabase auth; no test account
  available in this env, so those flows were not exercised end-to-end.
- Split-hero has a pre-existing low-contrast floating "media" badge + faint
  secondary-button label (renderer chrome, not DNA) — cosmetic only.
- Gemini transform runs only when `GEMINI_API_KEY` is set (currently empty ->
  keyless DNA path).

## Live-audit Wave 1 bug fixes (2026-08-12) — verified via testing_agent (4/4 PASS, live login)
- B1/B5: `TextReveal` (builder-effects.tsx) now has a 500ms `forceVisible`
  fallback — the animated hero title no longer stays invisible (opacity:0)
  inside the builder's transformed canvas. Verified opacity:1.
- B4: `VisualBuilder` wrapped in `<ErrorBoundary>` (efferd-dashboard-2.tsx);
  Manage opens the Page Manager cleanly, no `insertBefore` white-screen.
- B6: rebranded all `uiverse-*`/`mui-*` variant names, tags and `library`
  badges to on-brand names (e.g. "Ambient Glass Hero", "Material Elevation
  Hero"); removed `UIverse`/`MUI` from the `library` type union. Zero
  user-visible or type-level traces remain. (Internal variant IDs unchanged.)
- Deferred from the audit: B2 (stray SUBTITLE hover label — editor chrome,
  already gated off published sites), B3 (site-kit thumbnail capture pipeline —
  ~100 headless screenshots, multi-day). Waves 2-3 are multi-week.

## Backlog (from the proposal)
- P1: Surface Style DNA as a first-class panel/tab in the editor (live DNA
  editor — Idea B8 Studio Mode); wire the AI command bar UI to `/api/ai/edit`.
- P1: Apply DNA texture layer inside the renderer (consume `.dna-grain/.noise`
  on dark grounds) — Idea B3.
- P2: A4 curate/dedupe `builder-data.ts` variants; A2 typography sweep; A5
  delete dead files. B4 structural hero variants. B5 bento composer. B7 photo
  plan. B9 microcopy sweep.
