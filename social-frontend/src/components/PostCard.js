import React, { useState } from 'react';

import CommentSection from './CommentSection';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const PostCard = ({ post, user, onVote, onComment, isSaved, onToggleSave }) => {
    const [expanded, setExpanded] = useState(false);

    const toggleComments = () => {
        setExpanded(!expanded);
    }


    return (
        <div className="post-card">
            <div className="post-sidebar">
                <button className={`vote-btn up ${post.userVote === 1 ? 'active' : ''}`} onClick={() => onVote(post.id, 'up')}>▲</button>
                <span className="vote-count">{post.votes >= 1000 ? (post.votes / 1000).toFixed(1) + 'k' : post.votes}</span>
                <button className={`vote-btn down ${post.userVote === -1 ? 'active' : ''}`} onClick={() => onVote(post.id, 'down')}>▼</button>
            </div>
            <div className="post-content">
                <div className="post-header">
                    <span className="post-author">{post.authorName || post.author}</span>
                    <span className="post-time">• {post.time}</span>
                </div>
                <h3 className="post-title">{post.title}</h3>
                {post.image && <img src={post.image} alt="Post content" className="post-image" />}
                <p className="post-text">{post.content}</p>
                <div className="post-footer">
                    <button className="action-btn" onClick={toggleComments}>
                        💬 {post.comments} Comments
                    </button>
                    <button className="action-btn">↗ Share</button>
                    <button
                        className="action-btn"
                        onClick={() => onToggleSave && onToggleSave(post.id)}
                        style={{ color: isSaved ? '#FFD700' : 'inherit' }}
                    >
                        {isSaved ? '🔖' : '📑'} {isSaved ? 'Salvato' : 'Salva'}
                    </button>
                </div>

                {expanded && (
                    <CommentSection postId={post.id} />
                )}
            </div>
        </div>
    );
};

export default PostCard;
