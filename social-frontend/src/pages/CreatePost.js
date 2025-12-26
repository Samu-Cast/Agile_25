import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { uploadImage, validateImage } from '../services/imageService';
import { createPost } from '../services/postService';
import '../styles/pages/Home.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function CreatePost() {
    const [text, setText] = useState('');
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const { currentUser } = useAuth();
    const navigate = useNavigate();

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

            // Map to what createPost service expects
            const postData = {
                authorUid: currentUser.uid,
                content: text,
                imageUrl: imageUrl
            };

            await createPost(postData);

            navigate('/');
        } catch (error) {
            console.error("Error creating post:", error);
            alert(`Failed to create post: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="home-layout">
            <div className="main-container">
                <div style={{
                    gridColumn: '2', /* Center in grid */
                    height: '100%',
                    overflowY: 'auto', /* Scrollable if needed */
                    scrollbarWidth: 'none', /* Hide scrollbar */
                    width: '100%',
                    padding: '2rem',
                    backgroundColor: 'var(--white)',
                    borderRadius: 'var(--border-radius)',
                }}>
                    <h1 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
                        Create a New Post
                    </h1>

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label
                                htmlFor="text"
                                style={{
                                    display: 'block',
                                    marginBottom: '0.5rem',
                                    fontWeight: '600',
                                    color: 'var(--text-primary)'
                                }}
                            >
                                Content
                            </label>
                            <textarea
                                id="text"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="What's on your mind?"
                                required
                                rows="8"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid var(--bg-secondary)',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    backgroundColor: 'var(--bg-primary)',
                                    color: 'var(--text-primary)',
                                    resize: 'vertical',
                                    fontFamily: 'inherit'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label
                                htmlFor="image"
                                style={{
                                    display: 'block',
                                    marginBottom: '0.5rem',
                                    fontWeight: '600',
                                    color: 'var(--text-primary)'
                                }}
                            >
                                Image (Optional)
                            </label>
                            <input
                                id="image"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    border: '1px solid var(--bg-secondary)',
                                    borderRadius: '8px',
                                    backgroundColor: 'var(--bg-primary)',
                                    color: 'var(--text-primary)'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    backgroundColor: loading ? 'var(--bg-secondary)' : 'var(--accent-color)',
                                    color: 'var(--white)',
                                    border: 'none',
                                    borderRadius: '20px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    transition: 'opacity 0.2s'
                                }}
                            >
                                {loading ? 'Posting...' : 'Post'}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/')}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    backgroundColor: 'var(--bg-secondary)',
                                    color: 'var(--text-primary)',
                                    border: 'none',
                                    borderRadius: '20px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default CreatePost;
