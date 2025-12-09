import React, { useState } from 'react';

import CommentSection from './CommentSection';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const PostCard = ({ post, user, onVote, onComment, isSaved, onToggleSave }) => {
    const [expanded, setExpanded] = useState(false);

<<<<<<< HEAD
    const { currentUser } = useAuth();

    const toggleComments = async () => {
        if (expanded) {
            setExpanded(false);
            setComments([]); // clear previous comments
            return;
        }

        setExpanded(true);
        setLoadingComments(true);
        try {
            const response = await fetch(`${API_URL}/posts/${post.id}/comments`);
            const data = await response.json();
            // Resolve author names for comments
            const commentUids = [...new Set(data.map(c => c.uid))];
            const users = await getUsersByUids(commentUids);
            const userMap = {};
            users.forEach(u => { userMap[u.uid] = u.nickname || u.name || u.displayName || u.uid; });
            const enrichedComments = data.map(c => ({ ...c, authorName: userMap[c.uid] || c.uid }));
            setComments(enrichedComments);
        } catch (error) {
            // Error fetching comments
        } finally {
            setLoadingComments(false);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        try {
            const response = await fetch(`${API_URL}/posts/${post.id}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: newComment,
                    uid: currentUser?.uid,
                    parentComment: replyingTo ? replyingTo.commentId : null
                }),
            });

            if (response.ok) {
                const addedComment = await response.json();
                // Add authorName for immediate UI update
                const enriched = {
                    ...addedComment,
                    authorName: currentUser?.displayName || currentUser?.uid
                };
                setComments(prev => [...prev, enriched]);
                setNewComment("");
                setReplyingTo(null);
                if (onComment) onComment(post.id);
            }
        } catch (error) {
            // Error adding comment
        }
=======
    const toggleComments = () => {
        setExpanded(!expanded);
>>>>>>> aa0b5aa57b079fc75a1bf85adb40ee2b29a27786
    };

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
