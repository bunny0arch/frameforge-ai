# Frameforge AI

Frameforge is a premium image-analysis and reverse-prompting workspace. Upload a visual reference, ask for a read, and receive a detailed generation prompt that preserves composition, light, color, materials, and mood.

The visual language is intentionally editorial and restrained: charcoal surfaces, cream typography, thin rules, an acid-lime signal color, and motion that communicates state instead of decorating the screen.

## Quick start

```bash
npm install
cp .env.example .env.local
# Add OPENAI_API_KEY to .env.local for live analysis
npm run dev
```

Open `http://localhost:3000`.

## Provider configuration

The browser sends image data only to the local `/api/analyze` route. The OpenAI key remains server-side. Set:

```bash
OPENAI_API_KEY=...
OPENAI_VISION_MODEL=gpt-4o-mini
```

Without a key, the interface runs in demo mode with a curated sample analysis so the interaction can be evaluated without credentials.

## Product architecture

- `app/page.tsx` — client workspace state, upload flow, conversation, prompt editor, model selector.
- `app/api/analyze/route.ts` — server-side vision request and structured analysis contract.
- `app/globals.css` — design tokens, responsive split-view layout, editorial motion.
- `ARCHITECTURE.md` — extension points for adapters, persistence, generation, and comparison.

## Deployment

This is Vercel-ready. Import the GitHub repository, set `OPENAI_API_KEY` and optionally `OPENAI_VISION_MODEL`, then deploy with the default Next.js settings.

## Scope notes

The first version deliberately prioritizes the core loop: upload → understand → generate → refine. Local conversation state is kept in React so Supabase persistence, accounts, prompt libraries, and image generation can be added without changing the provider boundary.
