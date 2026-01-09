import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CommentSection from './CommentSection';
import CoffeeCupRating from './CoffeeCupRating';
import MediaGallery from './MediaGallery';
import { toggleSavePost, updateVotes } from '../services/postService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const PostCard = ({ post, currentUser, isLoggedIn, showCommunityInfo }) => {
    const [userVote, setUserVote] = useState(post.userVote || 0);
    const [voteCount, setVoteCount] = useState(post.votes || 0);
    const [isSaved, setIsSaved] = useState(post.isSaved || false);
    const [isExpanded, setIsExpanded] = useState(false);
    const navigate = useNavigate();

    const isReview = post.type === 'review';

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
                        <div className="review-badge">
                            ⭐ Recensione
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

                {/* Media Gallery for multiple images/videos */}
                {post.mediaUrls && post.mediaUrls.length > 0 ? (
                    <MediaGallery mediaUrls={post.mediaUrls} altText={post.content} />
                ) : (
                    post.image && <img src={post.image} alt="Post content" className="post-image" />
                )}

                <div className="post-footer">
                    <div className="vote-actions">
                        <button
                            className={`vote-btn up ${userVote === 1 ? 'active' : ''}`}
                            onClick={() => handleVote(1)}
                            style={{ color: userVote === 1 ? '#4169E1' : '' }}
                        >
                            ▲
                        </button>
                        <span className="vote-count">
                            {voteCount >= 1000 ? (voteCount / 1000).toFixed(1) + 'k' : voteCount}
                        </span>
                        <button
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
                </div>

                {isExpanded && (
                    <CommentSection postId={post.id} postType={post.type} currentUser={currentUser} />
                )}
            </div>
        </div>
    );
};

// Helper function to get item type label
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
