# Test Credentials

## Auth
No login credentials are available in this environment. The editor/dashboard is
gated behind Supabase auth (project `dcvwfmvfbygxmmwjuxrk.supabase.co`, keys in
`.env`), and no seeded/confirmed test user exists here. Public surfaces below
are testable without login.

## Publicly testable surfaces (no login)
- Landing page: `<PREVIEW_URL>/`
- Style DNA demo: `<PREVIEW_URL>/?demo=dna`
  - data-testids: `dna-preset-list`, `dna-preset-<id>` (ids: quiet-luxury,
    noir-luxe, bold-poster, warm-editorial, mono-technical, soft-airy),
    `dna-active-label`, `dna-canvas`.
- Backend DNA transform (keyless): `POST <PREVIEW_URL>/api/ai/edit`
  body `{ "prompt": "make it bold and playful", "blocks": [ ... WebBlock[] ] }`
  -> `{ blocks, dna:{id,name,fonts,palette}, message }`.
