import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export const runtime = 'nodejs'

const demo = {
  subject: 'A dark graphite sports coupe, photographed in a sparse architectural setting.',
  composition: 'Low-angle three-quarter view. The car sits slightly right of center with generous negative space above and a strong horizontal floor line anchoring the frame.',
  camera: 'Moderately wide perspective, approximately 35–50mm equivalent, with the front quarter in crisp focus and a gentle falloff into the distance.',
  lighting: 'A hard, cool key light skims from camera-left while a warm, narrow practical glow catches the bodywork. Shadows are deep but retain the shape of the environment.',
  color: 'Charcoal blacks, smoked steel, desaturated concrete, and restrained amber highlights. Low saturation with a cinematic cool/warm split.',
  environment: 'Appears to be an industrial studio or covered urban structure with polished concrete and distant vertical architecture.',
  materials: 'Gloss-painted metal with controlled reflections, glass that reads almost black, rubber tires, and a lightly textured concrete floor.',
  style: 'Cinematic automotive editorial photography with a quiet, premium, nocturnal mood.',
  mood: 'Tense, precise, minimal, and quietly futuristic.',
  quality: 'High dynamic range with clean edge detail, controlled highlights, and a small amount of filmic grain.',
  uncertainties: ['Exact camera body and aperture are not observable from the image alone.'],
  prompt: 'Cinematic editorial photograph of a dark graphite sports coupe in a sparse industrial architectural setting, low-angle three-quarter front view, vehicle positioned slightly right of center with generous negative space above, strong horizontal concrete floor line, approximately 35–50mm perspective, crisp focus on the front quarter with gentle background falloff, cool hard key light skimming from camera-left, restrained warm practical highlights catching the bodywork, deep shadows with retained environmental detail, smoked steel and charcoal palette with subtle amber accents, polished concrete floor, controlled reflections on gloss-painted metal and near-black glass, premium nocturnal automotive campaign mood, quiet futuristic tension, high dynamic range, restrained film grain, faithful composition and tonal balance.',
  negativePrompt: 'Over-saturated colors, generic city skyline, extra vehicles, dramatic lens flare, crushed shadow detail, distorted wheels, exaggerated wide-angle distortion, text, logos, watermarks.'
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const image = String(body.image || '')
    const instruction = String(body.instruction || 'Analyze this image and create a detailed reconstruction prompt.')
    const model = String(body.model || 'General')
    if (!image.startsWith('data:image/')) return NextResponse.json({ error: 'Please upload a supported image file.' }, { status: 400 })
    if (image.length > 12_000_000) return NextResponse.json({ error: 'That image is too large. Try an image under 8 MB.' }, { status: 413 })

    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ ...demo, demo: true, model })

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: `You are a visual analysis and prompt-engineering expert. ${instruction}\nTarget model: ${model}. Return JSON with keys subject, composition, camera, lighting, color, environment, materials, style, mood, quality, uncertainties (array), prompt, negativePrompt. Prioritize visual fidelity over generic hype. Mark uncertain inferences clearly.` },
          { type: 'image_url', image_url: { url: image, detail: 'high' } }
        ]
      }]
    })
    const content = completion.choices[0]?.message?.content || '{}'
    return NextResponse.json({ ...JSON.parse(content), model })
  } catch (error) {
    console.error('analysis_error', error)
    return NextResponse.json({ error: 'We couldn’t analyze this image. Try a JPG, PNG, or WEBP under the supported size limit.' }, { status: 500 })
  }
}
