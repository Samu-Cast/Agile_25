import React, { useState } from 'react';
import './AuthModal.css';

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
                        <div className="login-form">
                            {/* Placeholder login form */}
                            <h2>Login</h2>
                            <input type="email" placeholder="Email" />
                            <input type="password" placeholder="Password" />
                            <button className="submit-btn" onClick={onLoginSuccess}>Log In</button>
                        </div>
                    ) : (
                        <div className="register-form">
                            {/* Placeholder register form */}
                            <h2>Register</h2>
                            <input type="text" placeholder="Username" />
                            <input type="email" placeholder="Email" />
                            <input type="password" placeholder="Password" />
                            <button className="submit-btn">Sign Up</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AuthModal;
