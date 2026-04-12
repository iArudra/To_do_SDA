import React, { useState } from 'react';
import './MockPaymentGateway.css';

const MockPaymentGateway = ({ amount, itemName, onSuccess, onCancel }) => {
    const [step, setStep] = useState('card_details'); // card_details, processing, otp, success
    const [otp, setOtp] = useState('');

    const handleCardSubmit = (e) => {
        e.preventDefault();
        setStep('processing');
        setTimeout(() => {
            setStep('otp');
        }, 1500);
    };

    const handleOtpSubmit = (e) => {
        e.preventDefault();
        if (otp === '123456') {
            setStep('success');
            setTimeout(() => {
                onSuccess();
            }, 1500);
        } else {
            alert("Invalid OTP! Use 123456 for testing.");
        }
    };

    return (
        <div className="gateway-overlay">
            <div className="gateway-modal">
                <div className="gateway-header">
                    <h2>Secure Checkout</h2>
                    <button className="close-btn" onClick={onCancel}>&times;</button>
                </div>
                
                <div className="gateway-body">
                    <div className="order-summary">
                        <span>Paying to: <strong>Todo Master App</strong></span>
                        <span className="amount">₹{amount}</span>
                        <small>For: {itemName}</small>
                    </div>

                    {step === 'card_details' && (
                        <form onSubmit={handleCardSubmit} className="payment-form">
                            <div className="form-group">
                                <label>Card Number</label>
                                <input type="text" placeholder="1111-2222-3333-4444" required maxLength="19" />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Expiry Date</label>
                                    <input type="text" placeholder="MM/YY" required maxLength="5"/>
                                </div>
                                <div className="form-group">
                                    <label>CVV</label>
                                    <input type="password" placeholder="123" required maxLength="3"/>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Cardholder Name</label>
                                <input type="text" placeholder="John Doe" required />
                            </div>
                            <button type="submit" className="pay-btn">Proceed to Pay ₹{amount}</button>
                            <p className="test-note">Note: This is a simulated environment.</p>
                        </form>
                    )}

                    {step === 'processing' && (
                        <div className="processing-state">
                            <div className="spinner"></div>
                            <p>Contacting Bank...</p>
                        </div>
                    )}

                    {step === 'otp' && (
                        <form onSubmit={handleOtpSubmit} className="otp-form">
                            <h3>Bank Authentication</h3>
                            <p>An OTP has been sent to your registered mobile number ending in XXXX.</p>
                            <div className="form-group">
                                <label>One Time Password (OTP)</label>
                                <input 
                                    type="text" 
                                    value={otp} 
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="Enter 123456" 
                                    required 
                                    maxLength="6"
                                    autoFocus
                                />
                            </div>
                            <button type="submit" className="pay-btn">Verify & Pay</button>
                        </form>
                    )}

                    {step === 'success' && (
                        <div className="success-state">
                            <div className="checkmark">✅</div>
                            <h3>Payment Successful!</h3>
                            <p>Redirecting back to application...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MockPaymentGateway;
