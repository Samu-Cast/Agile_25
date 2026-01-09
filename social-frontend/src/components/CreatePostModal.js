import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { uploadMultipleMedia, validateMedia } from '../services/imageService';
import { searchGlobal } from '../services/userService';
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

    // User tagging states
    const [taggedUsers, setTaggedUsers] = useState([]);
    const [showUserSearch, setShowUserSearch] = useState(false);
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [userSearchResults, setUserSearchResults] = useState([]);

    // Review-specific fields
    const [reviewData, setReviewData] = useState({
        itemName: '',
        itemType: 'coffee',
        brand: '',
        rating: 0
    });

    // Comparison fields
    const [isComparison, setIsComparison] = useState(false);
    const [comparisonTitle1, setComparisonTitle1] = useState('');
    const [comparisonTitle2, setComparisonTitle2] = useState('');

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

    // User search with debouncing
    useEffect(() => {
        if (userSearchQuery.length > 1) {
            const timer = setTimeout(async () => {
                try {
                    const results = await searchGlobal(userSearchQuery);
                    const userResults = results.filter(r =>
                        ['user', 'bar', 'roaster'].includes(r.type) &&
                        r.uid !== currentUser?.uid && // Exclude self
                        !taggedUsers.find(u => u.uid === r.uid) // Exclude already tagged
                    );
                    setUserSearchResults(userResults);
                } catch (error) {
                    console.error('User search error:', error);
                }
            }, 300);
            return () => clearTimeout(timer);
        } else {
            setUserSearchResults([]);
        }
    }, [userSearchQuery, currentUser, taggedUsers]);

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

    const addTaggedUser = (user) => {
        if (!taggedUsers.find(u => u.uid === user.uid)) {
            setTaggedUsers([...taggedUsers, user]);
        }
        setUserSearchQuery('');
        setUserSearchResults([]);
        setShowUserSearch(false);
    };

    const removeTaggedUser = (uid) => {
        setTaggedUsers(taggedUsers.filter(u => u.uid !== uid));
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
            if (isComparison && (!comparisonTitle1 || !comparisonTitle2)) {
                alert('Per favore inserisci i nomi di entrambe le miscele per il confronto');
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
                taggedUsers: taggedUsers.map(u => u.uid || u.id), // Array of UIDs
                createdAt: new Date().toISOString(),
                commentsCount: 0
            };

            // Add review data if it's a review
            if (postType === 'review') {
                postData.reviewData = {
                    ...reviewData,
                    comparison: isComparison ? {
                        isActive: true,
                        item1: comparisonTitle1,
                        item2: comparisonTitle2
                    } : null
                };
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
            setTaggedUsers([]);
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
                            {/* Comparison Toggle */}
                            <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '8px', border: '1px solid #eee' }}>
                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontWeight: '600', color: '#5D4037', marginBottom: isComparison ? '12px' : '0' }}>
                                    <input
                                        type="checkbox"
                                        checked={isComparison}
                                        onChange={(e) => setIsComparison(e.target.checked)}
                                        style={{ marginRight: '10px', width: '16px', height: '16px', accentColor: '#6F4E37' }}
                                    />
                                    Confronto tra due miscele?
                                </label>

                                {isComparison && (
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input
                                            type="text"
                                            className="post-input"
                                            placeholder="Miscela 1"
                                            value={comparisonTitle1}
                                            onChange={(e) => setComparisonTitle1(e.target.value)}
                                            style={{ flex: 1 }}
                                            required
                                        />
                                        <div style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', color: '#888' }}>VS</div>
                                        <input
                                            type="text"
                                            className="post-input"
                                            placeholder="Miscela 2"
                                            value={comparisonTitle2}
                                            onChange={(e) => setComparisonTitle2(e.target.value)}
                                            style={{ flex: 1 }}
                                            required
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <label htmlFor="review-itemName">Nome articolo *</label>
                                <input
                                    id="review-itemName"
                                    type="text"
                                    className="post-input"
                                    placeholder="es. Ethiopian Yirgacheffe"
                                    value={reviewData.itemName}
                                    onChange={(e) => setReviewData({ ...reviewData, itemName: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="review-itemType">Tipo di articolo</label>
                                <select
                                    id="review-itemType"
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
                                <label htmlFor="review-brand">Marca/Torrefazione (opzionale)</label>
                                <input
                                    id="review-brand"
                                    type="text"
                                    className="post-input"
                                    placeholder="es. Lavazza, Illy..."
                                    value={reviewData.brand}
                                    onChange={(e) => setReviewData({ ...reviewData, brand: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>Valutazione o risultato eventuale confronto*</label>
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
                            placeholder={postType === 'review' ? "Racconta la tua esperienza con dati tencici o molto altro... (es. temperatura, pressione, tempo estrazione)" : "What's on your mind?"}
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

                    {/* User Tagging */}
                    <div className="form-group tag-users-section" style={{ marginBottom: '15px', position: 'relative' }}>
                        <button
                            type="button"
                            className="tag-users-btn"
                            onClick={() => setShowUserSearch(!showUserSearch)}
                            style={{
                                padding: '10px 16px',
                                backgroundColor: '#f5f5f5',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                color: '#6F4E37',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                width: '100%',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e8e8e8'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                        >
                            👥 Tagga Utenti {taggedUsers.length > 0 && `(${taggedUsers.length})`}
                        </button>

                        {/* Tagged Users Display */}
                        {taggedUsers.length > 0 && (
                            <div className="tagged-users-list" style={{
                                marginTop: '10px',
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '8px'
                            }}>
                                {taggedUsers.map(user => (
                                    <div
                                        key={user.uid || user.id}
                                        className="tagged-user-chip"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '6px 10px',
                                            backgroundColor: '#e8f4f8',
                                            border: '1px solid #b8d4e0',
                                            borderRadius: '20px',
                                            fontSize: '13px',
                                            color: '#2c3e50'
                                        }}
                                    >
                                        <img
                                            src={user.profilePic || user.photoURL || "https://cdn-icons-png.flaticon.com/512/847/847969.png"}
                                            alt={user.nickname || user.name}
                                            style={{
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '50%',
                                                objectFit: 'cover'
                                            }}
                                        />
                                        <span>{user.nickname || user.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeTaggedUser(user.uid || user.id)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: '16px',
                                                color: '#888',
                                                padding: '0 2px',
                                                lineHeight: 1
                                            }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* User Search Dropdown */}
                        {showUserSearch && (
                            <div className="user-search-dropdown" style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                backgroundColor: 'white',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                marginTop: '4px',
                                zIndex: 1001,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                maxHeight: '300px',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <div style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                                    <input
                                        type="text"
                                        placeholder="Cerca utente da taggare..."
                                        value={userSearchQuery}
                                        onChange={(e) => setUserSearchQuery(e.target.value)}
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

                                <div style={{ overflowY: 'auto', flex: 1 }}>
                                    {userSearchResults.length > 0 ? (
                                        userSearchResults.map(user => (
                                            <div
                                                key={user.uid || user.id}
                                                onClick={() => addTaggedUser(user)}
                                                className="user-search-result"
                                                style={{
                                                    padding: '10px 12px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                    borderBottom: '1px solid #f0f0f0'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                <img
                                                    src={user.profilePic || user.photoURL || "https://cdn-icons-png.flaticon.com/512/847/847969.png"}
                                                    alt={user.nickname || user.name}
                                                    style={{
                                                        width: '32px',
                                                        height: '32px',
                                                        borderRadius: '50%',
                                                        objectFit: 'cover'
                                                    }}
                                                />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: '500', fontSize: '14px' }}>
                                                        {user.nickname || user.name}
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: '#888' }}>
                                                        {user.role || (user.type === 'bar' ? 'Bar' : user.type === 'roaster' ? 'Torrefazione' : 'Appassionato')}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : userSearchQuery.length > 1 ? (
                                        <div style={{ padding: '12px', color: '#888', textAlign: 'center', fontSize: '14px' }}>
                                            Nessun utente trovato
                                        </div>
                                    ) : (
                                        <div style={{ padding: '12px', color: '#888', textAlign: 'center', fontSize: '14px' }}>
                                            Inizia a digitare per cercare utenti
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
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
