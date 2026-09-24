'use client'

import { useRef, useState } from 'react'

type Analysis = Record<string, string | string[]> & { prompt: string; negativePrompt: string; demo?: boolean; provider?: string }
type Message = { role: 'user' | 'assistant'; text: string }

const sampleImage = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=85'
const sections = ['subject', 'composition', 'camera', 'lighting', 'color', 'environment', 'materials', 'style', 'mood', 'quality']
const labels: Record<string, string> = { subject: 'Subject', composition: 'Composition', camera: 'Camera', lighting: 'Lighting', color: 'Color', environment: 'Environment', materials: 'Materials', style: 'Style', mood: 'Mood', quality: 'Quality' }

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [image, setImage] = useState(sampleImage)
  const [fileMeta, setFileMeta] = useState('Demo reference · ready')
  const [instruction, setInstruction] = useState('Analyze this image and create a detailed reconstruction prompt.')
  const [model, setModel] = useState('General')
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [prompt, setPrompt] = useState('')
  const [negative, setNegative] = useState('')
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [notice, setNotice] = useState('')

  function readFile(file?: File) {
    if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return setNotice('Choose a JPG, PNG, or WEBP image.')
    if (file.size > 8 * 1024 * 1024) return setNotice('Keep images under 8 MB for the free tier.')
    const reader = new FileReader()
    reader.onload = () => { setImage(String(reader.result)); setFileMeta(`${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB`); setAnalysis(null); setMessages([]); setPrompt(''); setNegative(''); setNotice('') }
    reader.readAsDataURL(file)
  }

  async function analyze(nextInstruction = instruction) {
    if (!image) return setNotice('Add an image before analyzing.')
    setLoading(true); setNotice('')
    setMessages(current => [...current, { role: 'user', text: nextInstruction }])
    try {
      const res = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image, instruction: nextInstruction, model }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAnalysis(data); setPrompt(data.prompt || ''); setNegative(data.negativePrompt || '')
      setMessages(current => [...current, { role: 'assistant', text: data.demo ? 'Demo analysis loaded. Add a Gemini API key in Vercel for live vision analysis.' : `Analysis complete with ${data.provider || 'Gemini'}.` }])
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Something went wrong.') }
    finally { setLoading(false) }
  }

  function copy(value: string, label: string) { navigator.clipboard?.writeText(value); setNotice(`${label} copied.`); window.setTimeout(() => setNotice(''), 1800) }
  function reset() { setImage(''); setAnalysis(null); setMessages([]); setPrompt(''); setNegative(''); setFileMeta('No image selected') }

  return <main className="appShell">
    <header className="nav"><div className="wordmark"><span className="wordmarkIcon">F</span><span>FRAMEFORGE</span></div><div className="navCenter"><span className="navDot" /> FREE VISION WORKSPACE</div><button className="navButton" onClick={() => setNotice('Gemini free-tier provider is configured in the server route.')}>How it works</button></header>
    <div className="appGrid">
      <aside className="rail"><div className="railTitle">WORKSPACE</div><div className="step active"><span>01</span><b>Reference</b><small>Upload image</small></div><div className={`step ${analysis ? 'active' : ''}`}><span>02</span><b>Analysis</b><small>Read visual language</small></div><div className={`step ${analysis ? 'active' : ''}`}><span>03</span><b>Prompt</b><small>Refine and copy</small></div><div className="railBottom"><span className="goldLine" /> <p>Runs on Gemini’s free developer tier. No OpenAI billing required.</p></div></aside>
      <section className="mainArea">
        <div className="hero"><div><span className="kicker">IMAGE → LANGUAGE</span><h1>Make the invisible<br /><em>visible.</em></h1><p>Upload a reference. Frameforge breaks down its visual language and gives you a prompt you can actually use.</p></div><div className="heroBadge">GEMINI<br /><strong>FREE TIER</strong></div></div>
        <div className="workspaceCard">
          <div className="cardTop"><div><span className="stepNumber">01</span><h2>Reference image</h2></div><button className="smallButton" onClick={reset}>Clear</button></div>
          <div className="uploadStage" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); readFile(e.dataTransfer.files?.[0]) }}>
            {image ? <><img src={image} alt="Selected visual reference" /><div className="imageShade" /><div className="imageLabel"><span>REFERENCE</span><span>{fileMeta}</span></div></> : <button className="dropPrompt" onClick={() => inputRef.current?.click()}><span className="uploadIcon">＋</span><b>Drop an image here</b><small>or browse · JPG, PNG, WEBP · max 8 MB</small></button>}
          </div>
          <div className="cardBottom"><span>{image ? fileMeta : 'No image selected'}</span><button className="goldButton" onClick={() => inputRef.current?.click()}>{image ? 'Replace image' : 'Choose image'} <span>→</span></button></div>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e => readFile(e.target.files?.[0])} />
        </div>
        <div className="workspaceCard analysisCard"><div className="cardTop"><div><span className="stepNumber">02</span><h2>Tell it what matters</h2></div><select className="targetSelect" value={model} onChange={e => setModel(e.target.value)}><option>General</option><option>Flux</option><option>Midjourney</option><option>Stable Diffusion</option></select></div><div className="instructionRow"><textarea value={instruction} onChange={e => setInstruction(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); analyze() } }} placeholder="Analyze this image…" /><button className="analyzeButton" onClick={() => analyze()} disabled={loading}>{loading ? 'Reading…' : 'Analyze image'} <span>↗</span></button></div></div>
        {analysis && <div className="resultsGrid"><section className="resultCard"><div className="resultHeader"><div><span className="stepNumber">03</span><h2>Visual read</h2></div><span className="readyPill">{analysis.demo ? 'DEMO' : 'LIVE'} · READY</span></div><div className="analysisList">{sections.map((key, i) => <div className="analysisItem" key={key}><div><span>0{i + 1}</span><b>{labels[key]}</b></div><p>{String(analysis[key])}</p></div>)}</div></section><section className="resultCard promptCard"><div className="resultHeader"><div><span className="stepNumber">04</span><h2>Generation prompt</h2></div><div className="promptButtons"><button onClick={() => copy(prompt, 'Prompt')}>Copy</button><button onClick={() => setEditing(!editing)}>{editing ? 'Done' : 'Edit'}</button></div></div>{editing ? <textarea className="promptEditor" value={prompt} onChange={e => setPrompt(e.target.value)} autoFocus /> : <p className="promptCopy">{prompt}</p>}<div className="negativeBox"><span>NEGATIVE PROMPT</span><p>{negative}</p></div><div className="promptFooter"><button onClick={() => analyze('Keep the subject and composition exact. Improve the cinematic quality and optimize this prompt for the selected target model.')}>Refine with Gemini →</button><button onClick={() => copy(negative, 'Negative prompt')}>Copy negative</button></div></section></div>}
        {messages.length > 0 && <div className="conversation"><div className="conversationTitle">SESSION NOTES</div>{messages.map((message, i) => <div className={`note ${message.role}`} key={i}><span>{message.role === 'user' ? 'YOU' : 'FRAMEFORGE'}</span><p>{message.text}</p></div>)}</div>}
        {notice && <div className="toast">{notice}</div>}
      </section>
    </div>
  </main>
}
