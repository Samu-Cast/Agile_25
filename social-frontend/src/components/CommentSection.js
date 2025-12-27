import React, { useState, useEffect } from 'react';
import { addComment, getComments } from '../services/postService';
import { uploadMultipleMedia, validateMedia } from '../services/imageService';
import { useAuth } from '../context/AuthContext';
import '../styles/components/CommentSection.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const CommentSection = ({ postId, postType }) => {
    const { currentUser } = useAuth();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);

    // Media upload state (only for reviews)
    const [mediaFiles, setMediaFiles] = useState([]);
    const [mediaPreviews, setMediaPreviews] = useState([]);

    const isReview = postType === 'review';

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
                    const userRes = await fetch(`${API_URL}/users/${comment.uid}`);
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

    const handleMediaChange = (e) => {
        const files = Array.from(e.target.files);

        // Max 3 media per comment
        const totalMedia = mediaFiles.length + files.length;
        if (totalMedia > 3) {
            alert('Massimo 3 file per commento');
            e.target.value = '';
            return;
        }

        // Validate each file
        const validFiles = files.filter(file => {
            const isValid = validateMedia(file);
            return isValid;
        });

        if (validFiles.length === 0) {
            e.target.value = '';
            return;
        }

        // Create previews
        const newPreviews = validFiles.map(file => ({
            file,
            url: URL.createObjectURL(file),
            type: file.type.startsWith('image/') ? 'image' : 'video'
        }));

        setMediaFiles([...mediaFiles, ...validFiles]);
        setMediaPreviews([...mediaPreviews, ...newPreviews]);

        e.target.value = '';
    };

    const removeMedia = (index) => {
        const newFiles = [...mediaFiles];
        const newPreviews = [...mediaPreviews];

        URL.revokeObjectURL(newPreviews[index].url);

        newFiles.splice(index, 1);
        newPreviews.splice(index, 1);

        setMediaFiles(newFiles);
        setMediaPreviews(newPreviews);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !currentUser) return;

        try {
            // Upload media if any
            let uploadedMediaUrls = [];
            if (mediaFiles.length > 0) {
                uploadedMediaUrls = await uploadMultipleMedia(mediaFiles, 'comments');
            }

            const commentData = {
                text: newComment,
                authorUid: currentUser.uid || currentUser.email,
                parentComment: null,
                mediaUrls: uploadedMediaUrls
            };

            await addComment(postId, commentData);
            setNewComment('');
            setMediaFiles([]);
            setMediaPreviews([]);
            loadComments();
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

                                {/* Display media if present */}
                                {comment.mediaUrls && comment.mediaUrls.length > 0 && (
                                    <div className="comment-media-grid">
                                        {comment.mediaUrls.map((url, index) => {
                                            const isVideo = url.match(/\.(mp4|mov|webm)$/i);
                                            return isVideo ? (
                                                <video key={index} src={url} controls className="comment-media-item" />
                                            ) : (
                                                <img key={index} src={url} alt="Comment media" className="comment-media-item" />
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="no-comments">Nessun commento ancora. Sii il primo!</p>
                )}
            </div>

            {currentUser && (
                <>
                    {/* Media Previews */}
                    {isReview && mediaPreviews.length > 0 && (
                        <div className="comment-media-previews">
                            {mediaPreviews.map((preview, index) => (
                                <div key={index} className="comment-media-preview-item">
                                    {preview.type === 'image' ? (
                                        <img src={preview.url} alt="Preview" />
                                    ) : (
                                        <video src={preview.url} />
                                    )}
                                    <button type="button" onClick={() => removeMedia(index)}>×</button>
                                </div>
                            ))}
                        </div>
                    )}

                    <form className="comment-form" onSubmit={handleSubmit}>
                        <input
                            type="text"
                            placeholder="Scrivi un commento..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="comment-input"
                        />

                        {/* Media Upload - ONLY for reviews */}
                        {isReview && (
                            <>
                                <label htmlFor={`comment-media-${postId}`} className="media-upload-btn" title="Aggiungi foto/video">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect x="2" y="6" width="20" height="14" rx="2" stroke="#6F4E37" strokeWidth="2" />
                                        <circle cx="12" cy="13" r="3" stroke="#6F4E37" strokeWidth="2" />
                                        <path d="M8 6L9 4H15L16 6" stroke="#6F4E37" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </label>
                                <input
                                    id={`comment-media-${postId}`}
                                    type="file"
                                    accept="image/*,video/*"
                                    multiple
                                    onChange={handleMediaChange}
                                    style={{ display: 'none' }}
                                />
                            </>
                        )}

                        <button type="submit" className="comment-submit-btn" disabled={!newComment.trim()}>
                            ➤
                        </button>
                    </form>
                </>
            )}
        </div>
    );
};

export default CommentSection;
