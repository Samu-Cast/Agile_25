import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { uploadMultipleMedia, validateMedia } from '../services/imageService';
import { searchGlobal, getUserCommunities } from '../services/userService';
import { createPost } from '../services/postService';
import CoffeeCupRating from './CoffeeCupRating';
import '../styles/components/CreatePostModal.css';

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
    const [comparisonData, setComparisonData] = useState({
        item1: { name: '', brand: '', file: null, preview: null },
        item2: { name: '', brand: '', file: null, preview: null }
    });

    // Legacy Comparison fields (kept for safety during transition, though not used in new logic)
    const [isComparison, setIsComparison] = useState(false);
    const [comparisonTitle1, setComparisonTitle1] = useState('');
    const [comparisonTitle2, setComparisonTitle2] = useState('');
    // Silence unused warnings
    void setIsComparison; void setComparisonTitle1; void setComparisonTitle2;

    // Event fields
    const [eventDetails, setEventDetails] = useState({
        title: '',
        date: '',
        time: '',
        location: ''
    });

    const { currentUser } = useAuth();

    // Handle separate comparison images
    const handleComparisonImageChange = (e, itemNum) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!validateMedia(file)) return;

        const previewUrl = URL.createObjectURL(file);

        setComparisonData(prev => ({
            ...prev,
            [`item${itemNum}`]: {
                ...prev[`item${itemNum}`],
                file: file,
                preview: previewUrl
            }
        }));
    };

    useEffect(() => {
        const fetchCommunities = async () => {
            if (!currentUser) return;
            try {
                const data = await getUserCommunities(currentUser.uid);
                setCommunities(data);
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

        // Max 5 images + 1 video
        const totalMedia = mediaFiles.length + files.length;
        if (totalMedia > 6) {
            alert('Massimo 6 file (5 immagini + 1 video)');
            e.target.value = ''; // Reset input
            return;
        }

        // Validate each file
        const validFiles = files.filter(file => {
            return validateMedia(file);
        });

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

        if (postType === 'comparison') {
            if (!comparisonData.item1.name || !comparisonData.item2.name) {
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

            // Add event data if it's an event
            if (postType === 'event') {
                if (!eventDetails.title || !eventDetails.date || !eventDetails.time || !eventDetails.location) {
                    alert('Please fill in all event details');
                    setLoading(false);
                    return;
                }
                postData.eventDetails = eventDetails;
                postData.hosts = taggedUsers.map(u => u.uid || u.id); // Tagged users become hosts for events
                // Remove taggedUsers from the main field if we want them distinct, 
                // but strictly speaking, hosts ARE tagged users in this context. 
                // Let's keep them in taggedUsers too for notification purposes if backend logic uses it.
            }

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

            // Add comparison data if it's a comparison
            if (postType === 'comparison') {
                // Upload comparison images if they exist
                let compImg1 = null;
                let compImg2 = null;

                if (comparisonData.item1.file) {
                    console.log('Uploading comparison item 1...');
                    const res = await uploadMultipleMedia([comparisonData.item1.file], 'posts');
                    console.log('Comparison item 1 result:', res);
                    compImg1 = res[0];
                }
                if (comparisonData.item2.file) {
                    console.log('Uploading comparison item 2...');
                    const res = await uploadMultipleMedia([comparisonData.item2.file], 'posts');
                    console.log('Comparison item 2 result:', res);
                    compImg2 = res[0];
                }

                postData.comparisonData = {
                    item1: {
                        name: comparisonData.item1.name,
                        brand: comparisonData.item1.brand,
                        image: compImg1
                    },
                    item2: {
                        name: comparisonData.item2.name,
                        brand: comparisonData.item2.brand,
                        image: compImg2
                    }
                };
            }

            await createPost(postData);

            // Reset form and close modal
            setText('');
            setMediaFiles([]);
            setMediaPreviews([]);
            setReviewData({ itemName: '', itemType: 'coffee', brand: '', rating: 0 });
            setPostType('post');
            setTaggedUsers([]);
            setComparisonData({
                item1: { name: '', brand: '', file: null, preview: null },
                item2: { name: '', brand: '', file: null, preview: null }
            });

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
                    <button
                        type="button"
                        className={`tab-btn ${postType === 'comparison' ? 'active' : ''}`}
                        onClick={() => setPostType('comparison')}
                    >
                        ⚖️ Confronto
                    </button>
                    <button
                        type="button"
                        className={`tab-btn ${postType === 'event' ? 'active' : ''}`}
                        onClick={() => setPostType('event')}
                    >
                        📅 Evento
                    </button>

                </div>

                <form onSubmit={handleSubmit}>
                    {/* Comparison Fields */}
                    {postType === 'comparison' && (
                        <div className="comparison-fields">
                            <div className="comparison-container" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                                {/* Item 1 */}
                                <div className="comparison-item" style={{ flex: 1, padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee' }}>
                                    <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#555' }}>Prodotto 1</h4>

                                    {/* Image Upload 1 */}
                                    <div className="item-image-upload" style={{ marginBottom: '10px', textAlign: 'center' }}>
                                        <input
                                            type="file"
                                            id="comp-img-1"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            onChange={(e) => handleComparisonImageChange(e, 1)}
                                        />
                                        <label htmlFor="comp-img-1" style={{ cursor: 'pointer', display: 'block' }}>
                                            {comparisonData.item1.preview ? (
                                                <div style={{ position: 'relative', width: '100%', paddingTop: '100%', borderRadius: '8px', overflow: 'hidden', border: '2px dashed #ddd' }}>
                                                    <img
                                                        src={comparisonData.item1.preview}
                                                        alt="Preview 1"
                                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '10px', padding: '4px' }}>Cambia foto</div>
                                                </div>
                                            ) : (
                                                <div style={{ width: '100%', padding: '20px 0', border: '2px dashed #ddd', borderRadius: '8px', color: '#888', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                    <span style={{ fontSize: '24px' }}>📷</span>
                                                    <span style={{ fontSize: '12px' }}>Aggiungi Foto</span>
                                                </div>
                                            )}
                                        </label>
                                    </div>

                                    <input
                                        type="text"
                                        className="post-input"
                                        placeholder="Nome prodotto"
                                        value={comparisonData.item1.name}
                                        onChange={(e) => setComparisonData({
                                            ...comparisonData,
                                            item1: { ...comparisonData.item1, name: e.target.value }
                                        })}
                                        required
                                        style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}
                                    />
                                    <input
                                        type="text"
                                        className="post-input"
                                        placeholder="Marca"
                                        value={comparisonData.item1.brand}
                                        onChange={(e) => setComparisonData({
                                            ...comparisonData,
                                            item1: { ...comparisonData.item1, brand: e.target.value }
                                        })}
                                        style={{ fontSize: '12px' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', fontWeight: '900', color: '#ccc', fontStyle: 'italic', fontSize: '20px' }}>VS</div>

                                {/* Item 2 */}
                                <div className="comparison-item" style={{ flex: 1, padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee' }}>
                                    <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#555' }}>Prodotto 2</h4>

                                    {/* Image Upload 2 */}
                                    <div className="item-image-upload" style={{ marginBottom: '10px', textAlign: 'center' }}>
                                        <input
                                            type="file"
                                            id="comp-img-2"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            onChange={(e) => handleComparisonImageChange(e, 2)}
                                        />
                                        <label htmlFor="comp-img-2" style={{ cursor: 'pointer', display: 'block' }}>
                                            {comparisonData.item2.preview ? (
                                                <div style={{ position: 'relative', width: '100%', paddingTop: '100%', borderRadius: '8px', overflow: 'hidden', border: '2px dashed #ddd' }}>
                                                    <img
                                                        src={comparisonData.item2.preview}
                                                        alt="Preview 2"
                                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '10px', padding: '4px' }}>Cambia foto</div>
                                                </div>
                                            ) : (
                                                <div style={{ width: '100%', padding: '20px 0', border: '2px dashed #ddd', borderRadius: '8px', color: '#888', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                    <span style={{ fontSize: '24px' }}>📷</span>
                                                    <span style={{ fontSize: '12px' }}>Aggiungi Foto</span>
                                                </div>
                                            )}
                                        </label>
                                    </div>

                                    <input
                                        type="text"
                                        className="post-input"
                                        placeholder="Nome prodotto"
                                        value={comparisonData.item2.name}
                                        onChange={(e) => setComparisonData({
                                            ...comparisonData,
                                            item2: { ...comparisonData.item2, name: e.target.value }
                                        })}
                                        required
                                        style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}
                                    />
                                    <input
                                        type="text"
                                        className="post-input"
                                        placeholder="Marca"
                                        value={comparisonData.item2.brand}
                                        onChange={(e) => setComparisonData({
                                            ...comparisonData,
                                            item2: { ...comparisonData.item2, brand: e.target.value }
                                        })}
                                        style={{ fontSize: '12px' }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Event Fields */}
                    {postType === 'event' && (
                        <div className="event-fields" style={{ marginBottom: '15px' }}>
                            <input
                                type="text"
                                className="post-input"
                                placeholder="Titolo Evento"
                                value={eventDetails.title}
                                onChange={(e) => setEventDetails({ ...eventDetails, title: e.target.value })}
                                required
                                style={{ marginBottom: '10px', fontWeight: 'bold' }}
                            />
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                <input
                                    type="date"
                                    className="post-input"
                                    value={eventDetails.date}
                                    onChange={(e) => setEventDetails({ ...eventDetails, date: e.target.value })}
                                    required
                                    style={{ flex: 1 }}
                                />
                                <input
                                    type="time"
                                    className="post-input"
                                    value={eventDetails.time}
                                    onChange={(e) => setEventDetails({ ...eventDetails, time: e.target.value })}
                                    required
                                    style={{ flex: 1 }}
                                />
                            </div>
                            <input
                                type="text"
                                className="post-input"
                                placeholder="Luogo (es. Via Roma 1, Milano)"
                                value={eventDetails.location}
                                onChange={(e) => setEventDetails({ ...eventDetails, location: e.target.value })}
                                required
                            />
                        </div>
                    )}


                    {/* Review-specific fields */}
                    {postType === 'review' && (
                        <div className="review-fields">
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
                            placeholder={postType === 'comparison' ? "Descrivi le differenze, i pro e i contro..." : postType === 'review' ? "Racconta la tua esperienza..." : "What's on your mind?"}
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
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Media upload (Only for non-comparison posts) */}
                    {postType !== 'comparison' && (
                        <div className="form-group">
                            <label htmlFor="modal-media" className="image-upload-label">
                                {mediaPreviews.length > 0 ? `${mediaPreviews.length} file selezionati` : (postType === 'event' ? "📸 Aggiungi Foto Copertina" : "📸 Aggiungi Foto/Video (Opzionale)")}
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
                    )}

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
                            👥 {postType === 'event' ? 'Tagga Organizzatori/Host' : 'Tagga Utenti'} {taggedUsers.length > 0 && `(${taggedUsers.length})`}
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
                    {mediaPreviews.length > 0 && postType !== 'comparison' && (
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
                                        aria-label="Remove media"
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
                            {loading ? 'Posting...' : postType === 'review' ? 'Pubblica Recensione' : postType === 'comparison' ? 'Pubblica Confronto' : 'Post'}
                        </button>
                    </div>
                </form>
            </div>
        </div >
    );
}

export default CreatePostModal;
