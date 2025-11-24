import React, { useState } from 'react';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword } from "firebase/auth";

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [info, setInfo] = useState(null);  // <- aggiunto

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            // Crea utente
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Ottieni UID
            const uid = user.uid;

            // Ottieni token Firebase (serve per /me backend)
            const token = await user.getIdToken();

            // Salviamo info da mostrare nella pagina
            setInfo({
                uid,
                token
            });

            setError(null);

        } catch (err) {
            setError(err.message);
            setInfo(null);
        }
    };

    return (
        <div className="register-container">
            <h2>Register</h2>
            <form onSubmit={handleRegister}>
                <div>
                    <label>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                {error && <p style={{ color: 'red' }}>{error}</p>}

                <button type="submit">Register</button>
            </form>

            {/* QUI MOSTRIAMO UID E TOKEN */}
            {info && (
                <div style={{
                    marginTop: "20px",
                    padding: "10px",
                    background: "#f1f1f1",
                    borderRadius: "5px",
                    wordBreak: "break-all"
                }}>
                    <h3>Registrazione riuscita</h3>
                    <p><strong>UID:</strong> {info.uid}</p>
                    <p><strong>Token Firebase:</strong></p>
                    <pre>{info.token}</pre>
                </div>
            )}
        </div>
    );
};

export default Register;
