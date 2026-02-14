import { useState, useEffect } from 'react'
import './Captcha.css'

function shuffle(arr) {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
            ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

export default function Captcha({ onVerify }) {
    const [grid, setGrid] = useState([])
    const [selected, setSelected] = useState(new Set())
    const [error, setError] = useState('')
    const [shaking, setShaking] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/images')
            .then((r) => r.json())
            .then((data) => {
                const targetCells = (data.targets || []).map((img, i) => ({
                    id: 'T' + i,
                    src: img.url,
                    isTarget: true,
                }))
                const distractorCells = (data.distractors || []).map((img, i) => ({
                    id: 'D' + i,
                    src: img.url,
                    isTarget: false,
                }))
                setGrid(shuffle([...targetCells, ...distractorCells]).slice(0, 9))
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    const toggle = (id) => {
        setSelected((prev) => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
        setError('')
    }

    const verify = () => {
        const picked = grid.filter((c) => selected.has(c.id))
        const wrongPicks = picked.some((c) => !c.isTarget)
        const totalTargets = grid.filter((c) => c.isTarget).length
        const correctPicks = picked.filter((c) => c.isTarget).length

        if (selected.size === 0) {
            setError("You haven't selected anything! 🤔")
            shake()
            return
        }
        if (wrongPicks) {
            setError("Oops! That's not your Valentine! 🥺")
            shake()
            return
        }
        if (correctPicks < totalTargets) {
            setError('You missed some photos of your love! 🧐')
            shake()
            return
        }
        onVerify()
    }

    const shake = () => {
        setShaking(true)
        setTimeout(() => setShaking(false), 600)
    }

    if (loading) {
        return (
            <div className="glass-card fade-in" style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '2rem' }}>🔒</p>
                <p>Loading Security Check…</p>
            </div>
        )
    }

    return (
        <div className={'captcha-card glass-card fade-in' + (shaking ? ' shake' : '')}>
            <div className="captcha-lock">🔒</div>
            <h1>Security Check</h1>
            <p className="captcha-subtitle">
                Select all images of <strong>the most beautiful person in the world</strong> to continue
            </p>

            <div className="captcha-grid">
                {grid.map((cell) => (
                    <button
                        key={cell.id}
                        type="button"
                        className={'captcha-cell' + (selected.has(cell.id) ? ' selected' : '')}
                        onClick={() => toggle(cell.id)}
                    >
                        <img src={cell.src} alt="" draggable={false} />
                        <span className="check-badge">✓</span>
                    </button>
                ))}
            </div>

            {error && <p className="captcha-error">{error}</p>}

            <button type="button" className="verify-btn" onClick={verify}>
                Verify My Love 💕
            </button>
        </div>
    )
}
