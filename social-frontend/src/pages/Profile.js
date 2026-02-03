import React, { useState, useRef, useEffect } from 'react';
import Swal from 'sweetalert2';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUserData, useRoleData } from '../hooks/useUserData';
import { getUserVotedPosts, getUserComments, getUserPosts, getUserSavedPosts, deletePost, getUserEvents } from '../services/postService';
import { searchUsers, getUsersByUids, updateUserProfile, createRoleProfile, updateRoleProfile, followUser, unfollowUser, checkFollowStatus, getUser, getRoleProfile, getRoasteryProducts, createProduct, deleteProduct } from '../services/userService';
import { validateImage } from '../services/imageService';
import { getCollections, createCollection, deleteCollection, updateCollection, getUserSavedCollections, saveCollection, unsaveCollection } from '../services/collectionService';
import { getUserCommunities } from '../services/communityService';
import CollectionManager from '../components/CollectionManager';
import PostCard from '../components/PostCard';
import '../styles/pages/Profile.css';

// Default images - eslint-disable-next-line to prevent unused variable warnings
// These may be used in dynamic post rendering
// eslint-disable-next-line no-unused-vars
import defaultPostImage from '../image_post/defaults/default_post.png';

// Carousel Component
const CollectionCarousel = ({ images }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleNext = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const handlePrev = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    if (!images || images.length === 0) return null;

    return (
        <div className="carousel-container">
            <img
                src={images[currentIndex]}
                alt="Product"
                className="carousel-image"
            />
            {images.length > 1 && (
                <>
                    <button className="carousel-btn prev" onClick={handlePrev}>‹</button>
                    <button className="carousel-btn next" onClick={handleNext}>›</button>
                    <div className="carousel-dots">
                        {images.map((_, idx) => (
                            <span
                                key={idx}
                                className={`carousel-dot ${idx === currentIndex ? 'active' : ''}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/847/847969.png";
// eslint-disable-next-line no-unused-vars
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function Profile() {
    const { uid } = useParams(); // Get uid from URL
    const { currentUser } = useAuth();
    const currentUserData = useUserData(); // Data for the logged-in user
    const currentUserRoleData = useRoleData(currentUserData);

    // State for the profile being viewed
    const [profileUser, setProfileUser] = useState(null);
    const [profileRoleData, setProfileRoleData] = useState(null);

    // Determine if we are viewing our own profile
    const isOwnProfile = !uid || (currentUser && uid === currentUser.uid);

    useEffect(() => {
        const fetchProfileData = async () => {
            if (isOwnProfile) {
                setProfileUser(currentUserData);
                setProfileRoleData(currentUserRoleData);
            } else {
                // Fetch other user's data
                if (uid) {
                    const user = await getUser(uid);
                    setProfileUser(user);

                    // Fetch role data if applicable
                    if (user && user.role && (user.role === 'Bar' || user.role.toLowerCase() === 'torrefazione')) {
                        const collectionName = user.role === 'Bar' ? 'bars' : 'roasteries';
                        const roleData = await getRoleProfile(collectionName, uid);
                        setProfileRoleData(roleData);
                    } else {
                        setProfileRoleData(null);
                    }
                }
            }
        };

        fetchProfileData();
    }, [uid, currentUserData, currentUserRoleData, isOwnProfile]);

    // Cleanup/Reset state when moving between profiles
    useEffect(() => {
        // Reset all data states
        setMyPosts([]);
        setVotedPosts([]);
        setMyReviews([]);
        setMyComparisons([]);
        setMyComments([]);
        setSavedPosts([]);
        setSavedGuides([]);
        setSavedCollections([]);
        setUserCommunities([]);
        setMyEvents([]);

        setRoasteryProducts([]);
        setRoasteryCollections([]);

        // Reset tab to default to avoid being stuck on an unavailable tab (e.g. collections for simple user)
        setActiveTab('posts');
    }, [uid]);

    // Use profileUser and profileRoleData for rendering
    const user = profileUser;
    const roleData = profileRoleData;


    const [activeTab, setActiveTab] = useState('posts');
    const [isEditing, setIsEditing] = useState(false);

    // Appassionato Data State
    const [myPosts, setMyPosts] = useState([]);
    const [votedPosts, setVotedPosts] = useState([]);
    const [myReviews, setMyReviews] = useState([]);
    const [myComparisons, setMyComparisons] = useState([]);
    const [myComments, setMyComments] = useState([]);
    const [savedPosts, setSavedPosts] = useState([]);
    const [, setSavedGuides] = useState([]);
    const [savedCollections, setSavedCollections] = useState([]);
    const [, setUserCommunities] = useState([]);
    const [myEvents, setMyEvents] = useState([]);

    // Barista Association State
    const [associatedBaristas, setAssociatedBaristas] = useState([]);
    const [baristaSearchQuery, setBaristaSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedBaristas, setSelectedBaristas] = useState([]); // For edit form

    // Follow System State
    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);

    // Collection Filter/Sort State
    const [filterOccasion, setFilterOccasion] = useState('');
    const [sortPriceOrder, setSortPriceOrder] = useState(''); // 'asc' or 'desc' or ''

    // Helper to calc price
    const calculateCollectionPrice = (collection) => {
        if (!collection.products || collection.products.length === 0) return 0;
        return collection.products.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0);
    };

    // Load user's posts and reviews
    useEffect(() => {
        const loadUserPosts = async () => {
            if (!user) return;
            try {
                const userPosts = await getUserPosts(user.uid, currentUser?.uid);

                // Collect all UIDs to fetch (authors + tagged users + hosts)
                const uidsToCheck = new Set(userPosts.map(p => p.uid));
                userPosts.forEach(p => {
                    if (p.taggedUsers && Array.isArray(p.taggedUsers)) {
                        p.taggedUsers.forEach(uid => uidsToCheck.add(uid));
                    }
                    if (p.hosts && Array.isArray(p.hosts)) {
                        p.hosts.forEach(uid => uidsToCheck.add(uid));
                    }
                });

                // Fetch all related users
                const allRelatedUsers = await getUsersByUids([...uidsToCheck]);
                const userMap = {};
                allRelatedUsers.forEach(u => {
                    userMap[u.uid] = u;
                });

                // Map data to match PostCard expected format (like Home.js)
                const formattedPosts = userPosts.map(p => {
                    const author = userMap[p.uid] || { nickname: user.nickname || user.name, profilePic: user.profilePic || user.photoURL };

                    // Resolve tagged users data
                    const taggedUsersData = (p.taggedUsers || []).map(uid => userMap[uid]).filter(Boolean);

                    return {
                        ...p,
                        author: author.nickname || author.name,
                        authorAvatar: author.profilePic || author.photoURL,
                        authorId: p.uid,
                        content: p.text || p.content,
                        image: p.imageUrl || null,
                        mediaUrls: p.mediaUrls || [],
                        time: p.createdAt ? new Date(p.createdAt).toLocaleString() : 'Just now',
                        taggedUsersData: taggedUsersData
                    };
                });

                // Separate posts from reviews and comparisons
                const posts = formattedPosts.filter(p => !p.type || p.type === 'post');
                const reviews = formattedPosts.filter(p => p.type === 'review');
                const comparisons = formattedPosts.filter(p => p.type === 'comparison');

                setMyPosts(posts);
                setMyReviews(reviews);
                setMyComparisons(comparisons);
            } catch (error) {
                console.error('Error loading user posts:', error);
            }
        };

        loadUserPosts();
    }, [user, currentUser?.uid]);

    // Product System State (for Torrefazione)
    const [roasteryProducts, setRoasteryProducts] = useState([]);
    const [roasteryCollections, setRoasteryCollections] = useState([]);
    const [showCollectionModal, setShowCollectionModal] = useState(false);
    const [editingCollection, setEditingCollection] = useState(null);
    const [isAddingProduct, setIsAddingProduct] = useState(false);
    const [newProduct, setNewProduct] = useState({
        name: '',
        description: '',
        price: '',
        imageUrl: ''
    });
    const [newProductImageFile, setNewProductImageFile] = useState(null);
    const [, setIsSubmitting] = useState(false);

    // Edit Form State
    const [editForm, setEditForm] = useState({
        name: '',
        nickname: '',
        bio: '',
        profilePic: ''
    });

    useEffect(() => {
        if (user && isOwnProfile) {
            setEditForm({
                name: user.name || '',
                nickname: user.nickname || '',
                bio: user.bio || '',
                profilePic: user.profilePic || DEFAULT_AVATAR,

                // Role specific data (merged from roleData if available)
                location: roleData?.city || user.location || '', // 'city' for Bar/Roastery, 'location' for User
                address: roleData?.address || '',
                openingHours: roleData?.openingHours || '',
                description: roleData?.description || '', // Bar/Roastery description
                imageCover: roleData?.imageCover || '',
            });

            // Fetch associated baristas for display
            if (user.role === 'Bar' && roleData?.baristas && roleData.baristas.length > 0) {
                getUsersByUids(roleData.baristas).then(users => {
                    setAssociatedBaristas(users);
                    setSelectedBaristas(users); // Sync edit state too
                });
            } else {
                setAssociatedBaristas([]);
                setSelectedBaristas([]);
            }
        }
    }, [user, roleData, isOwnProfile]);

    // Check Follow Status and Counts
    useEffect(() => {
        if (currentUser && user && currentUser.uid !== user.uid) {
            checkFollowStatus(currentUser.uid, user.uid).then(status => {
                setIsFollowing(status.isFollowing);
            });
        }
        if (user) {
            // Initialize counts from user stats or defaults
            setFollowersCount(user.stats?.followers || 0);
            setFollowingCount(user.stats?.following || 0);
        }
    }, [currentUser, user]);

    const handleFollowToggle = async () => {
        if (!currentUser || !user) return;

        const originalIsFollowing = isFollowing;
        const originalFollowersCount = followersCount;

        // Optimistic Update
        setIsFollowing(!isFollowing);
        setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);

        try {
            if (isFollowing) {
                await unfollowUser(user.uid, currentUser.uid);
            } else {
                await followUser(user.uid, currentUser.uid);
            }
        } catch (error) {
            console.error("Error toggling follow:", error);
            // Revert on error
            setIsFollowing(originalIsFollowing);
            setFollowersCount(originalFollowersCount);
        }
    };

    const handleEditClick = () => {
        setEditForm({
            name: user.name || '',
            nickname: user.nickname || '',
            bio: user.bio || '',
            profilePic: user.profilePic || DEFAULT_AVATAR,
            location: roleData?.city || user.location || '',
            address: roleData?.address || '',
            openingHours: roleData?.openingHours || '',
            description: roleData?.description || user.bio || '',
            imageCover: roleData?.imageCover || '',
        });

        // Load associated baristas for edit form
        if (user.role === 'Bar' && roleData?.baristas) {
            // We need to fetch the user objects for these UIDs
            getUsersByUids(roleData.baristas).then(users => {
                setSelectedBaristas(users);
                setAssociatedBaristas(users); // Also set for display
            });
        } else {
            setSelectedBaristas([]); // Clear if not a barista or no baristas
            setAssociatedBaristas([]);
        }
        setIsEditing(true);
    };

    const handleCloseDrawer = () => {
        setIsEditing(false);
    };

    const handleSave = async () => {
        if (!currentUser || !user) {
            console.error("No current user or user data");
            return;
        }

        try {
            // 1. Update User Basic Info
            await updateUserProfile(currentUser.uid, {
                name: editForm.name,
                nickname: editForm.nickname,
                bio: editForm.bio,
                profilePic: editForm.profilePic,
                // For Appassionato, location is stored in user doc
                ...(user.role === 'Appassionato' ? { location: editForm.location } : {})
            });

            // 2. Update Role Specific Info (Bar or Roastery)
            if (user.role === 'Bar' || (user.role && user.role.toLowerCase() === 'torrefazione')) {
                const collectionName = user.role === 'Bar' ? 'bars' : ((user.role && user.role.toLowerCase() === 'torrefazione') ? 'roasteries' : null);
                if (!collectionName) return;

                const roleSpecificData = {
                    name: editForm.name,
                    city: editForm.location,
                    description: editForm.description || editForm.bio,
                    imageCover: editForm.imageCover,
                    ownerUid: currentUser.uid,
                    // Specifics
                    ...(user.role === 'Bar' ? {
                        address: editForm.address,
                        openingHours: editForm.openingHours,
                        baristas: selectedBaristas.map(u => u.uid) // Save UIDs
                    } : {}),
                    ...(user.role === 'Torrefazione' ? {
                        // products count etc are stats, not editable here usually
                    } : {})
                };

                if (roleData && roleData.id) {
                    // Update existing
                    await updateRoleProfile(collectionName, roleData.id, roleSpecificData);
                } else {
                    // Create new
                    await createRoleProfile(collectionName, {
                        ...roleSpecificData,
                        createdAt: new Date(), // Backend might handle this, but sending it is fine or let backend default
                        stats: { posts: 0, reviews: 0, avgRating: 0, ...(user.role === 'Torrefazione' ? { products: 0 } : {}) }
                    });
                }
            }

            setIsEditing(false);
            // Refresh data? useUserData hook should handle it if it polls or we trigger a refresh.
            // Since we removed onSnapshot, we might need to manually trigger refresh or reload page.
            // For now, let's reload page or assume user accepts a refresh.
            // Ideally we'd have a context method to refresh user data.
            window.location.reload();
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Errore durante il salvataggio.");
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const fileInputRef = useRef(null);

    const handleImageClick = () => {
        fileInputRef.current.click();
    };

    const handleBaristaSearch = async (e) => {
        const query = e.target.value;
        setBaristaSearchQuery(query);
        if (query.length > 1) {
            const results = await searchUsers(query, 'Barista');
            // Filter out already selected users and self
            const filtered = results.filter(r =>
                r.uid !== currentUser.uid &&
                !selectedBaristas.find(s => s.uid === r.uid)
            );
            setSearchResults(filtered);
            if (filtered.length === 0) {
            }
        } else {
            setSearchResults([]);
        }
    };

    const addBarista = (barista) => {
        setSelectedBaristas([...selectedBaristas, barista]);
        setBaristaSearchQuery('');
        setSearchResults([]);
    };

    const removeBarista = (uid) => {
        setSelectedBaristas(selectedBaristas.filter(b => b.uid !== uid));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                // setUser(prev => ({ ...prev, profilePic: reader.result })); // Removed local set
                setEditForm(prev => ({ ...prev, profilePic: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleProductInputChange = (e) => {
        const { name, value } = e.target;
        setNewProduct(prev => ({ ...prev, [name]: value }));
    };

    const handleProductImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!validateImage(file)) return;
            setNewProductImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewProduct(prev => ({ ...prev, imageUrl: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCreateProduct = async () => {
        if (!roleData || !roleData.id) return;
        setIsSubmitting(true);
        try {
            const productData = {
                ...newProduct,
                image: newProductImageFile // Pass the raw File object
            };

            await createProduct(roleData.id, productData);

            setIsAddingProduct(false);
            setNewProduct({ name: '', description: '', price: '', imageUrl: '' });
            setNewProductImageFile(null);

            // Refresh products
            const products = await getRoasteryProducts(roleData.id);
            setRoasteryProducts(products);
            alert("Prodotto aggiunto con successo!");
        } catch (error) {
            console.error("Error creating product:", error);
            alert("Errore durante l'aggiunta del prodotto: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };


    const handleDeletePost = async (postId, e) => {
        e.stopPropagation(); // Prevent navigating to post details if clicking container

        const result = await Swal.fire({
            title: 'Sei sicuro?',
            text: "Non potrai annullare questa azione!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sì, elimina!',
            cancelButtonText: 'Annulla'
        });

        if (!result.isConfirmed) {
            return;
        }

        // Optimistic update
        const originalPosts = [...myPosts];
        const originalReviews = [...myReviews];
        const originalComparisons = [...myComparisons];

        setMyPosts(prev => prev.filter(p => p.id !== postId));
        setMyReviews(prev => prev.filter(p => p.id !== postId));
        setMyComparisons(prev => prev.filter(p => p.id !== postId));
        setMyEvents(prev => prev.filter(p => p.id !== postId));

        try {
            await deletePost(postId, currentUser.uid); // Use service
        } catch (error) {
            console.error("Error deleting post:", error);
            alert("Errore durante l'eliminazione del post.");
            setMyPosts(originalPosts);
            setMyReviews(originalReviews);
            setMyComparisons(originalComparisons);
        }
    };


    // Fetch Data based on Role and Tab
    useEffect(() => {
        // If viewing another profile, we might want to fetch THEIR posts
        // For now, let's assume we fetch posts authored by the profileUser
        if (!user) return;

        const fetchData = async () => {
            // Note: posts and reviews are now loaded by the first useEffect (lines 85-103)
            // which properly filters them by type
            const enrichPosts = async (postsToEnrich) => {
                const uids = new Set(postsToEnrich.map(p => p.uid));
                postsToEnrich.forEach(p => {
                    if (p.taggedUsers && Array.isArray(p.taggedUsers)) {
                        p.taggedUsers.forEach(uid => uids.add(uid));
                    }
                    if (p.hosts && Array.isArray(p.hosts)) {
                        p.hosts.forEach(uid => uids.add(uid));
                    }
                });

                const users = await getUsersByUids([...uids]);
                const userMap = {};
                users.forEach(u => {
                    userMap[u.uid] = u;
                });

                return postsToEnrich.map(p => {
                    const author = userMap[p.uid];
                    const taggedUsersData = (p.taggedUsers || []).map(uid => userMap[uid]).filter(Boolean);

                    return {
                        ...p,
                        author: author?.nickname || author?.name || "Utente",
                        authorAvatar: author?.profilePic || author?.photoURL || DEFAULT_AVATAR,
                        time: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'Data sconosciuta',
                        taggedUsersData
                    };
                });
            };

            if (activeTab === 'votes') {
                if (isOwnProfile) {
                    const up = await getUserVotedPosts(user.uid, 1);
                    const down = await getUserVotedPosts(user.uid, -1);
                    // Merge and add type
                    const upEnriched = await enrichPosts(up);
                    const downEnriched = await enrichPosts(down);

                    const upMapped = upEnriched.map(p => ({ ...p, voteType: 'up' }));
                    const downMapped = downEnriched.map(p => ({ ...p, voteType: 'down' }));

                    const allVoted = [...upMapped, ...downMapped];
                    allVoted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                    setVotedPosts(allVoted);
                }
            } else if (activeTab === 'events') {
                const events = await getUserEvents(user.uid);
                const enrichedEvents = await enrichPosts(events);
                setMyEvents(enrichedEvents);
            }
            else if (activeTab === 'comments') {
                const comments = await getUserComments(user.uid);
                setMyComments(comments);
            } else if (activeTab === 'savedPosts') {
                if (isOwnProfile) {
                    const posts = await getUserSavedPosts(user.uid);

                    // Fetch author names for saved posts
                    const uids = [...new Set(posts.map(p => p.uid))];
                    const users = await getUsersByUids(uids);
                    const userMap = {};
                    users.forEach(u => {
                        userMap[u.uid] = u.nickname || u.name;
                    });

                    // Map to PostCard format
                    const formattedPosts = posts.map(p => ({
                        ...p,
                        author: userMap[p.uid] || p.uid,
                        authorName: userMap[p.uid] || p.uid,
                        title: p.text ? (p.text.substring(0, 50) + (p.text.length > 50 ? "..." : "")) : "No Title",
                        content: p.text,
                        image: p.imageUrl,
                        votes: p.likesCount || 0,
                        comments: p.commentsCount || 0,
                        time: p.time || new Date(p.createdAt).toLocaleDateString()
                    }));

                    setSavedPosts(formattedPosts.map(p => ({ ...p, isSaved: true })));
                }
            } else if (activeTab === 'products' && user.role && user.role.toLowerCase() === 'torrefazione') {
                if (roleData && roleData.id) {
                    const products = await getRoasteryProducts(roleData.id);
                    setRoasteryProducts(products);
                }
            } else if (activeTab === 'collections' && user.role && user.role.toLowerCase() === 'torrefazione') {
                if (roleData && roleData.id) {
                    const collections = await getCollections(roleData.id);
                    setRoasteryCollections(collections);
                    const products = await getRoasteryProducts(roleData.id);
                    setRoasteryProducts(products);
                }
            } else if (activeTab === 'savedCollections') {
                if (isOwnProfile) {
                    const collections = await getUserSavedCollections(user.uid);
                    setSavedCollections(collections);
                }
            } else if (activeTab === 'communities') {
                // Keep for legacy/fallback if needed, but not in main tabs anymore
                const communities = await getUserCommunities(user.uid);
                setUserCommunities(communities);
            }
        };

        fetchData();
    }, [activeTab, user, isOwnProfile, roleData]);

    const guides = [];

    const handleSaveCollection = async (collectionData) => {
        try {
            // Keep track of promoted collections (local state) to restore after refresh
            const promotedIds = new Set(roasteryCollections.filter(c => c.isPromoted).map(c => c.id));

            if (editingCollection) {
                await updateCollection(roleData.id, editingCollection.id, collectionData);
                Swal.fire('Success', 'Collezione aggiornata!', 'success');
            } else {
                await createCollection(roleData.id, collectionData);
                Swal.fire('Success', 'Collezione creata!', 'success');
            }
            setShowCollectionModal(false);
            setEditingCollection(null);

            // Refresh collections from backend
            const cols = await getCollections(roleData.id);

            // Restore local promotion state and sort
            const mergedCols = cols.map(c => ({
                ...c,
                isPromoted: promotedIds.has(c.id)
            })).sort((a, b) => {
                if (a.isPromoted && !b.isPromoted) return -1;
                if (!a.isPromoted && b.isPromoted) return 1;
                return 0;
            });

            setRoasteryCollections(mergedCols);
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Operazione fallita', 'error');
        }
    };

    const handleDeleteCollection = async (collectionId) => {
        try {
            const result = await Swal.fire({
                title: 'Sei sicuro?',
                text: "Non potrai tornare indietro!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sì, elimina!'
            });

            if (result.isConfirmed) {
                // Keep track of promoted collections
                const promotedIds = new Set(roasteryCollections.filter(c => c.isPromoted).map(c => c.id));
                promotedIds.delete(collectionId); // Remove deleted one

                await deleteCollection(roleData.id, collectionId, currentUser.uid);
                Swal.fire('Deleted!', 'La collezione è stata eliminata.', 'success');

                // Refresh
                const cols = await getCollections(roleData.id);

                // Restore local promotion state and sort
                const mergedCols = cols.map(c => ({
                    ...c,
                    isPromoted: promotedIds.has(c.id)
                })).sort((a, b) => {
                    if (a.isPromoted && !b.isPromoted) return -1;
                    if (!a.isPromoted && b.isPromoted) return 1;
                    return 0;
                });

                setRoasteryCollections(mergedCols);
            }
        } catch (error) {
            Swal.fire('Error', 'Eliminazione fallita', 'error');
        }
    };

    const openCollectionModal = (collection = null) => {
        setEditingCollection(collection);
        setShowCollectionModal(true);
    };

    // Toggle collection promotion - local state only, promoted ones sorted first
    const handleTogglePromote = (collection) => {
        setRoasteryCollections(prev => {
            // Toggle the isPromoted status
            const updated = prev.map(col =>
                col.id === collection.id
                    ? { ...col, isPromoted: !col.isPromoted }
                    : col
            );
            // Sort: promoted first
            return updated.sort((a, b) => {
                if (a.isPromoted && !b.isPromoted) return -1;
                if (!a.isPromoted && b.isPromoted) return 1;
                return 0;
            });
        });
    };

    // Show collection details popup for non-owners (with save option)
    const showCollectionDetails = async (collection) => {
        // Get full product details
        const products = collection.products?.map(prodId =>
            roasteryProducts.find(p => p.id === prodId)
        ).filter(Boolean) || [];

        // Calculate total cost
        const totalCost = products.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0);

        // Check if collection is already saved
        const isSaved = savedCollections.some(sc => sc.id === collection.id);

        // Build products list HTML
        const productsHtml = products.length > 0
            ? products.map(p => `
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                    <span>${p.name}</span>
                    <strong>€${p.price || '0'}</strong>
                </div>
            `).join('')
            : '<p style="color: #888;">Nessun prodotto in questa collezione</p>';

        const result = await Swal.fire({
            title: collection.name,
            html: `
                <div style="text-align: center;">
                    <p style="color: #666; margin-bottom: 16px;">${collection.description || 'Nessuna descrizione'}</p>
                    <h4 style="margin-bottom: 8px;">Prodotti (${products.length})</h4>
                    <div style="max-height: 200px; overflow-y: auto;">
                        ${productsHtml}
                    </div>
                    <div style="margin-top: 16px; padding-top: 16px; border-top: 2px solid #6F4E37; display: flex; justify-content: space-between;">
                        <strong>Totale</strong>
                        <strong style="color: #6F4E37; font-size: 18px;">€${totalCost.toFixed(2)}</strong>
                    </div>
                </div>
            `,
            showCloseButton: true,
            showConfirmButton: currentUser && !isOwnProfile && !isSaved,
            confirmButtonText: '💾 Salva Collezione',
            confirmButtonColor: '#6F4E37',
            showDenyButton: currentUser && !isOwnProfile && isSaved,
            denyButtonText: '✖ Rimuovi dai salvati',
            denyButtonColor: '#d33',
            width: 400
        });

        if (result.isConfirmed && currentUser && roleData) {
            try {
                await saveCollection(currentUser.uid, roleData.id, collection.id);
                Swal.fire('Salvata!', 'Collezione salvata nel tuo profilo.', 'success');
                // Refresh saved collections list
                const collections = await getUserSavedCollections(currentUser.uid);
                setSavedCollections(collections);
            } catch (error) {
                Swal.fire('Errore', 'Impossibile salvare la collezione.', 'error');
            }
        } else if (result.isDenied && currentUser) {
            try {
                await unsaveCollection(currentUser.uid, collection.id);
                Swal.fire('Rimossa!', 'Collezione rimossa dai salvati.', 'success');
                const collections = await getUserSavedCollections(currentUser.uid);
                setSavedCollections(collections);
            } catch (error) {
                Swal.fire('Errore', 'Impossibile rimuovere la collezione.', 'error');
            }
        }
    };

    // Show saved collection details popup (with unsave option)
    const showSavedCollectionDetails = async (collection) => {
        const products = collection.products || [];
        const totalCost = products.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0);

        const productsHtml = products.length > 0
            ? products.map(p => `
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                    <span>${p.name}</span>
                    <strong>€${p.price || '0'}</strong>
                </div>
            `).join('')
            : '<p style="color: #888;">Nessun prodotto in questa collezione</p>';

        const result = await Swal.fire({
            title: collection.name,
            html: `
                <div style="text-align: center;">
                    <p style="color: #888; font-size: 12px; margin-bottom: 8px;">di ${collection.roasterName}</p>
                    <p style="color: #666; margin-bottom: 16px;">${collection.description || 'Nessuna descrizione'}</p>
                    <h4 style="margin-bottom: 8px;">Prodotti (${products.length})</h4>
                    <div style="max-height: 200px; overflow-y: auto;">
                        ${productsHtml}
                    </div>
                    <div style="margin-top: 16px; padding-top: 16px; border-top: 2px solid #6F4E37; display: flex; justify-content: space-between;">
                        <strong>Totale</strong>
                        <strong style="color: #6F4E37; font-size: 18px;">€${totalCost.toFixed(2)}</strong>
                    </div>
                </div>
            `,
            showCloseButton: true,
            showConfirmButton: true,
            confirmButtonText: '✖ Rimuovi dai salvati',
            confirmButtonColor: '#d33',
            width: 400
        });

        if (result.isConfirmed && currentUser) {
            try {
                await unsaveCollection(currentUser.uid, collection.id);
                setSavedCollections(prev => prev.filter(c => c.id !== collection.id));
                Swal.fire('Rimossa!', 'Collezione rimossa dai salvati.', 'success');
            } catch (error) {
                Swal.fire('Errore', 'Impossibile rimuovere la collezione.', 'error');
            }
        }
    };

    const handleDeleteProduct = async (productId, e) => {
        e.stopPropagation();

        const result = await Swal.fire({
            title: 'Elimina prodotto',
            text: "Sei sicuro di voler rimuovere questo prodotto?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Elimina',
            cancelButtonText: 'Annulla'
        });

        if (result.isConfirmed) {
            try {
                await deleteProduct(currentUserRoleData.id, productId);
                setRoasteryProducts(prev => prev.filter(p => p.id !== productId));
                Swal.fire('Eliminato!', 'Il prodotto è stato rimosso.', 'success');
            } catch (error) {
                console.error("Error deleting product:", error);
                Swal.fire('Errore', 'Impossibile eliminare il prodotto.', 'error');
            }
        }
    };

    // Shared List Renderer for Posts (My Posts, Upvoted, Downvoted, Saved)
    const renderPostGrid = (posts, emptyMessage = "Nessun post trovato.") => (
        <div className="profile-feed">
            {posts.length > 0 ? posts.map(post => (
                <PostCard
                    key={post.id}
                    post={post}
                    currentUser={currentUser}
                    isLoggedIn={!!currentUser}
                    onDelete={isOwnProfile && activeTab === 'posts' ? handleDeletePost : undefined}
                />
            )) : (
                <div className="empty-state">{emptyMessage}</div>
            )}
        </div>
    );

    const renderContent = () => {
        let data = [];
        // type variable removed - unused

        // Format posts data for display
        if (activeTab === 'posts') {
            return renderPostGrid(myPosts, "Nessun post trovato.");
        }

        if (activeTab === 'events') {
            return (
                <div className="profile-feed">
                    {myEvents.length > 0 ? myEvents.map(post => (
                        <PostCard
                            key={post.id}
                            post={post}
                            currentUser={currentUser}
                            isLoggedIn={!!currentUser}
                            onDelete={isOwnProfile ? handleDeletePost : undefined}
                        />
                    )) : (
                        <div className="empty-state">Nessun evento in programma.</div>
                    )}
                </div>
            );
        }

        if (activeTab === 'guides') {
            // Mock guides for now, or fetch if implemented
            data = guides;
        }

        if (activeTab === 'votes') {
            // Already mapped to display-like objects in fetchData, 
            // but here we might need to render them as posts.
            // Reusing renderPostGrid for consistency
            return renderPostGrid(votedPosts, "Nessun post votato.");
        }


        if (activeTab === 'reviews') {
            return renderPostGrid(myReviews, "Nessuna recensione trovata.");
        }

        if (activeTab === 'comparisons') {
            return renderPostGrid(myComparisons, "Nessun confronto trovato.");
        }

        if (data.length === 0 && activeTab !== 'products' && activeTab !== 'collections' && activeTab !== 'comments' && activeTab !== 'savedCollections') {
            return <div className="empty-state">Nessun contenuto trovato.</div>;
        }

        if (activeTab === 'comments') {
            return (
                <div className="profile-comments-list">
                    {myComments.map(item => (
                        <div key={item.id} className="profile-comment-item">
                            {item.postTitle && (
                                <p className="comment-post-title">
                                    Su: <strong>{item.postTitle}</strong>
                                </p>
                            )}
                            <p className="comment-text">"{item.text}"</p>
                            <span className="comment-date">
                                {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Date unknown'}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }

        if (activeTab === 'savedPosts') return renderPostGrid(savedPosts, "Nessun post salvato.");

        if (activeTab === 'savedCollections') {
            // Filter Logic
            let filtered = [...savedCollections];
            if (filterOccasion) {
                filtered = filtered.filter(c => c.occasion === filterOccasion);
            }
            // Sort Logic
            if (sortPriceOrder) {
                filtered.sort((a, b) => {
                    const priceA = calculateCollectionPrice(a);
                    const priceB = calculateCollectionPrice(b);
                    return sortPriceOrder === 'asc' ? priceA - priceB : priceB - priceA;
                });
            }

            return (
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                    {/* Filter Sidebar */}
                    <div style={{
                        width: '250px',
                        flexShrink: 0,
                        padding: '20px',
                        background: '#fff',
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        position: 'sticky',
                        top: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px'
                    }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#6F4E37' }}>Filtri</h4>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#555' }}>Occasione</label>
                            <select
                                value={filterOccasion}
                                onChange={(e) => setFilterOccasion(e.target.value)}
                                style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd', width: '100%' }}
                            >
                                <option value="">Tutte</option>
                                <option value="Festa del Papà">Festa del Papà</option>
                                <option value="Colazione">Colazione</option>
                                <option value="Pausa Caffè">Pausa Caffè</option>
                                <option value="Dopo Cena">Dopo Cena</option>
                                <option value="Regalo">Regalo</option>
                                <option value="Degustazione">Degustazione</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#555' }}>Ordina per Prezzo</label>
                            <select
                                value={sortPriceOrder}
                                onChange={(e) => setSortPriceOrder(e.target.value)}
                                style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd', width: '100%' }}
                            >
                                <option value="">Nessun ordine</option>
                                <option value="asc">Crescente (Low to High)</option>
                                <option value="desc">Decrescente (High to Low)</option>
                            </select>
                        </div>

                        <button
                            onClick={() => { setFilterOccasion(''); setSortPriceOrder(''); }}
                            style={{
                                padding: '10px',
                                marginTop: '10px',
                                background: '#eee',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                color: '#666'
                            }}
                        >
                            Reset Filtri
                        </button>
                    </div>

                    {/* Main Grid Content */}
                    <div style={{ flexGrow: 1 }}>
                        <div className="profile-content-grid">
                            {filtered.length > 0 ? filtered.map(collection => (
                                <div
                                    key={collection.id}
                                    className="content-item"
                                    onClick={() => showSavedCollectionDetails(collection)}
                                    style={{ marginBottom: '0' }}
                                >
                                    {collection.products?.length > 0 && collection.products[0]?.imageUrl ? (
                                        <img
                                            src={collection.products[0].imageUrl}
                                            alt={collection.name}
                                            className="content-image"
                                        />
                                    ) : (
                                        <div className="content-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #6F4E37, #8D6E63)', color: 'white', fontSize: '2rem' }}>
                                            🍹
                                        </div>
                                    )}
                                    <div className="content-info">
                                        <h3 className="content-title">{collection.name}</h3>
                                        <p className="content-preview">di {collection.roasterName}</p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.8rem', color: '#8D6E63' }}>{collection.products?.length || 0} prodotti</span>
                                            <span style={{ fontWeight: 'bold', color: '#6F4E37' }}>€{calculateCollectionPrice(collection).toFixed(2)}</span>
                                        </div>
                                        {collection.occasion && <span className="collection-badge" style={{ fontSize: '0.7rem', background: '#eee', padding: '2px 6px', borderRadius: '4px', marginTop: '4px', display: 'inline-block' }}>{collection.occasion}</span>}
                                    </div>
                                </div>
                            )) : (
                                <div className="empty-state" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
                                    Nessuna collezione trovata con questi filtri.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
        }


        if (activeTab === 'products') {
            return (
                <div className="products-section">
                    {isOwnProfile && (
                        <div className="add-product-container">
                            <button className="add-product-btn" onClick={() => setIsAddingProduct(true)}>
                                + Aggiungi Prodotto
                            </button>
                        </div>
                    )}
                    <div className="products-grid">
                        {roasteryProducts.length > 0 ? roasteryProducts.map(product => (
                            <div key={product.id} className="product-card" style={{ position: 'relative' }}>
                                <div className="product-image">
                                    {product.imageUrl ? (
                                        <img src={product.imageUrl} alt={product.name} />
                                    ) : (
                                        <div style={{
                                            width: '100%',
                                            height: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '3rem',
                                            color: '#6F4E37',
                                            backgroundColor: '#e0e0e0'
                                        }}>
                                            ☕
                                        </div>
                                    )}
                                </div>
                                <div className="product-info">
                                    <h3>{product.name}</h3>
                                    <p className="product-desc">{product.description}</p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                                        {product.price ? <p className="product-price">€ {product.price}</p> : <span></span>}
                                        {isOwnProfile && (
                                            <button
                                                onClick={(e) => handleDeleteProduct(product.id, e)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    color: '#d33',
                                                    fontSize: '18px',
                                                    padding: '4px'
                                                }}
                                                title="Elimina prodotto"
                                            >
                                                🗑
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <p className="empty-state">Nessun prodotto caricato.</p>
                        )}
                    </div>
                </div>
            );
        }

        if (activeTab === 'collections') {
            return (
                <div className="products-section">
                    {/* Add Collection Button for Owner */}
                    {isOwnProfile && (
                        <div className="add-product-container">
                            <button className="add-product-btn" onClick={() => openCollectionModal(null)}>
                                + Crea Nuova Collezione
                            </button>
                        </div>
                    )}
                    {roasteryCollections.length === 0 ? (
                        <p className="empty-state">Nessuna collezione.</p>
                    ) : (
                        <div className="products-grid">
                            {roasteryCollections.map(col => {
                                // Get up to 2 product images
                                const collectionImages = col.products ? col.products.slice(0, 2).map(prodId => {
                                    const prod = roasteryProducts.find(p => p.id === prodId);
                                    return prod ? prod.imageUrl : null;
                                }).filter(Boolean) : [];

                                return (
                                    <div
                                        key={col.id}
                                        className="product-card"
                                        onClick={() => isOwnProfile ? openCollectionModal(col) : showCollectionDetails(col)}
                                        style={{ cursor: 'pointer', position: 'relative' }}
                                    >
                                        <div className="product-image" style={{ position: 'relative', backgroundColor: '#e0e0e0', overflow: 'hidden' }}>
                                            {collectionImages.length > 0 ? (
                                                <CollectionCarousel images={collectionImages} />
                                            ) : (
                                                <div style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '3rem',
                                                    color: '#6F4E37',
                                                    backgroundColor: '#e0e0e0'
                                                }}>
                                                    ☕
                                                </div>
                                            )}
                                        </div>
                                        <div className="product-info">
                                            <div className="collection-card-header">
                                                <div className="collection-title-row">
                                                    <h3>{col.name}</h3>
                                                </div>
                                                {isOwnProfile && (
                                                    <div className="collection-actions">
                                                        {col.isPromoted && (
                                                            <span style={{
                                                                background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                                                                color: '#5D4037',
                                                                padding: '2px 8px',
                                                                borderRadius: '10px',
                                                                fontSize: '10px',
                                                                fontWeight: '700',
                                                                textTransform: 'uppercase'
                                                            }}>
                                                                In Evidenza
                                                            </span>
                                                        )}
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleTogglePromote(col); }}
                                                            className="action-btn-icon"
                                                            title={col.isPromoted ? 'Rimuovi promozione' : 'Promuovi collezione'}
                                                            style={{ color: col.isPromoted ? '#FFD700' : '#d3d3d3' }}
                                                        >
                                                            {col.isPromoted ? '⭐' : '☆'}
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteCollection(col.id); }}
                                                            className="action-btn-icon"
                                                            title="Elimina"
                                                            style={{ color: '#d33' }}
                                                        >
                                                            🗑
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="product-desc" style={{ textAlign: 'center' }}>{col.description}</p>
                                            <p className="product-price" style={{ fontSize: '0.9rem', color: '#8D6E63', textAlign: 'center' }}>{col.products?.length || 0} prodotti</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            );
        }

        return renderPostGrid(data, "Nessun contenuto trovato.");
    };

    if (!currentUser && isOwnProfile) {
        return (
            <div className="profile-container">
                <div className="empty-state">
                    <p>Devi effettuare il login per visualizzare il tuo profilo.</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="profile-container">
                <div className="empty-state">
                    <p>Caricamento profilo...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-container">
            {/* Header Section */}
            <div className="profile-header">
                {isOwnProfile && (
                    <button className="edit-profile-btn" onClick={handleEditClick} title="Modifica Profilo">
                        ✎
                    </button>
                )}
                <div className={`profile-pic-container ${isOwnProfile ? 'editable' : ''}`} onClick={isOwnProfile ? handleEditClick : undefined} style={{ cursor: isOwnProfile ? 'pointer' : 'default' }}>
                    <img src={user.profilePic || DEFAULT_AVATAR} alt={user.name} className="profile-pic" />
                    {isOwnProfile && (
                        <div className="profile-pic-overlay">
                            <span>Cambia Foto</span>
                        </div>
                    )}
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                    accept="image/*"
                />
                <div className="profile-info">
                    <div className="profile-name-row">
                        <h1 className="profile-name">
                            {user.name}
                            {user.nickname && <span className="profile-nickname"> (@{user.nickname})</span>}
                        </h1>
                        <span className={`role-tag ${String(user.role || 'Appassionato').toLowerCase()}`}>{user.role || 'Appassionato'}</span>
                    </div>

                    {currentUser && user && currentUser.uid !== user.uid && (
                        <div className="profile-actions">
                            <button
                                className={`follow-btn ${isFollowing ? 'following' : ''}`}
                                onClick={handleFollowToggle}
                            >
                                {isFollowing ? 'Unfollow' : 'Follow'}
                            </button>
                        </div>
                    )}

                    <p className="profile-bio">{user.bio}</p>
                    {user.location && (
                        <p className="profile-location">
                            📍 {user.location}
                        </p>
                    )}

                    {/* Role Specific Info Display */}
                    {user.role === 'Bar' && (
                        <div className="bar-info">
                            {roleData?.imageCover && (
                                <div className="profile-cover-image">
                                    <img src={roleData.imageCover} alt="Cover" />
                                </div>
                            )}
                            {roleData?.description && <p className="profile-bio-secondary">{roleData.description}</p>}
                            {roleData?.address && <p className="profile-detail">🏠 {roleData.address}</p>}
                            {roleData?.openingHours && <p className="profile-detail">🕒 {roleData.openingHours}</p>}

                            <div className="associated-baristas">
                                <h4>Baristi Associati</h4>
                                {associatedBaristas.length > 0 ? (
                                    <div className="baristas-tags">
                                        {associatedBaristas.map(barista => (
                                            <span key={barista.uid} className="barista-tag">
                                                @{barista.nickname || barista.name}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="no-baristas">Nessun barista associato.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {user.role === 'Torrefazione' && (
                        <div className="roastery-info">
                            {roleData?.imageCover && (
                                <div className="profile-cover-image">
                                    <img src={roleData.imageCover} alt="Cover" />
                                </div>
                            )}
                            {roleData?.description && <p className="profile-bio-secondary">{roleData.description}</p>}
                            <div className="associated-products">
                                <h4>Prodotti ({roleData?.stats?.products || 0})</h4>
                            </div>
                        </div>
                    )}
                </div>
            </div >

            {/* Stats Row */}
            < div className="profile-stats" >
                <div className="stats-group content-stats">
                    <div className="stat-item">
                        <span className="stat-value">{myPosts.length}</span>
                        <span className="stat-label">Post</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{myReviews.length}</span>
                        <span className="stat-label">Recensioni</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{myComparisons.length}</span>
                        <span className="stat-label">Confronti</span>
                    </div>
                </div>
                <div className="stats-separator"></div>
                <div className="stats-group connection-stats">
                    <div className="stat-item">
                        <span className="stat-value">{followersCount}</span>
                        <span className="stat-label">Follower</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{followingCount}</span>
                        <span className="stat-label">Following</span>
                    </div>
                </div>
            </div >

            {/* Tabs Navigation */}
            <div className="profile-tabs">
                <button
                    className={`tab-button ${activeTab === 'posts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('posts')}
                >
                    Post
                </button>
                <button
                    className={`tab-button ${activeTab === 'events' ? 'active' : ''}`}
                    onClick={() => setActiveTab('events')}
                >
                    Eventi
                </button>
                <button
                    className={`tab-button ${activeTab === 'reviews' ? 'active' : ''}`}
                    onClick={() => setActiveTab('reviews')}
                >
                    Recensioni
                </button>
                <button
                    className={`tab-button ${activeTab === 'comparisons' ? 'active' : ''}`}
                    onClick={() => setActiveTab('comparisons')}
                >
                    Confronti
                </button>

                {isOwnProfile && (
                    <button
                        className={`tab-button ${activeTab === 'votes' ? 'active' : ''}`}
                        onClick={() => setActiveTab('votes')}
                    >
                        Voti
                    </button>
                )}

                <button
                    className={`tab-button ${activeTab === 'comments' ? 'active' : ''}`}
                    onClick={() => setActiveTab('comments')}
                >
                    Commenti
                </button>

                {isOwnProfile && (
                    <>
                        <button
                            className={`tab-button ${activeTab === 'savedCollections' ? 'active' : ''}`}
                            onClick={() => setActiveTab('savedCollections')}
                        >
                            Collezioni Salvate
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'savedPosts' ? 'active' : ''}`}
                            onClick={() => setActiveTab('savedPosts')}
                        >
                            Post Salvati
                        </button>
                    </>
                )}

                {user.role && user.role.toLowerCase() === 'torrefazione' && (
                    <>
                        <button
                            className={`tab-button ${activeTab === 'products' ? 'active' : ''}`}
                            onClick={() => setActiveTab('products')}
                        >
                            Prodotti
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'collections' ? 'active' : ''}`}
                            onClick={() => setActiveTab('collections')}
                        >
                            Collezioni
                        </button>
                    </>
                )}
            </div >

            {/* Content Area */}
            {renderContent()}

            {/* Edit Drawer Overlay */}
            <div className={`drawer-overlay ${isEditing ? 'open' : ''}`} onClick={handleCloseDrawer}></div>

            {/* Edit Drawer */}
            <div className={`edit-drawer ${isEditing ? 'open' : ''}`}>
                <div className="drawer-header">
                    <h2>Modifica Profilo</h2>
                    <button className="drawer-close-btn" onClick={handleCloseDrawer}>&times;</button>
                </div>
                <div className="drawer-content">
                    <div className="edit-form-group">
                        <div className="edit-pic-container" onClick={handleImageClick}>
                            <img src={editForm.profilePic} alt="Preview" className="edit-pic-preview" title="Clicca per cambiare foto" />
                        </div>
                    </div>
                    <div className="edit-form-group">
                        <label>Nome</label>
                        <input
                            type="text"
                            name="name"
                            value={editForm.name}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="edit-form-group">
                        <label>Soprannome</label>
                        <input
                            type="text"
                            name="nickname"
                            value={editForm.nickname}
                            onChange={handleInputChange}
                            placeholder="Es. TheCoffeeGuy"
                        />
                    </div>
                    <div className="edit-form-group">
                        <label>Bio</label>
                        <textarea
                            name="bio"
                            value={editForm.bio}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="edit-form-group">
                        <label>Luogo</label>
                        <input
                            type="text"
                            name="location"
                            value={editForm.location}
                            onChange={handleInputChange}
                            placeholder="Es. Roma, Italia"
                        />
                    </div>

                    {/* Role Specific Edit Fields */}
                    {(user.role === 'Bar' || user.role === 'Torrefazione') && (
                        <>
                            <div className="edit-form-group">
                                <label>Descrizione {user.role === 'Bar' ? 'Bar' : 'Torrefazione'}</label>
                                <textarea
                                    name="description"
                                    value={editForm.description}
                                    onChange={handleInputChange}
                                    placeholder="Descrizione dell'attività..."
                                />
                            </div>
                            <div className="edit-form-group">
                                <label>Immagine Copertina (URL)</label>
                                <input
                                    type="text"
                                    name="imageCover"
                                    value={editForm.imageCover}
                                    onChange={handleInputChange}
                                    placeholder="https://..."
                                />
                            </div>
                        </>
                    )}

                    {user.role === 'Bar' && (
                        <>
                            <div className="edit-form-group">
                                <label>Indirizzo</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={editForm.address}
                                    onChange={handleInputChange}
                                    placeholder="Via Roma 1, 00100"
                                />
                            </div>
                            <div className="edit-form-group">
                                <label>Orari di Apertura</label>
                                <input
                                    type="text"
                                    name="openingHours"
                                    value={editForm.openingHours}
                                    onChange={handleInputChange}
                                    placeholder="Lun-Ven: 07:00 - 20:00"
                                />
                            </div>
                        </>
                    )}
                    {user.role === 'Bar' && (
                        <div className="edit-form-group">
                            <label>Gestisci Baristi Associati</label>
                            <div className="barista-search-container">
                                <input
                                    type="text"
                                    placeholder="Cerca utente per nickname..."
                                    value={baristaSearchQuery}
                                    onChange={handleBaristaSearch}
                                />
                                {searchResults.length > 0 ? (
                                    <ul className="search-results">
                                        {searchResults.map(result => (
                                            <li key={result.uid} onClick={() => addBarista(result)}>
                                                <img src={result.profilePic || DEFAULT_AVATAR} alt="" />
                                                <div className="search-result-info">
                                                    <span className="search-result-name">{result.nickname || result.name}</span>
                                                    <span className="search-result-role">({result.role || 'Utente'})</span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    baristaSearchQuery.length > 1 && (
                                        <div className="search-results empty">
                                            <li>Nessun barista trovato.</li>
                                        </div>
                                    )
                                )}
                            </div>

                            <div className="selected-baristas-list">
                                {selectedBaristas.map(barista => (
                                    <div key={barista.uid} className="selected-barista-item">
                                        <span>{barista.nickname || barista.name}</span>
                                        <button type="button" onClick={() => removeBarista(barista.uid)}>×</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="drawer-footer">
                    <button className="cancel-btn" onClick={handleCloseDrawer}>Annulla</button>
                    <button className="save-btn" onClick={handleSave}>Salva Modifiche</button>
                </div>
            </div>

            {/* Add Product Drawer */}
            <div className={`drawer-overlay ${isAddingProduct ? 'open' : ''}`} onClick={() => setIsAddingProduct(false)}></div>
            <div className={`edit-drawer ${isAddingProduct ? 'open' : ''}`}>
                <div className="drawer-header">
                    <h2>Aggiungi Prodotto</h2>
                    <button className="drawer-close-btn" onClick={() => setIsAddingProduct(false)}>&times;</button>
                </div>
                <div className="drawer-content">
                    <div className="edit-form-group">
                        <label>Immagine Prodotto</label>
                        <input
                            type="file"
                            onChange={handleProductImageChange}
                            accept="image/*"
                        />
                        {newProduct.imageUrl && (
                            <img src={newProduct.imageUrl} alt="Preview" className="product-preview-img" style={{ maxWidth: '100%', marginTop: '10px', borderRadius: '8px' }} />
                        )}
                    </div>
                    <div className="edit-form-group">
                        <label>Nome Prodotto *</label>
                        <input
                            type="text"
                            name="name"
                            value={newProduct.name}
                            onChange={handleProductInputChange}
                            placeholder="Es. Miscela Arabica"
                        />
                    </div>
                    <div className="edit-form-group">
                        <label>Descrizione</label>
                        <textarea
                            name="description"
                            value={newProduct.description}
                            onChange={handleProductInputChange}
                            placeholder="Descrivi il prodotto..."
                        />
                    </div>
                    <div className="edit-form-group">
                        <label>Prezzo (€)</label>
                        <input
                            type="number"
                            name="price"
                            value={newProduct.price}
                            onChange={handleProductInputChange}
                            placeholder="Es. 15.00"
                        />
                    </div>
                </div>
                <div className="drawer-footer">
                    <button className="save-btn" onClick={handleCreateProduct}>Aggiungi</button>
                </div>
            </div>

            {/* Collection Manager Modal */}
            {
                showCollectionModal && (
                    <CollectionManager
                        roasterId={currentUserRoleData.id}
                        currentUser={currentUser}
                        products={roasteryProducts}
                        initialData={editingCollection}
                        onClose={() => {
                            setShowCollectionModal(false);
                            setEditingCollection(null);
                        }}
                        onSave={handleSaveCollection}
                    />
                )
            }
        </div >
    );

}

export default Profile;
