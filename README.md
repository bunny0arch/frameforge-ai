# Frameforge AI

Frameforge is a minimalist image-analysis and reverse-prompting workspace. Upload a visual reference, ask for a read, and receive a detailed generation prompt that preserves composition, light, color, materials, and mood.

The interface uses a focused royal-blue and gold visual system: one clear upload flow, one analysis action, and one prompt workspace. No OpenAI account or OpenAI billing is required.

## Quick start

```bash
npm install
cp .env.example .env.local
# Add a Google AI Studio Gemini API key for live vision analysis
npm run dev
```

Open `http://localhost:3000`.

## Free AI provider

The app uses Google Gemini through the server-side `/api/analyze` route. The default model is `gemini-3-flash-preview`, which Google documents as available through its free tier for experimentation. Create a key in [Google AI Studio](https://aistudio.google.com/app/apikey), then set:

```bash
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-3-flash-preview
```

Without a key, the interface runs in demo mode with a curated sample analysis so the UX can be tested without credentials. Free-tier quotas and availability are controlled by Google and may change.

## Product architecture

- `app/page.tsx` — clear three-step workspace state, upload flow, conversation, prompt editor, and model targeting.
- `app/api/analyze/route.ts` — server-side Gemini request and structured analysis contract.
- `app/globals.css` — royal-blue / gold design tokens and responsive layout.
- `ARCHITECTURE.md` — extension points for persistence, image generation, prompt libraries, and comparison.

## Deployment

This is Vercel-ready. Set `GEMINI_API_KEY` and optionally `GEMINI_MODEL` in the Vercel project environment variables, then redeploy.

## Scope notes

The first version prioritizes the core loop: upload → analyze → generate → refine. Local conversation state is kept in React so accounts, prompt libraries, and cloud history can be added without changing the provider boundary.
