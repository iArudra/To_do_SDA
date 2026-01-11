import { useState, useEffect } from 'react'

function WebhookSettings() {
    const [isOpen, setIsOpen] = useState(false)
    const [url, setUrl] = useState(() => localStorage.getItem('webhookUrl') || '')

    const handleSave = () => {
        localStorage.setItem('webhookUrl', url)
        setIsOpen(false)
    }

    return (
        <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: 'transparent',
                    color: 'var(--text-color)',
                    fontSize: '0.9rem',
                    opacity: 0.7,
                    textDecoration: 'underline'
                }}
            >
                {isOpen ? 'Close Settings' : 'Configure Webhook'}
            </button>

            {isOpen && (
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.8rem' }}>n8n Webhook URL:</label>
                    <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://primary.n8n.cloud/webhook/..."
                        style={{
                            padding: '0.5rem',
                            borderRadius: '8px',
                            background: 'rgba(255,255,255,0.1)',
                            color: 'var(--text-color)',
                            border: '1px solid rgba(255,255,255,0.2)'
                        }}
                    />
                    <button
                        onClick={handleSave}
                        style={{
                            padding: '0.5rem',
                            background: 'var(--accent)',
                            color: '#333',
                            borderRadius: '8px',
                            fontWeight: 'bold'
                        }}
                    >
                        Save
                    </button>
                </div>
            )}
        </div>
    )
}

export default WebhookSettings
