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
  const [config, setConfig] = useState({
    title: 'You Got It!',
    heroText: 'You successfully identified the love of my life! ❤️',
    bodyText: "Just like you found yourself in those photos, I found my happiness in you. Happy Valentine's Day! 🌹",
    letterText: 'You mean everything to me.',
    signature: '— Forever yours 💌',
    musicUrl: '',
    targetName: 'the HANDSOME ANGEL',
    senderName: 'Eric',
  })
  const audioRef = useRef(null)
  const [hasInteracted, setHasInteracted] = useState(false)

  useEffect(() => {
    // Fetch config with cache-busting timestamp
    fetch(`/api/config?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        console.log("Fetched config (cache-busted):", data);
        setConfig(prev => ({ ...prev, ...data }));
      })
      .catch(err => console.error("Failed to load config", err))
  }, [])

  useEffect(() => {
    const handleInteraction = () => {
      if (hasInteracted) return;
      console.log("User interacted. Attempting to play audio...");
      setHasInteracted(true);

      if (audioRef.current && config.musicUrl) {
        audioRef.current.play()
          .then(() => {
            setPlaying(true);
            console.log("Music started successfully");
          })
          .catch(err => console.log("Autoplay blocked/failed:", err));
      }

      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };

    document.addEventListener('click', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
  }, [config.musicUrl, hasInteracted]);

  const toggleMusic = (e) => {
    e.stopPropagation()
    const audio = audioRef.current
    if (!audio) return

    if (playing) {
      audio.pause()
      setPlaying(false)
    } else if (config.musicUrl) {
      audio.play().then(() => setPlaying(true)).catch(e => console.error("Play failed:", e))
    }
  }

  const handleAudioEnd = () => {
    console.log("Looping track...")
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(e => console.error("Loop failed:", e))
    }
  }

  return (
    <>
      {/* Background Music - Singleton audio tag */}
      <audio
        ref={audioRef}
        src={config.musicUrl}
        onEnded={handleAudioEnd}
        preload="auto"
      />

      {config.musicUrl && (
        <button
          className={`music-toggle ${playing ? 'playing' : ''}`}
          onClick={toggleMusic}
          title={playing ? "Pause Music" : "Play Music"}
        >
          {playing ? '🔊' : '🔈'}
        </button>
      )}

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
                <p>{config.senderName} has something special for you...</p>
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
              <Captcha onVerify={() => setStep('success')} config={config} />
            )}
            {step === 'success' && <Success config={config} />}
          </>
        )}
      </main>
    </>
  )
}

export default App
