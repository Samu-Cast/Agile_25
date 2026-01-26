import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from 'react-router-dom';

const Login = ({ onLoginSuccess, onClose }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [info, setInfo] = useState(null);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const uid = user.uid;
            const token = await user.getIdToken();

            setInfo({
                uid,
                token
            });

            setError(null);
            if (onLoginSuccess) {
                onLoginSuccess();
            }
        } catch (err) {
            setError(err.message);
            setInfo(null);
        }
    };

    const handleForgotPassword = () => {
        if (onClose) onClose();
        navigate('/forgot-password');
    };

    return (
        <div className="login-container">
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
                <div>
                    <label htmlFor="email">Email:</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="password">Password:</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                {error && <div className="error-msg">{error}</div>}

                <button type="submit" className="submit-btn">Login</button>
            </form>

            {info && (
                <div className="success-msg">
                    <h3>Login riuscito</h3>
                    <p><strong>UID:</strong> {info.uid}</p>
                    <p><strong>Token Firebase:</strong></p>
                    <pre>{info.token}</pre>
                </div>
            )}

            <div style={{ marginTop: "15px", textAlign: "center" }}>
                <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="forgot-password-link"
                >
                    Password dimenticata?
                </button>
            </div>
        </div>
    );
};

export default Login;
