import { useState, useEffect, useRef } from 'react'
import Admin from './components/Admin'
import Captcha from './components/Captcha'
import Success from './components/Success'
import './index.css'

function App() {
  const isAdmin = window.location.search.includes('admin')
  const [step, setStep] = useState('loading')
  const [hearts, setHearts] = useState([])

  useEffect(() => {
    setHearts(
      Array.from({ length: 15 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 6 + Math.random() * 4,
        size: 10 + Math.random() * 20,
      }))
    )

    if (!isAdmin) {
      // Check if images are available
      fetch('/api/images')
        .then((r) => r.json())
        .then((data) => {
          if (data.targets?.length > 0 && data.distractors?.length > 0) {
            setStep('captcha')
          } else {
            setStep('coming-soon')
          }
        })
        .catch(() => setStep('coming-soon'))
    }
  }, [isAdmin])

  // ── Music Player ──────────────────────────────
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    // Try to autoplay on load (might be blocked)
    const playPromise = audio.play()
    if (playPromise !== undefined) {
      playPromise
        .then(() => setPlaying(true))
        .catch(() => {
          // Auto-play was prevented.
          // We can show a UI element to let the user manually start playback.
          console.log('Autoplay prevented')
        })
    }

    // Also play on first click anywhere
    const startAudio = () => {
      if (audio.paused) {
        audio.play()
          .then(() => setPlaying(true))
          .catch(e => console.error("Audio play failed", e))
      }
      document.removeEventListener('click', startAudio)
    }
    document.addEventListener('click', startAudio)

    return () => document.removeEventListener('click', startAudio)
  }, [])

  const toggleMusic = (e) => {
    e.stopPropagation() // Don't trigger the document listener
    const audio = audioRef.current
    if (playing) {
      audio.pause()
    } else {
      audio.play()
    }
    setPlaying(!playing)
  }

  return (
    <>
      {/* Background Music */}
      <audio
        ref={audioRef}
        src="https://cdn.pixabay.com/audio/2022/03/24/audio_0172ccc053.mp3"
        loop
        volume={0.4}
      />

      <button
        className="music-toggle"
        onClick={toggleMusic}
        title={playing ? "Pause Music" : "Play Music"}
      >
        {playing ? '🔊' : '🔈'}
      </button>

      <div className="bg-hearts">
        {hearts.map((h) => (
          <div
            key={h.id}
            className="heart"
            style={{
              left: `${h.left}%`,
              animationDelay: `${h.delay}s`,
              animationDuration: `${h.duration}s`,
              fontSize: `${h.size}px`,
            }}
          >
            ❤
          </div>
        ))}
      </div>

      <main>
        {isAdmin ? (
          <Admin />
        ) : (
          <>
            {step === 'loading' && (
              <div className="glass-card fade-in" style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '2rem' }}>💕</p>
                <p>Eric has something special for you...</p>
              </div>
            )}
            {step === 'coming-soon' && (
              <div className="glass-card fade-in" style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '3rem' }}>💌</p>
                <h1>Something Special</h1>
                <p>is being prepared for you…</p>
                <p style={{ fontSize: '0.85rem', opacity: 0.5, marginTop: '2rem' }}>
                  Check back soon!
                </p>
              </div>
            )}
            {step === 'captcha' && (
              <Captcha onVerify={() => setStep('success')} />
            )}
            {step === 'success' && <Success />}
          </>
        )}
      </main>
    </>
  )
}

export default App
