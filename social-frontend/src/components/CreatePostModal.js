import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { uploadMultipleMedia, validateMedia } from '../services/imageService';
import CoffeeCupRating from './CoffeeCupRating';
import '../styles/components/CreatePostModal.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const ITEM_TYPES = [
    { value: 'coffee', label: 'Caffè in grani' },
    { value: 'blend', label: 'Miscela' },
    { value: 'espresso_machine', label: 'Macchina espresso' },
    { value: 'grinder', label: 'Macinacaffè' },
    { value: 'brewing_tool', label: 'Strumento di estrazione' },
    { value: 'accessory', label: 'Accessorio' },
    { value: 'cafe', label: 'Caffetteria/Bar' },
    { value: 'other', label: 'Altro' }
];

function CreatePostModal({ onClose, onSuccess }) {
    const [postType, setPostType] = useState('post'); // 'post' or 'review'
    const [text, setText] = useState('');
    const [mediaFiles, setMediaFiles] = useState([]);
    const [mediaPreviews, setMediaPreviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [communities, setCommunities] = useState([]);
    const [selectedCommunity, setSelectedCommunity] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Review-specific fields
    const [reviewData, setReviewData] = useState({
        itemName: '',
        itemType: 'coffee',
        brand: '',
        rating: 0
    });

    const { currentUser } = useAuth();

    useEffect(() => {
        const fetchCommunities = async () => {
            if (!currentUser) return;
            try {
                const response = await fetch(`${API_URL}/users/${currentUser.uid}/communities`);
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

    const handleMediaChange = (e) => {
        const files = Array.from(e.target.files);

        console.log('[CreatePostModal] handleMediaChange called, files:', files.length);

        // Max 5 images + 1 video
        const totalMedia = mediaFiles.length + files.length;
        if (totalMedia > 6) {
            alert('Massimo 6 file (5 immagini + 1 video)');
            e.target.value = ''; // Reset input
            return;
        }

        // Validate each file
        const validFiles = files.filter(file => {
            console.log('[CreatePostModal] Validating file:', file.name, file.type, file.size);
            return validateMedia(file);
        });

        console.log('[CreatePostModal] Valid files:', validFiles.length);

        if (validFiles.length === 0) {
            e.target.value = ''; // Reset input
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

        e.target.value = ''; // Reset input to allow selecting same file again
    };

    const removeMedia = (index) => {
        const newFiles = mediaFiles.filter((_, i) => i !== index);
        const newPreviews = mediaPreviews.filter((_, i) => i !== index);

        // Revoke URL to free memory
        URL.revokeObjectURL(mediaPreviews[index].url);

        setMediaFiles(newFiles);
        setMediaPreviews(newPreviews);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!currentUser) {
            alert("You must be logged in to create a post.");
            return;
        }

        // Validate review fields
        if (postType === 'review') {
            if (!reviewData.itemName || !reviewData.rating) {
                alert('Per favore inserisci il nome dell\'articolo e una valutazione');
                return;
            }
        }

        setLoading(true);

        try {
            let mediaUrls = [];

            if (mediaFiles.length > 0) {
                mediaUrls = await uploadMultipleMedia(mediaFiles, 'posts');
            }

            const postData = {
                uid: currentUser.uid,
                entityType: selectedCommunity ? "community" : "user",
                entityId: selectedCommunity ? selectedCommunity : currentUser.uid,
                communityId: selectedCommunity || null,
                type: postType,
                text: text,
                mediaUrls: mediaUrls,
                imageUrl: mediaUrls.length > 0 ? mediaUrls[0] : null, // Legacy support
                createdAt: new Date().toISOString(),
                commentsCount: 0
            };

            // Add review data if it's a review
            if (postType === 'review') {
                postData.reviewData = reviewData;
            }

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
            setMediaFiles([]);
            setMediaPreviews([]);
            setReviewData({ itemName: '', itemType: 'coffee', brand: '', rating: 0 });
            setPostType('post');
            if (onSuccess) onSuccess();
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
            <div className="modal-content create-post-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Crea Contenuto</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                {/* Post Type Tabs */}
                <div className="post-type-tabs">
                    <button
                        type="button"
                        className={`tab-btn ${postType === 'post' ? 'active' : ''}`}
                        onClick={() => setPostType('post')}
                    >
                        📝 Post
                    </button>
                    <button
                        type="button"
                        className={`tab-btn ${postType === 'review' ? 'active' : ''}`}
                        onClick={() => setPostType('review')}
                    >
                        ⭐ Recensione
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Review-specific fields */}
                    {postType === 'review' && (
                        <div className="review-fields">
                            <div className="form-group">
                                <label>Nome articolo *</label>
                                <input
                                    type="text"
                                    className="post-input"
                                    placeholder="es. Ethiopian Yirgacheffe"
                                    value={reviewData.itemName}
                                    onChange={(e) => setReviewData({ ...reviewData, itemName: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Tipo di articolo</label>
                                <select
                                    className="post-input"
                                    value={reviewData.itemType}
                                    onChange={(e) => setReviewData({ ...reviewData, itemType: e.target.value })}
                                >
                                    {ITEM_TYPES.map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Marca/Torrefazione (opzionale)</label>
                                <input
                                    type="text"
                                    className="post-input"
                                    placeholder="es. Lavazza, Illy..."
                                    value={reviewData.brand}
                                    onChange={(e) => setReviewData({ ...reviewData, brand: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>Valutazione *</label>
                                <div style={{ padding: '12px 0' }}>
                                    <CoffeeCupRating
                                        rating={reviewData.rating}
                                        interactive={true}
                                        onChange={(rating) => setReviewData({ ...reviewData, rating })}
                                        size="large"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Text content */}
                    <div className="form-group">
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder={postType === 'review' ? "Racconta la tua esperienza..." : "What's on your mind?"}
                            required
                            rows="4"
                            className="post-input"
                        />
                    </div>

                    {/* Community selector */}
                    <div className="form-group" style={{ marginBottom: '10px', position: 'relative' }}>
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

                                <div style={{ overflowY: 'auto', flex: 1, backgroundColor: 'white' }}>
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

                    {/* Media upload */}
                    <div className="form-group">
                        <label htmlFor="modal-media" className="image-upload-label">
                            {mediaPreviews.length > 0 ? `${mediaPreviews.length} file selezionati` : "📸 Aggiungi Foto/Video (Opzionale)"}
                        </label>
                        <input
                            id="modal-media"
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            onChange={handleMediaChange}
                            style={{ display: 'none' }}
                        />
                    </div>

                    {/* Media previews */}
                    {mediaPreviews.length > 0 && (
                        <div className="media-previews">
                            {mediaPreviews.map((preview, index) => (
                                <div key={index} className="media-preview-item">
                                    {preview.type === 'image' ? (
                                        <img src={preview.url} alt={`Preview ${index + 1}`} />
                                    ) : (
                                        <video src={preview.url} />
                                    )}
                                    <button
                                        type="button"
                                        className="remove-media-btn"
                                        onClick={() => removeMedia(index)}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="modal-footer">
                        <button
                            type="submit"
                            disabled={loading}
                            className="submit-btn"
                        >
                            {loading ? 'Posting...' : postType === 'review' ? 'Pubblica Recensione' : 'Post'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreatePostModal;
