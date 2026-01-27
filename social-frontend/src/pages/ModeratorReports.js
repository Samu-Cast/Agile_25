import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getReports, updateReportStatus } from '../services/reportService';
import { useNavigate } from 'react-router-dom';
import '../styles/components/AuthModal.css'; // Use existing modal styles
import '../styles/pages/ModeratorReports.css';

const ModeratorReports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedReport, setSelectedReport] = useState(null);
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    // Sort reports: Open first, then by date descending
    const sortedReports = [...reports].sort((a, b) => {
        if (a.status === b.status) {
            return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return a.status === 'open' ? -1 : 1;
    });

    useEffect(() => {
        // Auth check removed for Easter Egg access

        const fetchReports = async () => {
            try {
                const data = await getReports();
                setReports(data);
            } catch (err) {
                setError('Impossibile caricare le segnalazioni.');
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, [currentUser, navigate]);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString();
    };

    const handleCloseReport = async () => {
        if (!selectedReport) return;
        try {
            await updateReportStatus(selectedReport.id, 'closed');
            // Update local state
            setReports(reports.map(r => r.id === selectedReport.id ? { ...r, status: 'closed' } : r));
            setSelectedReport(null); // Close modal
        } catch (err) {
            console.error("Error closing report:", err);
            // Optionally show error in modal
        }
    };

    return (
        <div className="moderator-layout">
            <div className="main-container">
                <div className="moderator-reports-container">
                    <h2 className="moderator-title">
                        <span className="moderator-title-icon">🛡️</span>
                        Pannello Moderazione: Segnalazioni
                    </h2>

                    {error && (
                        <div className="moderator-error-message">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="moderator-loading">
                            Caricamento...
                        </div>
                    ) : (
                        sortedReports.length === 0 ? (
                            <div className="moderator-empty">
                                Nessuna segnalazione presente.
                            </div>
                        ) : (
                            <div className="reports-list">
                                {sortedReports.map(report => (
                                    <div
                                        key={report.id}
                                        onClick={() => setSelectedReport(report)}
                                        className="report-item"
                                    >
                                        <div className="report-header">
                                            <span className={`report-status ${report.status}`}>
                                                {report.status.toUpperCase()}
                                            </span>
                                            <span className="report-date">
                                                {formatDate(report.createdAt)}
                                            </span>
                                        </div>
                                        {/* Mostra Titolo nella lista */}
                                        <h3 className="report-title-preview">
                                            {report.title || 'Nessun titolo'}
                                        </h3>
                                        <div className="report-user">
                                            Segnalato da: {report.userName}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            </div>

            {selectedReport && (
                <div className="auth-modal-overlay" onClick={() => setSelectedReport(null)}>
                    <div className="auth-modal" onClick={e => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setSelectedReport(null)}>&times;</button>

                        {/* Titolo nel popup */}
                        <h2 className="report-detail-title">
                            {selectedReport.title || 'Dettaglio Segnalazione'}
                        </h2>
                        <div className="report-detail-id">
                            ID: {selectedReport.id}
                        </div>

                        <div className="report-detail-section">
                            <div className="report-detail-label">
                                Dettagli Utente:
                            </div>
                            <div className="report-detail-value">
                                {selectedReport.userName} ({selectedReport.uid})
                            </div>
                        </div>

                        <div className="report-detail-section">
                            <div className="report-detail-label">
                                Descrizione:
                            </div>
                            <div className="report-detail-description">
                                {selectedReport.description}
                            </div>
                        </div>

                        <div className="report-detail-status-row">
                            <div className="report-detail-label">Stato:</div>
                            <span className={`report-status ${selectedReport.status}`}>
                                {selectedReport.status.toUpperCase()}
                            </span>
                        </div>

                        <div className="report-actions">
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="btn-cancel"
                            >
                                Annulla
                            </button>
                            {selectedReport.status === 'open' && (
                                <button
                                    onClick={handleCloseReport}
                                    className="btn-close-report"
                                >
                                    Chiudi Segnalazione
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModeratorReports;
