import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { uploadImage, validateImage } from '../services/imageService';
import '../styles/components/CreatePostModal.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function CreatePostModal({ onClose, onSuccess }) {
    const [text, setText] = useState('');
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const { currentUser } = useAuth();

    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            setImage(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!currentUser) {
            alert("You must be logged in to create a post.");
            return;
        }

        setLoading(true);

        try {
            let imageUrl = null;

            if (image) {
                if (!validateImage(image)) {
                    setLoading(false);
                    return;
                }
                imageUrl = await uploadImage(image, 'posts');
            }

            const postData = {
                uid: currentUser.uid,
                entityType: "user",
                entityId: currentUser.uid,
                text: text,
                imageUrl: imageUrl,
                createdAt: new Date().toISOString(),
                commentsCount: 0
            };

            const response = await fetch(`${API_URL}/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(postData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create post');
            }

            // Reset form and close modal
            setText('');
            setImage(null);
            if (onSuccess) onSuccess(); // Trigger reload of feed if needed
            onClose();

        } catch (error) {
            console.error("Error creating post:", error);
            alert(`Failed to create post: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Create Post</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="What's on your mind?"
                            required
                            rows="4"
                            className="post-input"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="modal-image" className="image-upload-label">
                            {image ? `Image selected: ${image.name}` : "Add Image (Optional)"}
                        </label>
                        <input
                            id="modal-image"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            style={{ display: 'none' }}
                        />
                    </div>

                    <div className="modal-footer">
                        <button
                            type="submit"
                            disabled={loading}
                            className="submit-btn"
                        >
                            {loading ? 'Posting...' : 'Post'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreatePostModal;
