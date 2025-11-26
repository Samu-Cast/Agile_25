import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './PostDetails.css';
import StarRating from '../components/StarRating';
import { updateRating, addComment, getComments } from '../services/postService';

function PostDetails({ posts, onVote, onCoffee, currentUser }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [comment, setComment] = useState('');
    const [comments, setComments] = useState([]);

    useEffect(() => {
        // Find the post by ID
        // Note: id from params is string, post.id might be number or string
        const foundPost = posts.find(p => String(p.id) === id);
        setPost(foundPost);

        // Load comments
        if (foundPost) {
            const loadComments = async () => {
                try {
                    const fetchedComments = await getComments(foundPost.id);
                    setComments(fetchedComments);
                } catch (error) {
                    console.error("Error loading comments:", error);
                }
            };
            loadComments();
        }
    }, [id, posts]);

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!comment.trim() || !currentUser) return;

        const commentData = {
            author: currentUser.displayName || currentUser.email.split('@')[0],
            authorUid: currentUser.uid, // Add UID for querying
            text: comment,
            // timestamp will be added by server
        };

        try {
            const newComment = await addComment(post.id, commentData);
            // Add locally for immediate feedback (with temporary timestamp)
            setComments([{ ...newComment, timestamp: 'Just now' }, ...comments]);
            setComment('');
        } catch (error) {
            console.error("Error adding comment:", error);
        }
    };

    const handleRatingChange = async (postId, rating) => {
        if (!currentUser) {
            alert('Devi essere loggato per valutare!');
            return;
        }
        try {
            await updateRating(postId, currentUser.email, rating);
            // Update local state to reflect change immediately
            setPost(prev => ({
                ...prev,
                ratingBy: {
                    ...prev.ratingBy,
                    [currentUser.email]: rating
                }
            }));
        } catch (err) {
            console.error('Errore nell\'aggiornamento della valutazione:', err);
        }
    };

    if (!post) {
        return (
            <div className="post-details-container">
                <div className="loading">Loading post or post not found...</div>
                <button className="back-button" onClick={() => navigate('/')}>← Back to Feed</button>
            </div>
        );
    }

    return (
        <div className="post-details-container">
            <button className="back-button" onClick={() => navigate('/')}>
                ← Back to Feed
            </button>

            <div className="single-post-card">
                <div className="single-post-header">
                    <div className="author-avatar">
                        {post.author.charAt(0).toUpperCase()}
                    </div>
                    <div className="post-meta">
                        <span className="post-author-name">{post.author}</span>
                        <span className="post-timestamp">{post.time}</span>
                    </div>
                </div>

                <div className="single-post-content">
                    <h1 className="single-post-title">{post.title}</h1>
                    <p className="single-post-text">{post.content}</p>
                    {post.image && (
                        <img src={post.image} alt={post.title} className="single-post-image" />
                    )}
                </div>

                <div className="single-post-actions">
                    <div className="interaction-group">
                        <div className="vote-actions">
                            <button className="vote-btn" onClick={() => onVote(post.id, 1)}>▲</button>
                            <span className="vote-count">{post.votes}</span>
                            <button className="vote-btn" onClick={() => onVote(post.id, -1)}>▼</button>
                        </div>
                    </div>
                    <div className="rating-container">
                        <StarRating
                            postId={post.id}
                            userRatingMap={post.ratingBy || {}}
                            currentUserId={currentUser?.email}
                            onRatingChange={handleRatingChange}
                        />
                    </div>
                </div>
            </div>

            <div className="comments-section">
                <h3 className="comments-header">Comments ({comments.length})</h3>

                {currentUser ? (
                    <form className="comment-form" onSubmit={handleCommentSubmit}>
                        <input
                            type="text"
                            className="comment-input"
                            placeholder="Add a comment..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                        <button type="submit" className="submit-comment-btn" disabled={!comment.trim()}>
                            Post
                        </button>
                    </form>
                ) : (
                    <p className="login-prompt">Please log in to comment.</p>
                )}

                <div className="comments-list">
                    {comments.map(c => (
                        <div key={c.id} className="comment-item">
                            <div className="comment-avatar">
                                {c.author.charAt(0).toUpperCase()}
                            </div>
                            <div className="comment-content">
                                <span className="comment-author">{c.author}</span>
                                <p className="comment-text">{c.text}</p>
                                <span className="comment-timestamp">{c.timestamp}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default PostDetails;
