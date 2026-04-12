import React, { useState, useEffect } from 'react';
import { api } from '../api';
import MockPaymentGateway from './MockPaymentGateway';

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
    const [showGateway, setShowGateway] = useState(false);
    const [selectedTheme, setSelectedTheme] = useState(null);

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

    const handleBuy = (theme) => {
        setSelectedTheme(theme);
        setShowGateway(true);
    };

    const handlePaymentSuccess = async () => {
        setShowGateway(false);
        setLoading(true);
        try {
            await api.mockPurchase({
                email: user.email,
                itemId: selectedTheme.id,
                amount: selectedTheme.price * 100
            });
            
            alert("Theme Unlocked Successfully!");
            await fetchPurchases();
            onThemeSelect(selectedTheme.id);
        } catch (error) {
            console.error(error);
            alert("Error logging purchase locally.");
        } finally {
            setLoading(false);
            setSelectedTheme(null);
        }
    };

    const handlePaymentCancel = () => {
        setShowGateway(false);
        setSelectedTheme(null);
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

            {showGateway && selectedTheme && (
                <MockPaymentGateway
                    amount={selectedTheme.price}
                    itemName={selectedTheme.name}
                    onSuccess={handlePaymentSuccess}
                    onCancel={handlePaymentCancel}
                />
            )}
        </div>
    );
};

export default ThemeStore;
