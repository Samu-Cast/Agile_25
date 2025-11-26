import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import StarRating from './StarRating';

const PostCard = ({ post, user, onVote, onComment, isSaved, onToggleSave, onRatingChange }) => {
    const [expanded, setExpanded] = useState(false);
    const [loadingComments, setLoadingComments] = useState(false);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [replyingTo, setReplyingTo] = useState(null);

    const { currentUser } = useAuth();

    const toggleComments = async () => {
        if (expanded) {
            setExpanded(false);
            return;
        }

        setExpanded(true);
        setLoadingComments(true);
        try {
            const response = await fetch(`http://localhost:3001/api/posts/${post.id}/comments`);
            const data = await response.json();
            setComments(data);
        } catch (error) {
            console.error("Error fetching comments:", error);
        } finally {
            setLoadingComments(false);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        try {
            const response = await fetch(`http://localhost:3001/api/posts/${post.id}/comments`, {
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
                setComments(prev => [...prev, addedComment]);
                setNewComment("");
                setReplyingTo(null);
                if (onComment) onComment(post.id);
            }
        } catch (error) {
            console.error("Error adding comment:", error);
        }
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
                    {onRatingChange && (
                        <StarRating
                            postId={post.id}
                            userRatingMap={post.ratingBy || {}}
                            currentUserId={currentUser?.uid}
                            onRatingChange={onRatingChange}
                        />
                    )}
                </div>

                {expanded && (
                    <div className="comments-section">
                        {loadingComments ? (
                            <p>Loading comments...</p>
                        ) : (
                            <>
                                <div className="comments-list">
                                    {comments.map(comment => (
                                        <div key={comment.id} className="comment" style={{ marginLeft: comment.parentComment ? '20px' : '0' }}>
                                            <span className="comment-author">{comment.uid}</span>
                                            <p className="comment-text">{comment.text}</p>
                                            <button
                                                className="reply-btn"
                                                style={{ fontSize: '0.8em', color: 'gray', background: 'none', border: 'none', cursor: 'pointer' }}
                                                onClick={() => setReplyingTo({ commentId: comment.id, author: comment.uid })}
                                            >
                                                Reply
                                            </button>
                                        </div>
                                    ))}
                                    {comments.length === 0 && (
                                        <p className="no-comments">No comments yet.</p>
                                    )}
                                </div>
                                {currentUser && (
                                    <div className="add-comment">
                                        {replyingTo && (
                                            <div className="replying-indicator">
                                                Replying to {replyingTo.author}
                                                <button onClick={() => setReplyingTo(null)} style={{ marginLeft: '5px' }}>x</button>
                                            </div>
                                        )}
                                        <input
                                            type="text"
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleAddComment();
                                                }
                                            }}
                                            placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
                                        />
                                        <button onClick={handleAddComment}>Post</button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PostCard;
