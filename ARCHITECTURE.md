# Architecture

## Request pipeline

```text
Reference image + user intent
          ↓
      /api/analyze
          ↓
Google Gemini multimodal model
          ↓
Structured visual profile + generation prompt
          ↓
Conversation state updates without re-uploading the image
```

The route accepts a base64 data URL and a text instruction. It requests a stable JSON object with subject, composition, camera, lighting, color, environment, materials, style, mood, quality, uncertainties, generation prompt, and negative prompt.

## Provider configuration

The provider is Google Gemini via its REST `generateContent` endpoint. `GEMINI_API_KEY` stays server-side and `GEMINI_MODEL` defaults to `gemini-3-flash-preview`. The route has a demo fallback when no key is present, which keeps the app testable without paid credentials.

The provider boundary is intentionally isolated in `app/api/analyze/route.ts`, so a future adapter can support another vision API without changing the client workspace.

## State model

The client owns `uploadedImage`, `messages`, `analysis`, `generatedPrompt`, `selectedModel`, `isAnalyzing`, `isEditingPrompt`, and `error`. The state shape is serializable so it can move to a database-backed conversation without a UI rewrite.

## Safety and performance

The route validates MIME type and payload size, keeps the key server-side, avoids permanent image storage, and returns friendly errors. Production can add rate limiting, image resizing, and request tracing at the route boundary.
