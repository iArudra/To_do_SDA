import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../api';

function MfaSetup({ user }) {
    const [setupState, setSetupState] = useState('initial'); // 'initial', 'scanning', 'verified'
    const [mfaSecret, setMfaSecret] = useState('');
    const [mfaUri, setMfaUri] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleBeginSetup = async () => {
        try {
            setError('');
            const data = await api.setupMfa(user.email);
            setMfaSecret(data.secret);
            setMfaUri(data.uri);
            setSetupState('scanning');
        } catch (err) {
            setError(err.message);
        }
    };

    const handleVerify = async () => {
        try {
            setError('');
            await api.verifyMfa(user.email, mfaSecret, verificationCode);
            setSetupState('verified');
            setSuccessMsg('MFA has been successfully enabled on your account!');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <h3 style={{ color: 'var(--text-color)', marginBottom: '1rem' }}>Two-Factor Authentication (MFA)</h3>
            
            {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
            {successMsg && <div style={{ color: 'var(--primary)', marginBottom: '1rem' }}>{successMsg}</div>}

            {setupState === 'initial' && (
                <div>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                        Enhance your account security by enabling Time-based One-Time Password (TOTP) authentication using an app like Google Authenticator or Authy.
                    </p>
                    <button onClick={handleBeginSetup} className="auth-button" style={{ maxWidth: '200px' }}>
                        Setup MFA
                    </button>
                </div>
            )}

            {setupState === 'scanning' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>Scan this QR code with your Authenticator app.</p>
                    <div style={{ background: 'white', padding: '1rem', borderRadius: '8px' }}>
                        <QRCodeSVG value={mfaUri} size={200} />
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Or enter this code manually: <strong>{mfaSecret}</strong>
                    </p>
                    <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '300px' }}>
                        <input
                            type="text"
                            placeholder="6-digit code"
                            className="auth-input"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            maxLength={6}
                        />
                        <button onClick={handleVerify} className="auth-button">Verify</button>
                    </div>
                </div>
            )}

            {setupState === 'verified' && (
                <div>
                    <p style={{ color: 'var(--text-secondary)' }}>MFA is active on this account.</p>
                </div>
            )}
        </div>
    );
}

export default MfaSetup;
