import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CommentSection from './CommentSection';
import CoffeeCupRating from './CoffeeCupRating';
import MediaGallery from './MediaGallery';
import { getUsersByUids } from '../services/userService';

import { toggleSavePost, updateVotes, joinEvent, leaveEvent } from '../services/postService';

// Default images
import defaultPostImage from '../image_post/defaults/default_post.png';
import defaultComparisonImage from '../image_post/defaults/default_comparison.png';



const PostCard = ({ post, currentUser, isLoggedIn, showCommunityInfo, onDelete }) => {
    const [userVote, setUserVote] = useState(post.userVote || 0);
    const [voteCount, setVoteCount] = useState(post.votes || 0);
    const [isSaved, setIsSaved] = useState(post.isSaved || false);
    const [isExpanded, setIsExpanded] = useState(false);
    const navigate = useNavigate();

    const isReview = post.type === 'review';
    const isEvent = post.type === 'event';

    const [isParticipating, setIsParticipating] = useState(post.participants?.includes(currentUser?.uid) || false);
    const [participantsCount, setParticipantsCount] = useState(post.participants?.length || 0);

    // Participants Modal State
    const [showParticipantsModal, setShowParticipantsModal] = useState(false);
    const [participantsList, setParticipantsList] = useState([]);
    const [loadingParticipants, setLoadingParticipants] = useState(false);

    const isCreator = currentUser?.uid === post.authorId || currentUser?.uid === post.uid;

    const handleViewParticipants = async () => {
        if (!post.participants || post.participants.length === 0) return;

        setShowParticipantsModal(true);
        if (participantsList.length > 0) return; // Already loaded

        setLoadingParticipants(true);
        try {
            // Fetch users only when requested
            const users = await getUsersByUids(post.participants);
            setParticipantsList(users);
        } catch (error) {
            console.error("Error fetching participants:", error);
        } finally {
            setLoadingParticipants(false);
        }
    };

    const handleJoinEvent = async () => {
        if (!isLoggedIn) return;
        const previousState = isParticipating;
        // Optimistic update
        setIsParticipating(!previousState);
        setParticipantsCount(prev => previousState ? prev - 1 : prev + 1);

        try {
            if (previousState) {
                await leaveEvent(post.id, currentUser.uid);
            } else {
                await joinEvent(post.id, currentUser.uid);
            }
        } catch (error) {
            console.error("Error toggling event participation:", error);
            // Revert
            setIsParticipating(previousState);
            setParticipantsCount(prev => previousState ? prev + 1 : prev - 1);
        }
    };

    const handleVote = async (type) => {
        if (!isLoggedIn) return;

        const currentVote = userVote;
        let newVote = 0;
        let voteChange = 0;

        if (currentVote === type) {
            newVote = 0;
            voteChange = -type;
        } else {
            newVote = type;
            voteChange = type - currentVote;
        }

        setUserVote(newVote);
        setVoteCount(prev => prev + voteChange);

        try {
            await updateVotes(post.id, currentUser?.uid, type);
        } catch (error) {
            console.error("Error voting:", error);
            setUserVote(currentVote);
            setVoteCount(prev => prev - voteChange);
        }
    };

    const handleToggleSave = async () => {
        if (!isLoggedIn || !currentUser?.uid) return;

        const newSavedState = !isSaved;
        setIsSaved(newSavedState);

        try {
            await toggleSavePost(post.id, currentUser.uid, isSaved);
        } catch (error) {
            console.error("Error toggling save:", error);
            setIsSaved(!newSavedState);
        }
    };

    return (
        <div className={`post-card ${isReview ? 'review-card' : ''}`}>
            <div className="post-content">
                <div className="post-header">
                    <img
                        src={post.authorAvatar || "https://cdn-icons-png.flaticon.com/512/847/847969.png"}
                        alt={post.author}
                        className="post-avatar"
                        onError={(e) => { e.target.onerror = null; e.target.src = "https://cdn-icons-png.flaticon.com/512/847/847969.png" }}
                    />
                    <div className="post-header-info" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                        <span className="post-author">{post.author}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {showCommunityInfo && post.communityName && (
                                <>
                                    <span>in <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{post.communityName}</span></span>
                                    <span>•</span>
                                </>
                            )}
                            <span className="post-time">{post.time}</span>
                        </div>
                    </div>

                    {/* Review Badge */}
                    {isReview && (
                        <div className="review-badge" style={{
                            marginLeft: 'auto',
                            backgroundColor: '#FFD700', // Gold color for review
                            color: '#333',
                            padding: '4px 12px',
                            borderRadius: '16px',
                            fontSize: '12px',
                            fontWeight: 'bold'
                        }}>
                            ⭐ Recensione
                        </div>
                    )}
                    {/* Event Badge */}
                    {isEvent && (
                        <div className="event-badge" style={{
                            backgroundColor: '#E67E22',
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '16px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            marginLeft: 'auto' // Move to right
                        }}>
                            📅 Evento
                        </div>
                    )}
                    {/* Comparison Badge */}
                    {post.type === 'comparison' && (
                        <div className="comparison-badge" style={{
                            backgroundColor: '#6F4E37',
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '16px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            marginLeft: 'auto' // Move to right
                        }}>
                            ⚖️ CONFRONTO
                        </div>
                    )}
                </div>

                {/* Review-specific content */}
                {isReview && post.reviewData && (
                    <div className="review-info-card">
                        <div className="review-item-header">
                            <div>
                                <h3 className="review-item-name">{post.reviewData.itemName}</h3>
                                {post.reviewData.brand && (
                                    <p className="review-item-brand">{post.reviewData.brand}</p>
                                )}
                            </div>
                            <CoffeeCupRating
                                rating={post.reviewData.rating}
                                size="medium"
                            />
                        </div>
                        {post.reviewData.itemType && (
                            <span className="review-item-type">
                                {getItemTypeLabel(post.reviewData.itemType)}
                            </span>
                        )}
                    </div>
                )}

                {/* Event-specific content */}
                {isEvent && post.eventDetails && (
                    <div className="event-info-card" style={{
                        margin: '15px 0',
                        padding: '15px',
                        backgroundColor: '#FFF8E1',
                        borderRadius: '12px',
                        border: '1px solid #FFE0B2'
                    }}>
                        <h3 style={{ margin: '0 0 10px 0', color: '#6F4E37', textAlign: 'center' }}>{post.eventDetails.title}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', fontSize: '14px', textAlign: 'center' }}>
                            <div>
                                <span style={{ fontWeight: 'bold' }}>📅 Data: </span>
                                <span>{new Date(post.eventDetails.date).toLocaleDateString()} alle {post.eventDetails.time}</span>
                            </div>

                            <div>
                                <span style={{ fontWeight: 'bold' }}>📍 Luogo: </span>
                                <span>{post.eventDetails.location}</span>
                            </div>

                            {post.hosts && post.hosts.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                                    <span style={{ fontWeight: 'bold' }}>🎤 Host:</span>
                                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                        {(post.taggedUsersData || []).filter(u => post.hosts.includes(u.uid)).map(host => (
                                            <span key={host.uid} style={{
                                                backgroundColor: '#fff',
                                                padding: '2px 8px',
                                                borderRadius: '10px',
                                                fontSize: '12px',
                                                border: '1px solid #ddd'
                                            }}>
                                                {host.nickname || host.name}
                                            </span>
                                        ))}
                                        {(!post.taggedUsersData || post.taggedUsersData.length === 0) && <span>Vedi dettagli</span>}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ marginTop: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span
                                style={{ fontSize: '13px', color: '#666', cursor: participantsCount > 0 ? 'pointer' : 'default', textDecoration: participantsCount > 0 ? 'underline' : 'none' }}
                                onClick={handleViewParticipants}
                                title={participantsCount > 0 ? "Vedi partecipanti" : ""}
                            >
                                <strong>{participantsCount}</strong> persone parteciperanno
                            </span>

                            {!isCreator ? (
                                <button
                                    onClick={handleJoinEvent}
                                    style={{
                                        backgroundColor: isParticipating ? '#eee' : '#E67E22',
                                        color: isParticipating ? '#333' : 'white',
                                        border: 'none',
                                        padding: '8px 20px',
                                        borderRadius: '20px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {isParticipating ? '✓ Parteciperai' : 'Partecipa +'}
                                </button>
                            ) : (
                                <button
                                    onClick={handleViewParticipants}
                                    style={{
                                        backgroundColor: '#6F4E37',
                                        color: 'white',
                                        border: 'none',
                                        padding: '8px 20px',
                                        borderRadius: '20px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    👥 Vedi Partecipanti
                                </button>
                            )}
                        </div>

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
                                                <div key={p.uid} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                    </div>
                )}
                {/* Comparison-specific content */}
                {post.type === 'comparison' && post.comparisonData && (
                    <div className="comparison-card-content" style={{ margin: '15px 0', border: '1px solid #eee', borderRadius: '12px', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', padding: '15px', backgroundColor: '#fafafa', position: 'relative' }}>

                            {/* VS Badge */}
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                backgroundColor: 'white',
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: '900',
                                color: '#ccc',
                                fontStyle: 'italic',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                zIndex: 2
                            }}>
                                VS
                            </div>

                            {/* Item 1 */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingRight: '10px' }}>
                                <div style={{ width: '100%', aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', marginBottom: '10px', backgroundColor: '#fff', border: '1px solid #eee' }}>
                                    {post.comparisonData.item1.image ? (
                                        <img src={post.comparisonData.item1.image} alt={post.comparisonData.item1.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <img src={defaultComparisonImage} alt={post.comparisonData.item1.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    )}
                                </div>
                                <h3 style={{ margin: '0', fontSize: '16px', fontWeight: 'bold', color: '#333' }}>{post.comparisonData.item1.name}</h3>
                                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>{post.comparisonData.item1.brand}</p>
                            </div>

                            {/* Item 2 */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingLeft: '10px' }}>
                                <div style={{ width: '100%', aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', marginBottom: '10px', backgroundColor: '#fff', border: '1px solid #eee' }}>
                                    {post.comparisonData.item2.image ? (
                                        <img src={post.comparisonData.item2.image} alt={post.comparisonData.item2.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <img src={defaultComparisonImage} alt={post.comparisonData.item2.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    )}
                                </div>
                                <h3 style={{ margin: '0', fontSize: '16px', fontWeight: 'bold', color: '#333' }}>{post.comparisonData.item2.name}</h3>
                                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>{post.comparisonData.item2.brand}</p>
                            </div>
                        </div>
                    </div>
                )}

                <p className="post-text">{post.content}</p>

                {/* Tagged Users */}
                {post.taggedUsers && post.taggedUsers.length > 0 && post.taggedUsersData && (
                    <div style={{
                        marginTop: '12px',
                        padding: '8px 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexWrap: 'wrap',
                        fontSize: '13px',
                        color: '#666'
                    }}>
                        <span style={{ fontWeight: '500' }}>Con:</span>
                        {post.taggedUsersData.map((user, index) => (
                            <span
                                key={user.uid || index}
                                onClick={() => navigate(`/profile/${user.uid}`)}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '4px 10px',
                                    backgroundColor: '#f0f8ff',
                                    border: '1px solid #d0e8f5',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    color: '#0066cc'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#e0f0ff';
                                    e.currentTarget.style.borderColor = '#b0d8f5';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#f0f8ff';
                                    e.currentTarget.style.borderColor = '#d0e8f5';
                                }}
                            >
                                <img
                                    src={user.profilePic || user.photoURL || "https://cdn-icons-png.flaticon.com/512/847/847969.png"}
                                    alt={user.nickname || user.name}
                                    style={{
                                        width: '18px',
                                        height: '18px',
                                        borderRadius: '50%',
                                        objectFit: 'cover'
                                    }}
                                />
                                {user.nickname || user.name}
                            </span>
                        ))}
                    </div>
                )}

                {/* Media Gallery for multiple images/videos (Normal posts only) */}
                {post.type !== 'comparison' && post.mediaUrls && post.mediaUrls.length > 0 ? (
                    <MediaGallery mediaUrls={post.mediaUrls} altText={post.content} />
                ) : (
                    post.type !== 'comparison' && (
                        <img
                            src={post.image || defaultPostImage}
                            alt="Post content"
                            className="post-image"
                        />
                    )
                )}

                <div className="post-footer">
                    <div className="vote-actions">
                        <button
                            data-testid="upvote-btn"
                            className={`vote-btn up ${userVote === 1 ? 'active' : ''}`}
                            onClick={() => handleVote(1)}
                            style={{ color: userVote === 1 ? '#4169E1' : '' }}
                        >
                            ▲
                        </button>
                        <span className="vote-count" data-testid="vote-count">
                            {voteCount >= 1000 ? (voteCount / 1000).toFixed(1) + 'k' : voteCount}
                        </span>
                        <button
                            data-testid="downvote-btn"
                            className={`vote-btn down ${userVote === -1 ? 'active' : ''}`}
                            onClick={() => handleVote(-1)}
                            style={{ color: userVote === -1 ? '#4169E1' : '' }}
                        >
                            ▼
                        </button>
                    </div>

                    <button className="action-btn" onClick={() => setIsExpanded(!isExpanded)}>
                        💬 {post.comments} Comments
                    </button>
                    <button className="action-btn">↗ Share</button>
                    <button
                        className="action-btn"
                        onClick={handleToggleSave}
                        style={{ color: isSaved ? '#FFD700' : 'inherit' }}
                    >
                        {isSaved ? '🔖' : '📑'} {isSaved ? 'Salvato' : 'Salva'}
                    </button>
                    {onDelete && (currentUser?.uid === post.authorId || currentUser?.uid === post.uid) && (
                        <button
                            className="action-btn delete-btn"
                            onClick={(e) => onDelete(post.id, e)}
                            title="Elimina"
                            style={{ color: '#d33', marginLeft: 'auto' }}
                        >
                            🗑
                        </button>
                    )}
                </div>

                {isExpanded && (
                    <CommentSection postId={post.id} postType={post.type} currentUser={currentUser} />
                )}
            </div>
        </div >
    );
};

//Helper function to get item type label
function getItemTypeLabel(itemType) {
    const labels = {
        coffee: 'Caffè in grani',
        blend: 'Miscela',
        espresso_machine: 'Macchina espresso',
        grinder: 'Macinacaffè',
        brewing_tool: 'Strumento di estrazione',
        accessory: 'Accessorio',
        cafe: 'Caffetteria/Bar',
        other: 'Altro'
    };
    return labels[itemType] || itemType;
}

export default PostCard;
