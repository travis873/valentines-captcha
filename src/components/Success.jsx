import { useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import './Success.css'

export default function Success() {
    const fired = useRef(false)
    const [config, setConfig] = useState({
        title: 'You Got It!',
        heroText: 'You successfully identified the love of my life! ❤️',
        bodyText: "Just like you found yourself in those photos, I found my happiness in you. Happy Valentine's Day! 🌹",
        letterText: 'You mean everything to me.',
        signature: '— Forever yours 💌',
    })

    useEffect(() => {
        // Fetch custom message
        fetch('/api/config')
            .then((r) => r.json())
            .then((data) => {
                if (data.title) setConfig(data)
            })
            .catch(() => { })

        // Confetti
        if (fired.current) return
        fired.current = true
        const end = Date.now() + 3500
        const colors = ['#ff4d6d', '#ff8fa3', '#fff0f3', '#ffffff']
            ; (function burst() {
                confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0 }, colors })
                confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1 }, colors })
                if (Date.now() < end) requestAnimationFrame(burst)
            })()
    }, [])

    return (
        <div className="success-card glass-card fade-in">
            <div className="success-emoji">🎉</div>
            <h1>{config.title}</h1>
            <p className="success-hero">{config.heroText}</p>
            <p className="success-body">{config.bodyText}</p>
            <div className="love-letter">
                <p>{config.letterText}</p>
                <p className="signature">{config.signature}</p>
            </div>
        </div>
    )
}
