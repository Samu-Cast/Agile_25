import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { createReport } from '../services/reportService';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/ReportProblem.css';

const ReportProblem = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    //°°°°°°°Konami Code Easter Egg°°°°°°°
    useEffect(() => {
        const konamiCode = [
            'ArrowUp', 'ArrowUp',
            'ArrowDown', 'ArrowDown',
            'ArrowLeft', 'ArrowRight',
            'ArrowLeft', 'ArrowRight',
            'b', 'a'
        ];
        let cursor = 0;

        const handleKeyDown = (e) => {
            if (e.key === konamiCode[cursor]) {
                cursor++;
                if (cursor === konamiCode.length) {
                    // Sequence completed!
                    navigate('/moderator/reports');
                    cursor = 0;
                }
            } else {
                cursor = 0; // Reset if miss
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [navigate]);

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
                title: title,
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
                <div className="report-card">
                    <h2 className="report-title">
                        Area segnalazioni
                    </h2>

                    <div className="report-info-box">
                        Riscontri un bug o un malfunzionamento? Descrivilo qui sotto per aiutarci a migliorare la piattaforma.
                    </div>

                    {error && (
                        <div className="report-message error">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="report-message success">
                            Segnalazione inviata con successo! Verrai reindirizzato alla home...
                        </div>
                    )}

                    <form onSubmit={handleReport} className="report-form">
                        <div>
                            <label className="report-label">
                                Titolo del problema
                            </label>
                            <input
                                type="text"
                                placeholder="Breve riassunto (es. Login non funzionante)"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                className="report-input"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color, #e0e0e0)',
                                    fontFamily: 'inherit',
                                    fontSize: '15px',
                                    marginBottom: '16px',
                                    boxSizing: 'border-box',
                                    backgroundColor: 'var(--bg-primary)',
                                    color: 'var(--text-primary)'
                                }}
                            />
                        </div>

                        <div>
                            <label className="report-label">
                                Descrizione del problema
                            </label>
                            <textarea
                                rows="8"
                                placeholder="Descrivi dettagliatamente cosa è successo..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                                className="report-textarea"
                            />
                        </div>

                        <div className="form-actions">
                            <button
                                type="button"
                                onClick={() => navigate('/')}
                                className="btn-cancel"
                            >
                                Annulla
                            </button>
                            <button
                                type="submit"
                                className="btn-submit"
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