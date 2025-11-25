import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import { uploadImage, validateImage } from '../services/imageService';

function CreatePost({ onPostCreate }) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const navigate = useNavigate();

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file && validateImage(file)) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);

        try {
            let imageUrl = null;
            if (imageFile) {
                imageUrl = await uploadImage(imageFile, 'posts');
            }

            await onPostCreate({
                title,
                content,
                imageUrl
            });

            navigate('/');
        } catch (error) {
            console.error('Errore nella creazione del post:', error);
            alert('Errore nel caricamento. Riprova.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="home-layout">
            <div className="main-container">
                <div style={{
                    flex: 1,
                    maxWidth: '740px',
                    margin: '0 auto',
                    padding: '2rem',
                    backgroundColor: 'var(--white)',
                    borderRadius: 'var(--border-radius)',
                }}>
                    <h1 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
                        Create a New Post
                    </h1>

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label
                                htmlFor="title"
                                style={{
                                    display: 'block',
                                    marginBottom: '0.5rem',
                                    fontWeight: '600',
                                    color: 'var(--text-primary)'
                                }}
                            >
                                Title
                            </label>
                            <input
                                id="title"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter your post title..."
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid var(--bg-secondary)',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    backgroundColor: 'var(--bg-primary)',
                                    color: 'var(--text-primary)'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label
                                htmlFor="content"
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
                                id="content"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
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

                        {/* Image upload */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label
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
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    border: '1px solid var(--bg-secondary)',
                                    borderRadius: '8px',
                                    backgroundColor: 'var(--bg-primary)',
                                }}
                            />

                            {imagePreview && (
                                <div style={{ marginTop: '1rem', position: 'relative' }}>
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        style={{
                                            maxWidth: '100%',
                                            borderRadius: '8px',
                                            maxHeight: '300px',
                                            objectFit: 'contain'
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        style={{
                                            position: 'absolute',
                                            top: '10px',
                                            right: '10px',
                                            backgroundColor: 'rgba(0,0,0,0.7)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '30px',
                                            height: '30px',
                                            cursor: 'pointer',
                                            fontSize: '18px'
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                type="submit"
                                disabled={uploading}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    backgroundColor: uploading ? '#ccc' : 'var(--accent-color)',
                                    color: 'var(--white)',
                                    border: 'none',
                                    borderRadius: '20px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    cursor: uploading ? 'not-allowed' : 'pointer',
                                    transition: 'opacity 0.2s'
                                }}
                                onMouseOver={(e) => !uploading && (e.target.style.opacity = '0.9')}
                                onMouseOut={(e) => !uploading && (e.target.style.opacity = '1')}
                            >
                                {uploading ? 'Uploading...' : 'Post'}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/')}
                                disabled={uploading}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    backgroundColor: 'var(--bg-secondary)',
                                    color: 'var(--text-primary)',
                                    border: 'none',
                                    borderRadius: '20px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    cursor: uploading ? 'not-allowed' : 'pointer',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseOver={(e) => !uploading && (e.target.style.backgroundColor = 'var(--bg-primary)')}
                                onMouseOut={(e) => !uploading && (e.target.style.backgroundColor = 'var(--bg-secondary)')}
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
