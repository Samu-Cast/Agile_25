import React, { useState } from 'react';
import CommentSection from './CommentSection';
import { toggleSavePost, updateVotes } from '../services/postService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const PostCard = ({ post, currentUser, isLoggedIn, showCommunityInfo }) => {
    const [userVote, setUserVote] = useState(post.userVote || 0);
    const [voteCount, setVoteCount] = useState(post.votes || 0);
    const [isSaved, setIsSaved] = useState(post.isSaved || false); // Assuming backend might send this, or handled locally
    const [isExpanded, setIsExpanded] = useState(false);

    // Initial check for saved status if not passed (though ideally should be passed)
    // For now we'll handle optimistic updates locally for the session if passed, 
    // or fetch if needed. To keep it simple, we'll assume passed or default false.
    // Ideally parent fetches "savedPosts" map and passes `isSaved`.
    // We can accept an `initialIsSaved` prop.

    const handleVote = async (type) => { // type: 1 (up) or -1 (down)
        if (!isLoggedIn) return;

        const currentVote = userVote;
        let newVote = 0;
        let voteChange = 0;

        if (currentVote === type) {
            // Toggle off
            newVote = 0;
            voteChange = -type;
        } else {
            // Switch or new
            newVote = type;
            voteChange = type - currentVote;
        }

        // Optimistic update
        setUserVote(newVote);
        setVoteCount(prev => prev + voteChange);

        try {
            await updateVotes(post.id, currentUser?.uid, type);
        } catch (error) {
            console.error("Error voting:", error);
            // Revert
            setUserVote(currentVote);
            setVoteCount(prev => prev - voteChange);
        }
    };

    const handleToggleSave = async () => {
        if (!isLoggedIn || !currentUser?.uid) return;

        const newSavedState = !isSaved;
        setIsSaved(newSavedState);

        try {
            // Service expects 'isSaved' to be the *previous* state to determine if it should be deleted.
            // If newSavedState is true, it means prev was false (so we want to save -> POST). 
            // Service: isSaved ? DELETE : POST.
            // So if prev (isSaved variable) is true, we pass true to delete.
            // Wait, isSaved state variable is stale inside closure? No, using state variable.
            // So if `isSaved` is true, we pass true -> service calls DELETE.
            // If `isSaved` is false, we pass false -> service calls POST.
            await toggleSavePost(post.id, currentUser.uid, isSaved);
        } catch (error) {
            console.error("Error toggling save:", error);
            setIsSaved(!newSavedState);
        }
    };

    return (
        <div className="post-card">
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
                </div>

                <p className="post-text">{post.content}</p>
                {post.image && <img src={post.image} alt="Post content" className="post-image" />}

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
                    <CommentSection postId={post.id} currentUser={currentUser} />
                )}
            </div>
        </div>
    );
};

export default PostCard;
