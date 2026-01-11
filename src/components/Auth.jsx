import { useState } from 'react'
import { api } from '../api'
import '../App.css' // Re-use main styles or add specific ones

function Auth({ onLogin }) {
    const [isLogin, setIsLogin] = useState(true)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: ''
    })
    const [error, setError] = useState('')

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        try {
            if (isLogin) {
                const res = await api.login({
                    email: formData.email,
                    password: formData.password
                })
                onLogin(res.user)
            } else {
                await api.signup(formData)
                // Auto login or ask to login? Let's switch to login view for clarity
                setIsLogin(true)
                setError('Account created! Please log in.')
            }
        } catch (err) {
            setError(err.message)
        }
    }

    return (
        <div className="auth-card" style={{ textAlign: 'center', maxWidth: '400px', width: '100%' }}>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>
                {isLogin ? 'Welcome Back' : 'Join Us'}
            </h2>

            {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {!isLogin && (
                    <>
                        <input
                            type="text"
                            name="name"
                            placeholder="Full Name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="auth-input"
                        />
                        <input
                            type="tel"
                            name="phone"
                            placeholder="Phone Number"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                            className="auth-input"
                        />
                    </>
                )}

                <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="auth-input"
                />

                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="auth-input"
                />

                <button type="submit" className="auth-button">
                    {isLogin ? 'Login' : 'Sign Up'}
                </button>
            </form>

            <p style={{ marginTop: '1rem', color: 'var(--text-color)' }}>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                    onClick={() => { setIsLogin(!isLogin); setError('') }}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}
                >
                    {isLogin ? 'Sign Up' : 'Login'}
                </button>
            </p>
        </div>
    )
}

export default Auth
