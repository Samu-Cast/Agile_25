import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createReport } from '../services/reportService';
import { useNavigate } from 'react-router-dom';

const ReportProblem = () => {
    const [description, setDescription] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const handleReport = async (e) => {
        e.preventDefault();
        if (!currentUser) {
            setError('Devi essere loggato per segnalare un problema');
            return;
        }
        try {
            setError(null);

            await createReport({
                uid: currentUser.uid,
                description: description,
            });
            setSuccess(true);
            setTimeout(() => navigate('/'), 2000); //dopo due secondi torna alla home
        } catch (err) {
            console.error(err);
            setError("Impossibile segnalare il problema");
        }
    };

    return (
        <div className="home-layout">
            <div className="main-container">
                <div style={{
                    gridColumn: '2',
                    backgroundColor: 'var(--white)',
                    borderRadius: 'var(--border-radius)',
                    padding: '2rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    height: 'fit-content'
                }}>
                    <h2 style={{
                        marginTop: 0,
                        marginBottom: '1.5rem',
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <span style={{ fontSize: '24px' }}></span>
                        Area segnalazioni
                    </h2>

                    <div style={{
                        padding: '16px',
                        backgroundColor: 'rgba(255, 165, 0, 0.1)',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        color: 'var(--text-secondary)',
                        fontSize: '14px'
                    }}>
                        Riscontri un bug o un malfunzionamento? Descrivilo qui sotto per aiutarci a migliorare la piattaforma.
                    </div>

                    {error && (
                        <div style={{
                            padding: '12px',
                            backgroundColor: '#ffebee',
                            color: '#c62828',
                            borderRadius: '8px',
                            marginBottom: '16px',
                            fontSize: '14px'
                        }}>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div style={{
                            padding: '12px',
                            backgroundColor: '#e8f5e9',
                            color: '#2e7d32',
                            borderRadius: '8px',
                            marginBottom: '16px',
                            fontSize: '14px'
                        }}>
                            Segnalazione inviata con successo! Verrai reindirizzato alla home...
                        </div>
                    )}

                    <form onSubmit={handleReport} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontWeight: '600',
                                color: 'var(--text-primary)',
                                fontSize: '14px'
                            }}>
                                Descrizione del problema
                            </label>
                            <textarea
                                rows="8"
                                placeholder="Descrivi dettagliatamente cosa è successo..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color, #e0e0e0)',
                                    fontFamily: 'inherit',
                                    fontSize: '15px',
                                    resize: 'vertical',
                                    boxSizing: 'border-box',
                                    backgroundColor: 'var(--bg-primary)',
                                    color: 'var(--text-primary)'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                            <button
                                type="button"
                                onClick={() => navigate('/')}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    backgroundColor: 'var(--bg-secondary)',
                                    color: 'var(--text-primary)',
                                    border: 'none',
                                    borderRadius: '20px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Annulla
                            </button>
                            <button
                                type="submit"
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    backgroundColor: 'var(--accent-color)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '20px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}
                            >
                                Invia Segnalazione
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default ReportProblem;