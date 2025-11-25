import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useAuth } from '../context/AuthContext';

const Register = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [role, setRole] = useState('Appassionato'); // Default role
    const [bio, setBio] = useState('');

    const [error, setError] = useState(null);
    const [info, setInfo] = useState(null);

    // const { updateProfile } = useAuth(); // Removed as it's no longer in AuthContext


    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            // Crea utente
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Ottieni UID
            const uid = user.uid;

            // Dati profilo
            const profileData = {
                uid: uid,
                name: `${firstName} ${lastName}`,
                role: role,
                bio: bio,
                email: email,
                stats: {
                    posts: 0,
                    followers: 0,
                    following: 0
                },
                profilePic: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random`,
                createdAt: new Date()
            };

            // Salva su Firestore
            await setDoc(doc(db, "users", uid), profileData);

            // Aggiorna stato locale - Non serve più con il nuovo AuthContext che ascolta le modifiche
            // updateProfile(profileData); 


            // Ottieni token Firebase (serve per /me backend)
            const token = await user.getIdToken();

            // Salviamo info da mostrare nella pagina
            setInfo({
                uid,
                token
            });

            setError(null);

            // Notifica il successo al genitore (AuthModal)
            if (onLoginSuccess) {
                onLoginSuccess();
            }

        } catch (err) {
            setError(err.message);
            setInfo(null);
        }
    };

    return (
        <div className="register-container">
            <h2>Crea Account</h2>
            <form onSubmit={handleRegister}>
                <div className="form-row">
                    <div className="form-group">
                        <label>Nome:</label>
                        <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Cognome:</label>
                        <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>Tag:</label>
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="role-select"
                    >
                        <option value="Bar">Bar</option>
                        <option value="Barista">Barista</option>
                        <option value="Appassionato">Appassionato</option>
                        <option value="Torrefazione">Torrefazione</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Bio (Opzionale):</label>
                    <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Raccontaci qualcosa di te..."
                        rows="3"
                    />
                </div>

                <div className="form-group">
                    <label>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                {error && <p style={{ color: 'red' }}>{error}</p>}

                <button type="submit" className="submit-btn">Registrati</button>
            </form>

            {/* QUI MOSTRIAMO UID E TOKEN */}
            {info && (
                <div className="success-msg">
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
