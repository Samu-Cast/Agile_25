import React, { useState } from 'react';
import './AuthModal.css';
import Login from '../pages/Login';
import Register from '../pages/Register';

function AuthModal({ mode: initialMode = 'login', onClose, onLoginSuccess }) {
    const [mode, setMode] = useState(initialMode);

    const switchToLogin = () => setMode('login');
    const switchToRegister = () => setMode('register');

    return (
        <div className="auth-modal-overlay" onClick={onClose}>
            <div className="auth-modal" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose} aria-label="Close">
                    &times;
                </button>
                <div className="tab-header">
                    <button
                        className={`tab-btn ${mode === 'login' ? 'active' : ''}`}
                        onClick={switchToLogin}
                    >
                        Login
                    </button>
                    <button
                        className={`tab-btn ${mode === 'register' ? 'active' : ''}`}
                        onClick={switchToRegister}
                    >
                        Register
                    </button>
                </div>
                <div className="tab-content">
                    {mode === 'login' ? (
                        <Login onLoginSuccess={onLoginSuccess} onClose={onClose} />
                    ) : (
                        <Register onLoginSuccess={onLoginSuccess} />
                    )}
                </div>
            </div>
        </div>
    );
}

export default AuthModal;
