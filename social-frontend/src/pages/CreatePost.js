import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css'; // Riutilizza gli stili per ora

function CreatePost({ onPostCreate }) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        // Chiama la funzione per aggiungere il post
        onPostCreate({ title, content });
        // Torna alla home dopo la creazione
        navigate('/');
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

                        <div style={{ marginBottom: '1.5rem' }}>
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

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                type="submit"
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    backgroundColor: 'var(--accent-color)',
                                    color: 'var(--white)',
                                    border: 'none',
                                    borderRadius: '20px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'opacity 0.2s'
                                }}
                                onMouseOver={(e) => e.target.style.opacity = '0.9'}
                                onMouseOut={(e) => e.target.style.opacity = '1'}
                            >
                                Post
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
                                onMouseOver={(e) => e.target.style.backgroundColor = 'var(--bg-primary)'}
                                onMouseOut={(e) => e.target.style.backgroundColor = 'var(--bg-secondary)'}
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
