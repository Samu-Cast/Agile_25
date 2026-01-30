import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { joinEvent, leaveEvent } from '../services/postService';
import { getUsersByUids } from '../services/userService';
import '../styles/components/EventCard.css';

const EventDetailsCard = ({ eventData, mediaUrls, isPast, hostsData, creatorUid, postId, currentUser, isLoggedIn, initialParticipants }) => {
    const navigate = useNavigate();

    const [isParticipating, setIsParticipating] = useState(initialParticipants?.includes(currentUser?.uid) || false);
    const [participantsCount, setParticipantsCount] = useState(eventData?.participantsCount || initialParticipants?.length || 0);

    // Participants Modal State
    const [showParticipantsModal, setShowParticipantsModal] = useState(false);
    const [participantsList, setParticipantsList] = useState([]);
    const [loadingParticipants, setLoadingParticipants] = useState(false);

    const isCreator = currentUser?.uid === creatorUid;

    if (!eventData) return null;

    // Format date in Italian locale
    const formatEventDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('it-IT', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Calculate progress percentage
    const progressPercentage = eventData.maxParticipants
        ? Math.min((participantsCount / eventData.maxParticipants) * 100, 100)
        : 0;

    const handleJoinEvent = async () => {
        if (!isLoggedIn || !currentUser?.uid || !postId) return;

        const previousState = isParticipating;
        // Optimistic update
        setIsParticipating(!previousState);
        setParticipantsCount(prev => previousState ? prev - 1 : prev + 1);

        try {
            if (previousState) {
                await leaveEvent(postId, currentUser.uid);
            } else {
                await joinEvent(postId, currentUser.uid);
            }
        } catch (error) {
            console.error("Error toggling event participation:", error);
            // Revert
            setIsParticipating(previousState);
            setParticipantsCount(prev => previousState ? prev + 1 : prev - 1);
        }
    };

    const handleViewParticipants = async () => {
        if (!initialParticipants || initialParticipants.length === 0) return;

        setShowParticipantsModal(true);
        if (participantsList.length > 0) return; // Already loaded

        setLoadingParticipants(true);
        try {
            const users = await getUsersByUids(initialParticipants);
            setParticipantsList(users);
        } catch (error) {
            console.error("Error fetching participants:", error);
        } finally {
            setLoadingParticipants(false);
        }
    };

    return (
        <div className={`event-details-card ${isPast ? 'event-past' : ''}`}>
            {isPast && <div className="event-past-indicator">Evento Terminato</div>}

            <h2 className="event-title">{eventData.title}</h2>

            <div className="event-info-grid">
                {/* Date and Time */}
                <div className="event-info-item">
                    <span className="event-icon">📅</span>
                    <div className="event-info-content">
                        <div className="event-info-label">DATA E ORA</div>
                        <div className="event-info-value">{formatEventDate(eventData.date)}</div>
                    </div>
                </div>

                {/* Location */}
                <div className="event-info-item event-location-item">
                    <span className="event-icon">📍</span>
                    <div className="event-info-content">
                        <div className="event-info-label">LUOGO</div>
                        <div className="event-info-value event-location">{eventData.location}</div>
                    </div>
                </div>
            </div>

            {/* Hosts Section */}
            {hostsData && hostsData.length > 0 && (
                <div className="event-hosts-section">
                    <div className="event-hosts-header">
                        <span className="event-icon">🎙️</span>
                        <span className="event-hosts-label">Organizzatori</span>
                    </div>
                    <div className="event-hosts-list">
                        {hostsData.map((host) => (
                            <div
                                key={host.uid}
                                className="event-host-chip"
                                onClick={() => navigate(`/profile/${host.uid}`)}
                            >
                                <img
                                    src={host.profilePic || host.photoURL || "https://cdn-icons-png.flaticon.com/512/847/847969.png"}
                                    alt={host.nickname || host.name}
                                    className="event-host-avatar"
                                />
                                <span className="event-host-name">
                                    {host.nickname || host.name}
                                </span>
                                <span className={`event-host-badge ${host.uid === creatorUid ? 'creator' : ''}`}>
                                    {host.uid === creatorUid ? '👑' : '🎙️'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Participants Info */}
            <div className="event-participants-section">
                <div className="event-participants-header">
                    <span className="event-icon">👥</span>
                    <span
                        className="event-participants-count"
                        style={{ cursor: participantsCount > 0 ? 'pointer' : 'default', textDecoration: participantsCount > 0 ? 'underline' : 'none' }}
                        onClick={handleViewParticipants}
                    >
                        {participantsCount} {eventData.maxParticipants ? `/ ${eventData.maxParticipants}` : ''} partecipanti
                    </span>
                </div>

                {eventData.maxParticipants && (
                    <div className="participants-progress-bar-container">
                        <div className="participants-progress-bar">
                            <div
                                className="participants-progress-fill"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                        <span className="participants-progress-text">
                            {Math.round(progressPercentage)}%
                        </span>
                    </div>
                )}
            </div>

            {/* Join/Leave Button */}
            {!isPast && isLoggedIn && !isCreator && (
                <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'center' }}>
                    <button
                        onClick={handleJoinEvent}
                        style={{
                            backgroundColor: isParticipating ? '#eee' : '#E67E22',
                            color: isParticipating ? '#333' : 'white',
                            border: 'none',
                            padding: '12px 30px',
                            borderRadius: '25px',
                            fontWeight: 'bold',
                            fontSize: '16px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                    >
                        {isParticipating ? '✓ Parteciperai' : 'Partecipa +'}
                    </button>
                </div>
            )}

            {/* Creator View */}
            {!isPast && isLoggedIn && isCreator && (
                <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'center' }}>
                    <button
                        onClick={handleViewParticipants}
                        style={{
                            backgroundColor: '#6F4E37',
                            color: 'white',
                            border: 'none',
                            padding: '12px 30px',
                            borderRadius: '25px',
                            fontWeight: 'bold',
                            fontSize: '16px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        👥 Vedi Partecipanti
                    </button>
                </div>
            )}

            {/* Participants Modal */}
            {showParticipantsModal && (
                <div className="modal-overlay" onClick={() => setShowParticipantsModal(false)} style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{
                        backgroundColor: 'white', padding: '20px', borderRadius: '12px',
                        width: '90%', maxWidth: '400px', maxHeight: '500px', overflowY: 'auto'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 style={{ margin: 0 }}>Partecipanti ({participantsCount})</h3>
                            <button onClick={() => setShowParticipantsModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>×</button>
                        </div>

                        {loadingParticipants ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Caricamento...</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {(participantsList || []).map(p => (
                                    <div key={p.uid} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => navigate(`/profile/${p.uid}`)}>
                                        <img
                                            src={p.profilePic || p.photoURL || "https://cdn-icons-png.flaticon.com/512/847/847969.png"}
                                            alt={p.nickname}
                                            style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                                        />
                                        <span style={{ fontWeight: '500' }}>{p.nickname || p.name}</span>
                                    </div>
                                ))}
                                {(!participantsList || participantsList.length === 0) && <p style={{ color: '#888' }}>Nessun partecipante trovato.</p>}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Media Gallery */}
            {mediaUrls && mediaUrls.length > 0 && (
                <div className="event-media-gallery">
                    {mediaUrls.slice(0, 4).map((url, index) => (
                        <div key={index} className="event-media-item">
                            {url.endsWith('.mp4') || url.endsWith('.webm') ? (
                                <video src={url} className="event-media-video" controls />
                            ) : (
                                <img src={url} alt={`Event ${index + 1}`} className="event-media-image" />
                            )}
                        </div>
                    ))}
                    {mediaUrls.length > 4 && (
                        <div className="event-media-item event-media-more">
                            +{mediaUrls.length - 4} altre
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default EventDetailsCard;
