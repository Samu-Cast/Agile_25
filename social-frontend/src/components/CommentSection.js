import React, { useState, useEffect } from 'react';
import { addComment, getComments } from '../services/postService';
import './CommentSection.css';

const CommentSection = ({ postId, currentUser }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadComments();
    }, [postId]);

    const loadComments = async () => {
        try {
            setLoading(true);
            const fetchedComments = await getComments(postId);

            // Fetch user details for each comment
            const commentsWithUsers = await Promise.all(fetchedComments.map(async (comment) => {
                let authorName = comment.uid;
                let authorPic = null;
                try {
                    const userRes = await fetch(`http://localhost:3001/api/users/${comment.uid}`);
                    if (userRes.ok) {
                        const userData = await userRes.json();
                        authorName = userData.displayName || userData.name || comment.uid;
                        authorPic = userData.photoURL || userData.profilePic;
                    }
                } catch (e) {
                    console.warn("Failed to fetch user for comment", e);
                }
                return { ...comment, authorName, authorPic };
            }));

            setComments(commentsWithUsers);
        } catch (error) {
            console.error("Error loading comments:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !currentUser) return;

        try {
            const commentData = {
                text: newComment,
                uid: currentUser.uid || currentUser.email, // Backend expects uid
                parentComment: null // Simple comments for now
            };

            await addComment(postId, commentData);
            setNewComment('');
            loadComments(); // Refresh comments
        } catch (error) {
            console.error("Error adding comment:", error);
        }
    };

    return (
        <div className="comment-section">
            <div className="comments-list">
                {loading ? (
                    <p className="loading-text">Caricamento commenti...</p>
                ) : comments.length > 0 ? (
                    comments.map(comment => (
                        <div key={comment.id} className="comment-item">
                            <div className="comment-avatar">
                                {comment.authorPic ? (
                                    <img src={comment.authorPic} alt={comment.authorName} />
                                ) : (
                                    <div className="avatar-placeholder">{comment.authorName[0].toUpperCase()}</div>
                                )}
                            </div>
                            <div className="comment-content">
                                <span className="comment-author">{comment.authorName}</span>
                                <p className="comment-text">{comment.text}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="no-comments">Nessun commento ancora. Sii il primo!</p>
                )}
            </div>

            {currentUser && (
                <form className="comment-form" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Scrivi un commento..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="comment-input"
                    />
                    <button type="submit" className="comment-submit-btn" disabled={!newComment.trim()}>
                        ➤
                    </button>
                </form>
            )}
        </div>
    );
};

export default CommentSection;
