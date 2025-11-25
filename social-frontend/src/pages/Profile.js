import React from 'react';
import './Home.css'; // Riutilizza gli stili per ora

function Profile() {
    return (
        <div className="home-layout">
            <div className="main-container">
                <div style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: 'var(--text-primary, white)'
                }}>
                    <h1>Pagina Profilo</h1>
                    <p>Questa pagina sarà implementata in futuro.</p>
                    <p style={{ marginTop: '2rem', opacity: 0.7 }}>
                        Qui visualizzerai il tuo profilo utente, i tuoi post, impostazioni, ecc.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Profile;
