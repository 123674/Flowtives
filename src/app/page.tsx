'use client'

import { useState } from 'react'
import { ArrowRight, ArrowUpRight, CalendarDays, Check, Clock3, CloudUpload, FileText, Menu, MessageCircle, Sparkles, X } from 'lucide-react'
import Link from 'next/link'

const plans = [
  { time: '05:00 PM', title: 'Badminton', detail: 'Move your body · 60 min', color: 'mint', icon: '🏸' },
  { time: '06:15 PM', title: 'Review lecture notes', detail: 'Biology · 35 min', color: 'lavender', icon: '📚' },
  { time: '07:00 PM', title: 'Dinner + reset', detail: 'Take a proper break · 45 min', color: 'peach', icon: '🍜' },
]

export default function Home() {
  const [showUpload, setShowUpload] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [fileName, setFileName] = useState('')
  const [toast, setToast] = useState(false)

  const startPlanning = () => {
    setShowUpload(true)
    document.getElementById('planner')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <main className="hero-shell min-h-screen overflow-hidden text-white">
      <div className="sky-image" aria-hidden="true" />
      <div className="sky-wash" aria-hidden="true" />
      <header className="nav-wrap">
        <Link className="wordmark" href="#top" aria-label="Flowtives home">Flowtives</Link>
        <nav className={`${menuOpen ? 'nav-links nav-links-open' : 'nav-links'}`}>
          <Link href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</Link>
          <Link href="#your-day" onClick={() => setMenuOpen(false)}>Your day</Link>
          <Link href="#features" onClick={() => setMenuOpen(false)}>Features</Link>
        </nav>
        <div className="nav-actions"><Link className="nav-login" href="/signin">Sign in</Link><button className="nav-cta" onClick={startPlanning}>Try Flowtives <ArrowUpRight size={15}/></button></div>
        <button className="mobile-menu" aria-label="Toggle menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={22}/> : <Menu size={22}/>}</button>
      </header>

      <section id="top" className="hero-content">
        <div className="eyebrow"><span className="eyebrow-spark"><Sparkles size={13}/></span> YOUR TIME, IN FLOW</div>
        <h1>Find yourself,<br/><span>In time.</span></h1>
        <p className="hero-subtitle">Your AI calendar for college, life, and everything in between.</p>
        <div className="hero-buttons"><button className="primary-button" onClick={startPlanning}>Plan my day <span className="button-arrow"><ArrowRight size={19}/></span></button><Link href="#how-it-works" className="text-button">See how it works <ArrowUpRight size={15}/></Link></div>
        <div className="hero-proof"><div className="avatar-stack"><span>J</span><span>A</span><span>M</span></div><span>Made for busy minds, not busywork.</span></div>
      </section>

      <div className="floating-pill pill-top"><span className="live-dot"/> Your week, getting smarter</div>

      <section className="floating-ui" aria-label="Preview of the Flowtives AI calendar">
        <div className="glass-card upload-card" id="planner">
          <div className="card-heading"><div className="mini-icon blue-icon"><Sparkles size={16}/></div><span>Flowtives AI</span><span className="online-label">ONLINE</span></div>
          <div className="chat-bubble ai-bubble">Hey! Let’s make a plan that actually fits your life. <strong>Upload your timetable</strong> and I’ll take it from here.</div>
          <div className="chat-bubble user-bubble">Can you sort out my week?</div>
          <button className={`upload-drop ${showUpload ? 'upload-drop-active' : ''}`} onClick={() => setShowUpload(!showUpload)}>
            <span className="upload-icon"><CloudUpload size={20}/></span><span className="upload-copy"><strong>{fileName || 'Upload your timetable'}</strong><small>{fileName ? 'Ready to plan your week' : 'PDF, image or spreadsheet'}</small></span><ArrowUpRight size={17}/>
          </button>
          {showUpload && <div className="upload-expanded"><label className="file-label"><input type="file" accept=".pdf,.png,.jpg,.jpeg,.csv,.xlsx,.doc,.docx" onChange={(e) => setFileName(e.target.files?.[0]?.name || '')}/><span>{fileName ? 'Choose a different file' : 'Choose a file'}</span></label><button onClick={() => { setToast(true); setShowUpload(false); window.setTimeout(() => setToast(false), 2800) }}>Build my schedule <ArrowRight size={14}/></button></div>}
          <div className="card-foot"><span><Check size={12}/> Keeps your priorities in mind</span><span><Clock3 size={12}/> Takes a minute</span></div>
        </div>

        <div className="glass-card schedule-card" id="your-day">
          <div className="schedule-top"><div><div className="schedule-kicker">YOUR PERSONAL PLAN</div><h3>Today, in flow <span className="sun">✳</span></h3></div><div className="date-chip">THU <strong>15</strong></div></div>
          <div className="day-progress"><span>YOUR DAY</span><div><i/></div><strong>68%</strong></div>
          <div className="schedule-list">{plans.map((plan) => <div className="schedule-item" key={plan.title}><span className="time-label">{plan.time}</span><div className={`event-icon ${plan.color}`}>{plan.icon}</div><div className="event-text"><strong>{plan.title}</strong><small>{plan.detail}</small></div><Check className="event-check" size={15}/></div>)}</div>
          <div className="schedule-ai-note"><span className="note-spark"><Sparkles size={14}/></span><span><strong>Made for your energy.</strong><small>We left room to breathe between tasks.</small></span></div>
          <div className="schedule-bottom"><span><CalendarDays size={14}/> 3 of 5 plans shown</span><button onClick={() => { setToast(true); window.setTimeout(() => setToast(false), 2800) }}>View full day <ArrowRight size={14}/></button></div>
        </div>

        
        
      </section>

      <div className="bottom-fade" aria-hidden="true"/>
      <section className="below-fold" id="how-it-works"><div className="section-label">LESS PLANNING. MORE LIVING.</div><h2>Your schedule should work for you.</h2><p>Drop in your timetable, tell Flowtives what matters, and let AI shape a realistic day around it.</p><div className="feature-row" id="features"><article><div className="feature-icon"><FileText size={19}/></div><h3>Give it the details</h3><p>Upload your class timetable and add the things you want to make time for.</p></article><article><div className="feature-icon"><Sparkles size={19}/></div><h3>Let AI connect the dots</h3><p>Flowtives builds a balanced plan with study blocks, breaks, and your life outside class.</p></article><article><div className="feature-icon"><MessageCircle size={19}/></div><h3>Change plans, easily</h3><p>Tell your AI what changed. Your calendar reshuffles without the stress.</p></article></div></section>
      <footer><a className="wordmark" href="#top">Flowtives<span className="wordmark-dot">.</span></a><span>Make time for what matters.</span><span>© 2026 Flowtives</span></footer>
      {toast && <div className="toast"><span className="toast-icon"><Check size={15}/></span><span><strong>You’re on your way.</strong><small>Schedule preview is ready to explore.</small></span><button aria-label="Dismiss" onClick={() => setToast(false)}><X size={15}/></button></div>}
    </main>
  )
}
