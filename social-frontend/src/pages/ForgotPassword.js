import React, { useState } from 'react';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from "firebase/auth";
import { Link } from 'react-router-dom';
import '../styles/pages/ForgotPassword.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!email) {
            setError("Inserisci la tua email per resettare la password");
            return;
        }
        try {
            await sendPasswordResetEmail(auth, email);
            setMessage("Email di reset inviata! Controlla la tua casella di posta.");
            setError(null);
        } catch (err) {
            setError("Errore durante l'invio dell'email: " + err.message);
            setMessage(null);
        }
    };

    return (
        <div className="forgot-password-container">
            <div className="forgot-password-card">
                <div className="forgot-password-icon">
                    ☕
                </div>
                <h2>Password Dimenticata?</h2>
                <p>Nessun problema. Inserisci la tua email e ti invieremo un link per resettarla.</p>

                <form onSubmit={handleResetPassword}>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="esempio@email.com"
                            required
                        />
                    </div>

                    {error && <div className="error-msg">{error}</div>}
                    {message && <div className="success-msg">{message}</div>}

                    <button type="submit" className="reset-btn">Invia Link</button>
                </form>

                <Link to="/" className="back-link">← Torna al Login</Link>
            </div>
        </div>
    );
};

export default ForgotPassword;
