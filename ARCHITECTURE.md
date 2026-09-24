# Architecture

## Request pipeline

```text
Reference image + user intent
          ↓
      /api/analyze
          ↓
Vision model returns structured JSON
          ↓
Prompt engine renders model-aware prompt
          ↓
Conversation state updates without re-uploading the image
```

The route accepts a base64 data URL and a text instruction. It requests a stable JSON object with subject, composition, camera, lighting, color, environment, materials, style, mood, quality, uncertainties, generation prompt, and negative prompt.

## Provider boundary

`app/api/analyze/route.ts` is intentionally the only provider-specific module. A future `lib/ai/provider.ts` can expose `analyzeImage()` and adapters can translate the base prompt for Flux, Midjourney, Stable Diffusion, or a custom target.

## State model

The client currently owns `uploadedImage`, `messages`, `analysis`, `generatedPrompt`, `selectedModel`, `isAnalyzing`, `isEditingPrompt`, and `error`. The state shape is serializable so it can move to a database-backed conversation without a UI rewrite.

## Safety and performance

The route validates MIME type and payload size, keeps the key server-side, avoids permanent image storage, and returns friendly errors. Production can add rate limiting, image resizing, and request tracing at the route boundary.
