import { useState, useEffect, useRef } from 'react'
import './Admin.css'

export default function Admin() {
    const [password, setPassword] = useState('')
    const [authed, setAuthed] = useState(false)
    const [authError, setAuthError] = useState('')
    const [images, setImages] = useState({ targets: [], distractors: [] })
    const [uploading, setUploading] = useState(false)
    const [config, setConfig] = useState({
        title: 'You Got It!',
        heroText: 'You successfully identified the love of my life! ❤️',
        bodyText: "Just like you found yourself in those photos, I found my happiness in you. Happy Valentine's Day! 🌹",
        letterText: 'You mean everything to me.',
        signature: '— Forever yours 💌',
        musicUrl: '',
        targetName: 'the HANDSOME ANGEL',
        senderName: 'Eric',
        lastSaved: null,
    })
    const [configSaved, setConfigSaved] = useState(false)
    const fileInputRef = useRef()

    const [uploadRole, setUploadRole] = useState('target')

    const headers = { 'x-admin-password': password }

    const login = async () => {
        setAuthError('')
        try {
            // Test password against a protected endpoint
            const res = await fetch('/api/config', {
                method: 'POST',
                headers: {
                    'x-admin-password': password,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ _ping: true }),
            })
            if (res.status === 401) {
                setAuthError('Wrong password! 🔒')
            } else {
                setAuthed(true)
                fetchImages()
                fetchConfig()
            }
        } catch {
            setAuthError('Could not connect to server')
        }
    }

    const fetchImages = async () => {
        try {
            const res = await fetch('/api/images')
            if (res.ok) {
                const data = await res.json()
                setImages(data)
            }
        } catch { /* ignore */ }
    }

    const fetchConfig = async () => {
        try {
            const res = await fetch('/api/config')
            if (res.ok) {
                const data = await res.json()
                // Merge with defaults to ensure new fields exist
                setConfig(prev => ({ ...prev, ...data }))
            }
        } catch { /* ignore */ }
    }

    // ── Optimization: Resize images before upload ──
    const resizeImage = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = (e) => {
                const img = new Image()
                img.src = e.target.result
                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    const ctx = canvas.getContext('2d')
                    const MAX_WIDTH = 800 // Resize to 800px width (good balance)
                    const scale = MAX_WIDTH / img.width

                    if (scale < 1) {
                        canvas.width = MAX_WIDTH
                        canvas.height = img.height * scale
                    } else {
                        canvas.width = img.width
                        canvas.height = img.height
                    }

                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

                    canvas.toBlob((blob) => {
                        resolve(new File([blob], file.name, { type: 'image/jpeg' }))
                    }, 'image/jpeg', 0.8) // 80% quality JPEG
                }
            }
        })
    }

    const uploadFiles = async (files) => {
        setUploading(true)
        for (const file of files) {
            try {
                // Resize for performance!
                const optimizedFile = await resizeImage(file)

                const formData = new FormData()
                formData.append('file', optimizedFile)

                await fetch('/api/upload', {
                    method: 'POST',
                    headers: {
                        'x-admin-password': password,
                        'x-upload-role': uploadRole,
                    },
                    body: formData,
                })
            } catch (err) {
                console.error('Upload failed:', err)
                alert(`Failed to upload ${file.name}`)
            }
        }
        setUploading(false)
        fetchImages()
    }

    const deleteImage = async (url) => {
        try {
            await fetch('/api/delete', {
                method: 'POST',
                headers: {
                    ...headers,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url }),
            })
            fetchImages()
        } catch (err) {
            console.error('Delete failed:', err)
        }
    }

    const saveConfig = async () => {
        try {
            await fetch('/api/config', {
                method: 'POST',
                headers: {
                    ...headers,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ...config, lastSaved: new Date().toISOString() }),
            })
            setConfigSaved(true)
            setTimeout(() => setConfigSaved(false), 2000)
        } catch (err) {
            console.error('Config save failed:', err)
        }
    }

    // ─── Login Screen ──────────────────────────────
    if (!authed) {
        return (
            <div className="admin-card glass-card fade-in">
                <div className="admin-icon">🔐</div>
                <h1>Admin Login</h1>
                <p className="admin-subtitle">Enter your password to manage photos</p>
                <input
                    type="password"
                    className="admin-input"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && login()}
                />
                {authError && <p className="admin-error">{authError}</p>}
                <button className="admin-btn" onClick={login}>
                    Login 🔑
                </button>
            </div>
        )
    }

    // ─── Admin Dashboard ────────────────────────────
    const totalTargets = images.targets.length
    const totalDistractors = images.distractors.length

    return (
        <div className="admin-card glass-card fade-in">
            <div className="admin-icon">🛠️</div>
            <h1>Admin Panel</h1>

            {/* Stats */}
            <div className="stats-row">
                <div className="stat">
                    <span className="stat-num">{totalTargets}</span>
                    <span className="stat-label">Targets ♥</span>
                </div>
                <div className="stat">
                    <span className="stat-num">{totalDistractors}</span>
                    <span className="stat-label">Distractors 🌸</span>
                </div>
            </div>



            {/* Upload Section */}
            <div className="upload-section">
                <h2>Upload Photos</h2>
                <div className="role-toggle">
                    <button
                        className={'role-btn' + (uploadRole === 'target' ? ' active target-active' : '')}
                        onClick={() => setUploadRole('target')}
                    >
                        ♥ Target (Correct)
                    </button>
                    <button
                        className={'role-btn' + (uploadRole === 'distractor' ? ' active distractor-active' : '')}
                        onClick={() => setUploadRole('distractor')}
                    >
                        🌸 Distractor (Wrong)
                    </button>
                </div>

                <div
                    className="upload-zone"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault()
                        uploadFiles(e.dataTransfer.files)
                    }}
                    onClick={() => fileInputRef.current.click()}
                >
                    {uploading ? (
                        <span className="upload-spinner">⏳ Uploading…</span>
                    ) : (
                        <span>📸 Drop photos here or tap to select</span>
                    )}
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={(e) => {
                        uploadFiles(e.target.files)
                        e.target.value = ''
                    }}
                />
            </div>

            {/* Gallery */}
            {totalTargets > 0 && (
                <div className="gallery-section">
                    <h2>♥ Targets (Correct Answers)</h2>
                    <div className="gallery-grid">
                        {images.targets.map((img) => (
                            <div key={img.url} className="gallery-item target-border">
                                <img src={img.url} alt="" />
                                <button className="delete-btn" onClick={() => deleteImage(img.url)}>✕</button>
                                <span className="role-badge target-badge">♥</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {totalDistractors > 0 && (
                <div className="gallery-section">
                    <h2>🌸 Distractors</h2>
                    <div className="gallery-grid">
                        {images.distractors.map((img) => (
                            <div key={img.url} className="gallery-item distractor-border">
                                <img src={img.url} alt="" />
                                <button className="delete-btn" onClick={() => deleteImage(img.url)}>✕</button>
                                <span className="role-badge distractor-badge">🌸</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Music Section */}
            <div className="config-section">
                <h2>🎵 Background Music</h2>
                <div style={{ marginBottom: '15px' }}>
                    <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '10px' }}>
                        Paste your Vercel Blob or any external audio link below.
                    </p>
                    <label className="config-label">Audio URL</label>
                    <input
                        className="admin-input"
                        placeholder="https://.../your-track.mp3"
                        value={config.musicUrl}
                        onChange={(e) => setConfig({ ...config, musicUrl: e.target.value })}
                    />
                </div>
            </div>

            {/* Customization Section */}
            <div className="config-section">
                <h2>👤 Personalization</h2>
                <label className="config-label">Your Name (Sender)</label>
                <input
                    className="admin-input"
                    value={config.senderName}
                    onChange={(e) => setConfig({ ...config, senderName: e.target.value })}
                    placeholder="e.g. Eric"
                />
                <label className="config-label">Target Name (Phrase in Captcha)</label>
                <input
                    className="admin-input"
                    value={config.targetName}
                    onChange={(e) => setConfig({ ...config, targetName: e.target.value })}
                    placeholder="e.g. the HANDSOME ANGEL"
                />
            </div>

            {/* Success Message Editor */}
            <div className="config-section">
                <h2>✏️ Success Message</h2>
                <label className="config-label">Title</label>
                <input
                    className="admin-input"
                    value={config.title}
                    onChange={(e) => setConfig({ ...config, title: e.target.value })}
                />
                <label className="config-label">Hero Line</label>
                <input
                    className="admin-input"
                    value={config.heroText}
                    onChange={(e) => setConfig({ ...config, heroText: e.target.value })}
                />
                <label className="config-label">Body</label>
                <textarea
                    className="admin-textarea"
                    value={config.bodyText}
                    onChange={(e) => setConfig({ ...config, bodyText: e.target.value })}
                />
                <label className="config-label">Love Letter</label>
                <textarea
                    className="admin-textarea"
                    value={config.letterText}
                    onChange={(e) => setConfig({ ...config, letterText: e.target.value })}
                />
                <label className="config-label">Signature</label>
                <input
                    className="admin-input"
                    value={config.signature}
                    onChange={(e) => setConfig({ ...config, signature: e.target.value })}
                />
                <button className="admin-btn" onClick={saveConfig}>
                    {configSaved ? '✅ Saved!' : 'Save Config 💾'}
                </button>
            </div>

            {/* Preview link */}
            <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(255,255,255,0.1)', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <a href="/" target="_blank" rel="noopener noreferrer" className="preview-link" style={{ fontSize: '1.1rem', fontWeight: 'bold', textDecoration: 'none', color: 'var(--primary)', display: 'block' }}>
                        👀 Open Public Captcha →
                    </a>
                    {config.lastSaved && (
                        <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                            Synced: {new Date(config.lastSaved).toLocaleTimeString()}
                        </span>
                    )}
                </div>
                <p style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '10px', color: '#666' }}>
                    <strong>Note:</strong> Browsers are very strict with music. Changes will reflect as soon as you refresh the public page.
                </p>
            </div>
        </div>
    )
}
