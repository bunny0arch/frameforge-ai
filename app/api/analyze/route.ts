import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const demo = {
  subject: 'A dark graphite sports coupe in a sparse architectural setting.',
  composition: 'Low-angle three-quarter view, slightly right of center, with generous negative space and a strong horizontal floor line.',
  camera: 'Moderately wide perspective, approximately 35–50mm equivalent, with crisp focus on the front quarter.',
  lighting: 'Cool directional light from camera-left with restrained warm highlights catching the bodywork; deep but readable shadows.',
  color: 'Charcoal black, smoked steel, desaturated concrete, and subtle amber accents with a cool/warm cinematic split.',
  environment: 'An industrial studio or covered urban structure with polished concrete and distant vertical architecture.',
  materials: 'Gloss-painted metal, near-black glass, rubber tires, and lightly textured concrete.',
  style: 'Cinematic automotive editorial photography with a quiet, premium, nocturnal mood.',
  mood: 'Precise, minimal, controlled, and quietly futuristic.',
  quality: 'High dynamic range, clean edge detail, controlled highlights, and restrained film grain.',
  uncertainties: ['Exact camera body and aperture are not observable from the image alone.'],
  prompt: 'Cinematic editorial photograph of a dark graphite sports coupe in a sparse industrial architectural setting, low-angle three-quarter front view, vehicle positioned slightly right of center with generous negative space above, strong horizontal concrete floor line, approximately 35–50mm perspective, crisp focus on the front quarter with gentle background falloff, cool directional key light from camera-left, restrained warm practical highlights catching the bodywork, deep shadows with retained environmental detail, smoked steel and charcoal palette with subtle amber accents, polished concrete floor, controlled reflections on gloss-painted metal and near-black glass, premium nocturnal automotive campaign mood, quiet futuristic tension, high dynamic range, restrained film grain, faithful composition and tonal balance.',
  negativePrompt: 'Over-saturated colors, generic skyline, extra vehicles, dramatic lens flare, crushed shadow detail, distorted wheels, excessive wide-angle distortion, text, logos, watermarks.'
}

function stripDataUrl(value: string) {
  const match = value.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
  if (!match) throw new Error('Invalid image data')
  return { mimeType: match[1], data: match[2] }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const image = String(body.image || '')
    const instruction = String(body.instruction || 'Analyze this image and create a detailed reconstruction prompt.')
    const target = String(body.model || 'General')
    if (!image.startsWith('data:image/')) return NextResponse.json({ error: 'Please upload a JPG, PNG, or WEBP image.' }, { status: 400 })
    if (image.length > 12_000_000) return NextResponse.json({ error: 'That image is too large. Try an image under 8 MB.' }, { status: 413 })
    if (!process.env.GEMINI_API_KEY) return NextResponse.json({ ...demo, demo: true, model: target })

    const { mimeType, data } = stripDataUrl(image)
    const model = process.env.GEMINI_MODEL || 'gemini-3-flash-preview'
    const prompt = `You are a precise visual analyst and reverse-prompt engineer. ${instruction}\nTarget generation model: ${target}. Analyze only what is visible or strongly inferable. Preserve visual fidelity over generic hype. Return JSON only with exactly these keys: subject, composition, camera, lighting, color, environment, materials, style, mood, quality, uncertainties, prompt, negativePrompt. All fields except uncertainties are strings; uncertainties is an array of strings. The prompt must be generation-ready and describe the actual reference, not invented details.`
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data } }] }],
        generationConfig: { temperature: 0.25, responseMimeType: 'application/json' }
      })
    })
    if (!response.ok) throw new Error(`Gemini request failed: ${response.status}`)
    const payload = await response.json()
    const text = payload.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || '').join('') || '{}'
    return NextResponse.json({ ...JSON.parse(text), model: target, provider: 'Google Gemini' })
  } catch (error) {
    console.error('analysis_error', error)
    return NextResponse.json({ error: 'We couldn’t analyze this image. Check your Gemini key or try a smaller JPG, PNG, or WEBP.' }, { status: 500 })
  }
}
