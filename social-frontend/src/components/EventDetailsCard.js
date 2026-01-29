import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/components/EventCard.css';

const EventDetailsCard = ({ eventData, mediaUrls, isPast, hostsData, creatorUid }) => {
    const navigate = useNavigate();

    if (!eventData) return null;

    // Format date in Italian locale
    const formatEventDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('it-IT', {
            weekday: 'long',
            year: 'numeric',
            month:

                'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Calculate progress percentage
    const progressPercentage = eventData.maxParticipants
        ? Math.min((eventData.participantsCount / eventData.maxParticipants) * 100, 100)
        : 0;

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
                    <span className="event-participants-count">
                        {eventData.participantsCount} {eventData.maxParticipants ? `/ ${eventData.maxParticipants}` : ''} partecipanti
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
