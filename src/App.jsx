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
    musicUrl: 'https://c9hl1i3altgoapxo.public.blob.vercel-storage.com/Mbosso%20-%20Pawa%20COMPRESSED%20%281%29.mp3',
    musicStartTime: 0,
    targetName: 'the HANDSOME ANGEL',
    senderName: 'Eric',
  })
  const audioRef = useRef(null)

  useEffect(() => {
    // Fetch config for music settings
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        console.log("Fetched config:", data);
        setConfig(prev => ({ ...prev, ...data }));
      })
      .catch(err => console.error("Failed to load config", err))
  }, [])

  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    const handleInteraction = () => {
      console.log("User interacted with page.");
      setHasInteracted(true);
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
    document.addEventListener('click', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);
    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  useEffect(() => {
    // Only run if we actually HAVE a music URL and the ref exists
    if (!config.musicUrl || !audioRef.current) return

    const audio = audioRef.current

    // Set start time if configured
    const startTime = config.musicStartTime || 0

    const attemptPlay = () => {
      const playPromise = audio.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setPlaying(true)
            console.log("Audio playing successfully")
          })
          .catch((err) => console.log('Autoplay prevented/failed:', err))
      }
    }

    const handleLoadedMetadata = () => {
      console.log("Audio metadata loaded.", { duration: audio.duration, startTime })
      if (startTime > 0 && audio.duration && startTime < audio.duration) {
        audio.currentTime = startTime
      }
      attemptPlay()
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)

    // If already loaded or interaction happened, try playing
    if (audio.readyState >= 1) {
      handleLoadedMetadata();
    }

    if (hasInteracted) {
      attemptPlay();
    }

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [config.musicUrl, hasInteracted])

  const toggleMusic = (e) => {
    e.stopPropagation()
    const audio = audioRef.current
    if (playing) {
      audio.pause()
    } else {
      audio.play()
    }
    setPlaying(!playing)
  }

  const handleAudioEnd = () => {
    console.log("Audio ended. Looping...")
    const audio = audioRef.current
    if (audio) {
      audio.currentTime = config.musicStartTime || 0
      audio.play().catch(e => console.error("Loop restart failed:", e))
    }
  }



  return (
    <>
      {/* Background Music - Only render if a URL exists */}
      {musicUrl && (
        <>
          <audio
            ref={audioRef}
            src={musicUrl}
            onEnded={handleAudioEnd}
            volume={0.4}
          />

          <button
            className={`music-toggle ${playing ? 'playing' : ''}`}
            onClick={toggleMusic}
            title={playing ? "Pause Music" : "Play Music"}
          >
            {playing ? '🔊' : '🔈'}
          </button>
        </>
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
