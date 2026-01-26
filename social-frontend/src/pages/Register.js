import React, { useState } from 'react';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { createUserProfile, createRoleProfile } from '../services/userService';
// useAuth removed

const Register = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [nickname, setNickname] = useState('');
    const [role, setRole] = useState('Appassionato'); // Default role
    const [bio, setBio] = useState('');

    const [roasteryName, setRoasteryName] = useState('');
    const [city, setCity] = useState('');

    const [error, setError] = useState(null);
    const [info, setInfo] = useState(null);

    // const { updateProfile } = useAuth(); // Removed as it's no longer in AuthContext


    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            // Validate based on role
            if (role === 'Torrefazione') {
                if (!roasteryName || !city) throw new Error("Compila tutti i campi obbligatori");
            } else {
                if (!firstName || !lastName) throw new Error("Compila tutti i campi obbligatori");
            }

            // Crea utente
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Ottieni UID
            const uid = user.uid;

            // Determine display name based on role
            const displayName = role === 'Torrefazione' ? roasteryName : `${firstName} ${lastName}`;

            // Dati profilo
            const profileData = {
                uid: uid,
                name: displayName,
                nickname: nickname, // Assuming nickname is still relevant or optional
                role: role,
                bio: bio,
                email: email,
                location: role === 'Torrefazione' ? city : '', // Store location for user too?
                stats: {
                    posts: 0,
                    followers: 0,
                    following: 0
                },
                profilePic: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`,
                createdAt: new Date()
            };

            // Salva su Firestore tramite API
            await createUserProfile(uid, profileData);

            // Se il ruolo è Torrefazione, crea anche il profilo aziendale
            if (role === 'Torrefazione') {
                const roasteryData = {
                    name: roasteryName,
                    ownerUid: uid,
                    email: email,
                    description: bio || "Nuova Torrefazione",
                    city: city,
                    imageCover: "",
                    stats: {
                        products: 0,
                        followers: 0,
                        rating: 0,
                        reviews: 0
                    }
                };
                // createRoleProfile handles the mapping 'roasteries' -> '/api/roasters'
                try {
                    await createRoleProfile('roasters', roasteryData);
                } catch (e) {
                    console.error("Failed to create roastery profile:", e);
                }
            }

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
                <div className="form-group">
                    <label htmlFor="role">Tipo di Account:</label>
                    <select
                        id="role"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="role-select"
                    >
                        <option value="Appassionato">Appassionato</option>
                        <option value="Barista">Barista (Professionista)</option>
                        <option value="Bar">Bar (Attività Commerciale)</option>
                        <option value="Torrefazione">Torrefazione</option>
                    </select>
                </div>

                {role === 'Torrefazione' ? (
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="roasteryName">Nome Torrefazione:</label>
                            <input
                                id="roasteryName"
                                type="text"
                                value={roasteryName}
                                onChange={(e) => setRoasteryName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="city">Città:</label>
                            <input
                                id="city"
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                ) : (
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="firstName">Nome:</label>
                            <input
                                id="firstName"
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="lastName">Cognome:</label>
                            <input
                                id="lastName"
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                )}

                <div className="form-group">
                    <label htmlFor="nickname">Soprannome (Opzionale):</label>
                    <input
                        id="nickname"
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="Es. TheCoffeeGuy"
                    />
                </div>



                <div className="form-group">
                    <label htmlFor="bio">Bio (Opzionale):</label>
                    <textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Raccontaci qualcosa di te..."
                        rows="3"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password:</label>
                    <input
                        id="password"
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
