import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { uploadImage, validateImage } from '../services/imageService';
import '../styles/components/CreatePostModal.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function CreatePostModal({ onClose, onSuccess }) {
    const [text, setText] = useState('');
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [communities, setCommunities] = useState([]);
    const [selectedCommunity, setSelectedCommunity] = useState(''); // '' means personal profile
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const { currentUser } = useAuth();

    useEffect(() => {
        const fetchCommunities = async () => {
            if (!currentUser) return;
            try {
                // Fetch communities (in real app, filter by joined)
                const response = await fetch(`${API_URL}/communities`);
                if (response.ok) {
                    const data = await response.json();
                    setCommunities(data);
                }
            } catch (error) {
                console.error("Error fetching communities:", error);
            }
        };
        fetchCommunities();
    }, [currentUser]);

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
                uid: currentUser.uid,
                entityType: selectedCommunity ? "community" : "user",
                entityId: selectedCommunity ? selectedCommunity : currentUser.uid,
                communityId: selectedCommunity || null, // Optional field for easier filtering
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

                    <div className="form-group" style={{ marginBottom: '10px', position: 'relative' }}>
                        {/* Custom Searchable Dropdown Trigger */}
                        <div
                            className="post-input"
                            style={{ padding: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        >
                            <span>
                                {selectedCommunity
                                    ? `Post to: ${communities.find(c => c.id === selectedCommunity)?.name || 'Unknown Community'}`
                                    : "Post to: My Profile"}
                            </span>
                            <span style={{ fontSize: '12px', opacity: 0.7 }}>{isDropdownOpen ? '▲' : '▼'}</span>
                        </div>

                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                backgroundColor: 'var(--bg-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                marginTop: '4px',
                                zIndex: 1000,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                maxHeight: '250px',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                {/* Search Input */}
                                <div style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                                    <input
                                        type="text"
                                        placeholder="Search community..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        autoFocus
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            borderRadius: '6px',
                                            border: '1px solid #ddd',
                                            outline: 'none',
                                            fontSize: '14px'
                                        }}
                                    />
                                </div>

                                {/* Options List */}
                                <div style={{ overflowY: 'auto', flex: 1, backgroundColor: 'white' }}>
                                    {/* My Profile Option */}
                                    <div
                                        onClick={() => { setSelectedCommunity(''); setIsDropdownOpen(false); }}
                                        style={{
                                            padding: '10px 12px',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid #f0f0f0',
                                            backgroundColor: selectedCommunity === '' ? '#f0f8ff' : 'transparent',
                                            color: '#333'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedCommunity === '' ? '#f0f8ff' : 'transparent'}
                                    >
                                        <strong>👤 My Profile</strong> (Public)
                                    </div>

                                    {/* Filtered Communities */}
                                    {communities
                                        .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                        .map(c => (
                                            <div
                                                key={c.id}
                                                onClick={() => { setSelectedCommunity(c.id); setIsDropdownOpen(false); }}
                                                style={{
                                                    padding: '10px 12px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    backgroundColor: selectedCommunity === c.id ? '#f0f8ff' : 'transparent',
                                                    color: '#333'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedCommunity === c.id ? '#f0f8ff' : 'transparent'}
                                            >
                                                {c.avatar ? (
                                                    <img src={c.avatar} alt="" style={{ width: '24px', height: '24px', borderRadius: '6px', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>👥</div>
                                                )}
                                                <span>{c.name}</span>
                                            </div>
                                        ))
                                    }

                                    {communities.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                                        <div style={{ padding: '12px', color: '#888', textAlign: 'center', fontSize: '14px' }}>
                                            No communities found
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
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
