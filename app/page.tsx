'use client'

import { useRef, useState } from 'react'

type Analysis = Record<string, string | string[]> & { prompt: string; negativePrompt: string }
type Message = { role: 'user' | 'assistant'; text: string }

const sampleImage = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=85'
const sections = ['subject', 'composition', 'camera', 'lighting', 'color', 'environment', 'materials', 'style', 'mood', 'quality']
const labels: Record<string, string> = { subject: 'Subject', composition: 'Composition', camera: 'Camera', lighting: 'Lighting', color: 'Color', environment: 'Environment', materials: 'Materials', style: 'Style', mood: 'Mood', quality: 'Quality' }

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [image, setImage] = useState(sampleImage)
  const [fileMeta, setFileMeta] = useState('Example reference · 1400 × 933')
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
    if (!file || !file.type.startsWith('image/')) { setNotice('Please choose a JPG, PNG, or WEBP image.'); return }
    if (file.size > 8 * 1024 * 1024) { setNotice('That image is too large. Try one under 8 MB.'); return }
    const reader = new FileReader()
    reader.onload = () => { setImage(String(reader.result)); setFileMeta(`${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB`); setAnalysis(null); setMessages([]); setPrompt(''); setNotice('') }
    reader.readAsDataURL(file)
  }

  async function analyze(nextInstruction = instruction) {
    if (!image) { setNotice('Add a reference image first.'); return }
    setLoading(true); setNotice('')
    if (!messages.some(m => m.role === 'user')) setMessages([{ role: 'user', text: nextInstruction }])
    else setMessages(m => [...m, { role: 'user', text: nextInstruction }])
    try {
      const res = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image, instruction: nextInstruction, model }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAnalysis(data); setPrompt(data.prompt || ''); setNegative(data.negativePrompt || '')
      setMessages(m => [...m, { role: 'assistant', text: data.demo ? 'Demo analysis loaded. Add an API key to run live vision analysis.' : 'Analysis complete. I mapped the reference into a structured visual profile and a generation-ready prompt.' }])
    } catch (e) { setNotice(e instanceof Error ? e.message : 'Something went wrong.') }
    finally { setLoading(false) }
  }

  function copy(value: string, label: string) { navigator.clipboard?.writeText(value); setNotice(`${label} copied to clipboard.`); window.setTimeout(() => setNotice(''), 2200) }
  function handleDrop(e: React.DragEvent) { e.preventDefault(); readFile(e.dataTransfer.files?.[0]) }

  return <main className="shell">
    <header className="topbar">
      <div className="brand"><span className="brandMark">F</span><span>FRAMEFORGE</span><small>AI</small></div>
      <div className="topbarMeta"><span className="liveDot" /> VISUAL ANALYSIS LAB <span className="topbarRule" /> <button onClick={() => setNotice('Settings are ready for the next build.')}>Settings</button></div>
    </header>

    <div className="workspace">
      <aside className="sidebar">
        <button className="newChat" onClick={() => { setAnalysis(null); setMessages([]); setPrompt(''); setImage(''); setFileMeta('No reference loaded') }}><span>＋</span> New analysis</button>
        <div className="sideLabel">RECENT</div>
        {['Graphite study', 'Portrait / natural light', 'Architecture 04'].map((item, i) => <button className={`history ${i === 0 ? 'active' : ''}`} key={item}><span className="historyIndex">0{i + 1}</span>{item}</button>)}
        <div className="sideFooter"><span className="statusMark" /> Local session<br /><span className="muted">Your references stay in this browser.</span></div>
      </aside>

      <section className="referencePanel">
        <div className="panelHeader"><div><span className="eyebrow">01 / REFERENCE</span><h2>See the image.</h2></div><button className="iconButton" aria-label="Open fullscreen" onClick={() => image && window.open(image, '_blank')}>↗</button></div>
        <div className={`imageFrame ${!image ? 'empty' : ''}`} onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
          {image ? <img src={image} alt="Reference preview" /> : <div className="emptyImage"><span className="crosshair">＋</span><strong>Drop a reference here</strong><small>JPG · PNG · WEBP</small></div>}
          <div className="frameOverlay"><span>REF / 001</span><span>{image ? 'REFERENCE' : 'EMPTY'}</span></div>
        </div>
        <div className="imageMeta"><span>{fileMeta}</span><button onClick={() => inputRef.current?.click()}>{image ? 'Replace image' : 'Choose image'} <span>→</span></button></div>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e => readFile(e.target.files?.[0])} />
        <div className="referenceNote"><span className="noteMark">✳</span><p>Frameforge reads the visual language—not just the subject. Composition, light, material, atmosphere.</p></div>
      </section>

      <section className="analysisPanel">
        <div className="panelHeader"><div><span className="eyebrow">02 / UNDERSTAND</span><h2>Build the read.</h2></div><span className="count">{analysis ? '10 / 10' : '— / 10'}</span></div>
        <div className="analysisScroll">
          {!analysis && !loading && <div className="analysisEmpty"><div className="signalLine" /><h3>Upload a reference<br />to begin.</h3><p>We’ll map its subject, structure, light, color, and atmosphere into a usable visual profile.</p><button className="textButton" onClick={() => image ? analyze() : inputRef.current?.click()}>{image ? 'Start analysis →' : 'Choose a reference →'}</button></div>}
          {loading && <div className="analysisEmpty loadingState"><div className="loaderRing" /><h3>Reading the frame<span className="blink">_</span></h3><p>Finding structure, light, and the details that make this image itself.</p></div>}
          {analysis && <>{sections.map((key, i) => <div className="analysisRow" key={key}><div className="analysisTitle"><span>0{i + 1}</span><b>{labels[key]}</b></div><p>{String(analysis[key])}</p></div>)}</>}
        </div>
        {analysis && <div className="analysisBottom"><span>Structured profile ready</span><button className="textButton" onClick={() => analyze('Re-read the image and preserve the exact composition while improving specificity.')}>Re-analyze →</button></div>}
      </section>

      <section className="conversationPanel">
        <div className="panelHeader"><div><span className="eyebrow">03 / RECREATE</span><h2>Make it yours.</h2></div><div className="modelPicker"><span>Target</span><select value={model} onChange={e => setModel(e.target.value)}>{['General', 'Flux', 'Midjourney', 'Stable Diffusion', 'DALL·E'].map(x => <option key={x}>{x}</option>)}</select></div></div>
        <div className="conversationScroll">
          {messages.length === 0 && !analysis && <div className="conversationEmpty"><span className="quote">“</span><p>Ask for an analysis, a prompt, or a precise change to the visual language.</p></div>}
          {messages.map((m, i) => <div className={`message ${m.role}`} key={i}><span className="messageRole">{m.role === 'user' ? 'YOU' : 'FRAMEFORGE'}</span><p>{m.text}</p></div>)}
          {analysis && <div className="promptWorkspace"><div className="promptHeader"><div><span className="eyebrow">GENERATION PROMPT</span><span className="promptTarget">{model.toUpperCase()} / FIDELITY MODE</span></div><div className="promptActions"><button onClick={() => copy(prompt, 'Prompt')}>Copy</button><button onClick={() => setEditing(!editing)}>{editing ? 'Done' : 'Edit'}</button></div></div>{editing ? <textarea value={prompt} onChange={e => setPrompt(e.target.value)} autoFocus /> : <p className="promptText">{prompt}</p>}<div className="promptFooter"><button onClick={() => copy(negative, 'Negative prompt')}>Copy negative</button><button onClick={() => analyze('Keep the image identical in composition and subject. Make the lighting more cinematic and optimize the resulting prompt for the selected target model.')}>Refine →</button></div></div>}
        </div>
        {analysis && <div className="quickActions">{['Preserve exact composition', 'Make it more cinematic', 'Analyze camera'].map(a => <button key={a} onClick={() => analyze(a)}>{a} <span>↗</span></button>)}</div>}
        <div className="composer"><textarea value={instruction} onChange={e => setInstruction(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); analyze() } }} placeholder="Tell Frameforge what to look for…" /><button className="sendButton" aria-label="Send" onClick={() => analyze()} disabled={loading}><span>{loading ? '…' : '↑'}</span></button></div>
        {notice && <div className="notice">{notice}</div>}
      </section>
    </div>
  </main>
}
