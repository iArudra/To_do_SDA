import React, { useState, useEffect } from 'react';
import { api } from '../api';

const themes = [
    {
        id: 'light',
        name: 'Daylight',
        price: 0,
        description: 'Default light and breezy theme.',
        color: '#ff9f43'
    },
    {
        id: 'dark',
        name: 'Midnight',
        price: 0,
        description: 'Smooth dark theme for night owls.',
        color: '#48dbfb'
    },
    {
        id: 'theme-neon',
        name: 'Cyberpunk Neon',
        price: 50, // ₹50
        description: 'High-contrast neon experience with glassmorphism.',
        color: '#00f3ff',
        premium: true
    }
];

const ThemeStore = ({ user, currentTheme, onThemeSelect }) => {
    const [purchasedThemes, setPurchasedThemes] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            fetchPurchases();
        }
    }, [user]);

    const fetchPurchases = async () => {
        try {
            const res = await api.getUserPurchases(user.email);
            setPurchasedThemes(res.themes || []);
        } catch (error) {
            console.error("Failed to fetch purchases:", error);
        }
    };

    const handleBuy = async (theme) => {
        setLoading(true);
        try {
            // 1. Create order on backend
            const orderRes = await api.createOrder({
                email: user.email,
                itemId: theme.id,
                amount: theme.price * 100 // Convert ₹ to paise
            });

            // 2. Open Razorpay Checkout
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || '', // Needs to be in .env
                amount: orderRes.amount,
                currency: orderRes.currency,
                name: "Todo Master",
                description: `Unlock ${theme.name} Theme`,
                order_id: orderRes.id,
                handler: async function (response) {
                    try {
                        // 3. Verify Payment on backend
                        await api.verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });
                        alert("Theme Unlocked Successfully!");
                        await fetchPurchases();
                        onThemeSelect(theme.id);
                    } catch (err) {
                        alert("Payment verification failed.");
                    }
                },
                prefill: {
                    name: user.name,
                    email: user.email,
                },
                theme: {
                    color: theme.color
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response){
                alert("Payment failed.");
            });
            rzp.open();

        } catch (error) {
            console.error(error);
            alert("Error initiating purchase");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="theme-store" style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            {themes.map(theme => {
                const isOwned = !theme.premium || purchasedThemes.includes(theme.id);
                const isActive = currentTheme === theme.id;
                
                return (
                    <div key={theme.id} style={{
                        padding: '1rem',
                        borderRadius: '12px',
                        background: 'var(--card-bg)',
                        border: isActive ? `2px solid ${theme.color}` : '1px solid rgba(255,255,255,0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        textAlign: 'center',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <h3 style={{ color: theme.color }}>{theme.name}</h3>
                        <p style={{ fontSize: '0.8rem', opacity: 0.8, flex: 1 }}>{theme.description}</p>
                        
                        {isOwned ? (
                            <button 
                                onClick={() => onThemeSelect(theme.id)}
                                disabled={isActive}
                                style={{
                                    padding: '0.5rem',
                                    borderRadius: '6px',
                                    background: isActive ? theme.color : 'transparent',
                                    color: isActive ? '#000' : 'var(--text-color)',
                                    border: `1px solid ${theme.color}`,
                                    fontWeight: 'bold'
                                }}
                            >
                                {isActive ? 'Active' : 'Apply'}
                            </button>
                        ) : (
                            <button 
                                onClick={() => handleBuy(theme)}
                                disabled={loading}
                                style={{
                                    padding: '0.5rem',
                                    borderRadius: '6px',
                                    background: '#linear-gradient(to right, #00f3ff, #ff00ff)',
                                    backgroundImage: 'linear-gradient(to right, #00f3ff, #ff00ff)',
                                    color: '#fff',
                                    border: 'none',
                                    fontWeight: 'bold',
                                    cursor: loading ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {loading ? 'Wait...' : `Buy ₹${theme.price}`}
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default ThemeStore;
