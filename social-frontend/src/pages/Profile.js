import React, { useState, useRef, useEffect } from 'react';
import Swal from 'sweetalert2';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUserData, useRoleData } from '../hooks/useUserData';
import { getUserVotedPosts, getUserComments, getUserPosts, getUserSavedPosts, getUserSavedGuides, toggleSavePost, updateVotes, deletePost } from '../services/postService';
import { searchUsers, getUsersByUids, updateUserProfile, createRoleProfile, updateRoleProfile, followUser, unfollowUser, checkFollowStatus, getUser, getRoleProfile, getRoasteryProducts, createProduct, deleteProduct } from '../services/userService';
import { validateImage } from '../services/imageService';
import { getCollections, createCollection, deleteCollection, updateCollection } from '../services/collectionService';
import PostCard from '../components/PostCard';
import CollectionManager from '../components/CollectionManager';
import '../styles/pages/Profile.css';

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/847/847969.png";
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

    // Use profileUser and profileRoleData for rendering
    const user = profileUser;
    const roleData = profileRoleData;


    const [activeTab, setActiveTab] = useState('posts');
    const [isEditing, setIsEditing] = useState(false);

    // Appassionato Data State
    const [myPosts, setMyPosts] = useState([]);
    const [upvotedPosts, setUpvotedPosts] = useState([]);
    const [downvotedPosts, setDownvotedPosts] = useState([]);
    const [myReviews, setMyReviews] = useState([]);
    const [myComments, setMyComments] = useState([]);
    const [savedPosts, setSavedPosts] = useState([]);
    const [savedGuides, setSavedGuides] = useState([]);

    // Barista Association State
    const [associatedBaristas, setAssociatedBaristas] = useState([]);
    const [baristaSearchQuery, setBaristaSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedBaristas, setSelectedBaristas] = useState([]); // For edit form

    // Follow System State
    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);

    // Load user's posts and reviews
    useEffect(() => {
        const loadUserPosts = async () => {
            if (!user) return;
            try {
                const userPosts = await getUserPosts(user.uid, currentUser?.uid);

                // Map data to match PostCard expected format (like Home.js)
                const formattedPosts = userPosts.map(p => ({
                    ...p,
                    author: user.nickname || user.name,
                    authorAvatar: user.profilePic || user.photoURL,
                    authorId: user.uid,
                    content: p.text || p.content,
                    image: p.imageUrl || null,
                    mediaUrls: p.mediaUrls || [],
                    time: p.createdAt ? new Date(p.createdAt).toLocaleString() : 'Just now'
                }));

                // Separate posts from reviews
                const posts = formattedPosts.filter(p => !p.type || p.type === 'post');
                const reviews = formattedPosts.filter(p => p.type === 'review');

                setMyPosts(posts);
                setMyReviews(reviews);
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
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const handleVote = async (postId, type) => {
        if (!currentUser) return;

        // Find the post in savedPosts
        const postIndex = savedPosts.findIndex(p => p.id === postId);
        if (postIndex === -1) return;

        const post = savedPosts[postIndex];
        const currentVote = post.userVote || 0;
        let newVote = 0;
        let voteChange = 0;

        if (type === 'up') {
            newVote = currentVote === 1 ? 0 : 1;
            voteChange = currentVote === 1 ? -1 : (currentVote === -1 ? 2 : 1);
        } else { // down
            newVote = currentVote === -1 ? 0 : -1;
            voteChange = currentVote === -1 ? 1 : (currentVote === 1 ? -2 : -1);
        }

        // Optimistic update
        const updatedPosts = [...savedPosts];
        updatedPosts[postIndex] = {
            ...post,
            userVote: newVote,
            votes: (post.votes || 0) + voteChange
        };
        setSavedPosts(updatedPosts);

        try {
            const valueToSend = newVote === 0 ? currentVote : newVote;
            await updateVotes(postId, currentUser.uid, valueToSend); // Use service
        } catch (error) {
            console.error("Error voting in profile:", error);
            // Revert
            setSavedPosts(savedPosts);
        }
    };

    const handleToggleSave = async (postId) => {
        if (!currentUser) return;

        // Optimistic update for savedPosts list
        // If we are in "savedPosts" tab, toggling save (unsaving) should remove it from the list
        if (activeTab === 'savedPosts') {
            setSavedPosts(prev => prev.filter(p => p.id !== postId));
        }

        try {
            // We assume it's currently saved if it's in the savedPosts list
            await toggleSavePost(postId, currentUser.uid, true);
        } catch (error) {
            console.error("Error toggling save in profile:", error);
            // Revert if error (fetch again)
            const posts = await getUserSavedPosts(currentUser.uid);
            setSavedPosts(posts);
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
        setMyPosts(prev => prev.filter(p => p.id !== postId));

        try {
            await deletePost(postId, currentUser.uid); // Use service
        } catch (error) {
            console.error("Error deleting post:", error);
            alert("Errore durante l'eliminazione del post.");
            setMyPosts(originalPosts);
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
            if (activeTab === 'upvoted' && user.role === 'Appassionato') {
                // Only show upvoted if it's own profile? Or public? Let's assume public for now or restrict
                if (isOwnProfile) {
                    const posts = await getUserVotedPosts(user.uid, 1);
                    setUpvotedPosts(posts);
                }
            } else if (activeTab === 'downvoted' && user.role === 'Appassionato') {
                if (isOwnProfile) {
                    const posts = await getUserVotedPosts(user.uid, -1);
                    setDownvotedPosts(posts);
                }
            } else if (activeTab === 'comments') {
                const comments = await getUserComments(user.uid);
                setMyComments(comments);
            } else if (activeTab === 'savedPosts' && user.role === 'Appassionato') {
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
                        authorName: userMap[p.uid] || p.uid, // PostCard uses authorName or author
                        title: p.text ? (p.text.substring(0, 50) + (p.text.length > 50 ? "..." : "")) : "No Title",
                        content: p.text,
                        image: p.imageUrl,
                        votes: p.likesCount || 0,
                        comments: p.commentsCount || 0,
                        time: p.time || new Date(p.createdAt).toLocaleDateString()
                    }));

                    setSavedPosts(formattedPosts);
                }
            } else if (activeTab === 'savedGuides' && user.role === 'Appassionato') {
                if (isOwnProfile) {
                    const guides = await getUserSavedGuides(user.uid);
                    setSavedGuides(guides);
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
                    // Also fetch products for the manager (owner) OR for details popup (visitor)
                    const products = await getRoasteryProducts(roleData.id);
                    setRoasteryProducts(products);
                }
            }
            // Guides would be fetched here if we had a backend for them
        };

        fetchData();
    }, [activeTab, user, isOwnProfile, roleData]);

    // Mock Content Data (Removed static mocks for dynamic tabs)
    const guides = [
        { id: 1, title: "V60 Brewing Guide", image: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=400", type: "Guide" },
    ];

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

    // Show collection details popup for non-owners
    const showCollectionDetails = (collection) => {
        // Get full product details
        const products = collection.products?.map(prodId =>
            roasteryProducts.find(p => p.id === prodId)
        ).filter(Boolean) || [];

        // Calculate total cost
        const totalCost = products.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0);

        // Build products list HTML
        const productsHtml = products.length > 0
            ? products.map(p => `
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                    <span>${p.name}</span>
                    <strong>€${p.price || '0'}</strong>
                </div>
            `).join('')
            : '<p style="color: #888;">Nessun prodotto in questa collezione</p>';

        Swal.fire({
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
            showConfirmButton: false,
            width: 400
        });
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

    const renderContent = () => {
        let data = [];
        let type = 'card'; // 'card' or 'comment'

        // Format posts data for display
        if (activeTab === 'posts') {
            // Render posts with PostCard (excluding reviews)
            return (
                <div className="profile-feed">
                    {myPosts.length > 0 ? myPosts.map(post => (
                        <PostCard
                            key={post.id}
                            post={post}
                            currentUser={currentUser}
                            isLoggedIn={!!currentUser}
                        />
                    )) : (
                        <div className="empty-state">Nessun post trovato.</div>
                    )}
                </div>
            );
        }
        if (activeTab === 'guides') {
            // Mock guides for now, or fetch if implemented
            data = guides;
        }

        // Appassionato Specific Tabs
        if (user.role === 'Appassionato') {
            if (activeTab === 'upvoted') data = upvotedPosts.map(p => ({ ...p, image: p.imageUrl || "https://via.placeholder.com/400", type: "Upvoted" }));
            if (activeTab === 'downvoted') data = downvotedPosts.map(p => ({ ...p, image: p.imageUrl || "https://via.placeholder.com/400", type: "Downvoted" }));
            if (activeTab === 'comments') {
                type = 'comment';
                data = myComments;
            }
            if (activeTab === 'savedPosts') {
                // For saved posts, we want to use the PostCard component
                // We map the data but we'll render it differently in the return
                data = savedPosts;
            }
            if (activeTab === 'savedGuides') data = savedGuides.map(p => ({ ...p, image: p.image || "https://via.placeholder.com/400", type: "Saved Guide" }));
            if (activeTab === 'communities') return <div className="empty-state">Comunità in arrivo...</div>;
        }

        if (activeTab === 'reviews') {
            // Render reviews with PostCard like in Home
            return (
                <div className="profile-feed">
                    {myReviews.length > 0 ? myReviews.map(post => (
                        <PostCard
                            key={post.id}
                            post={post}
                            currentUser={currentUser}
                            isLoggedIn={!!currentUser}
                        />
                    )) : (
                        <div className="empty-state">Nessuna recensione trovata.</div>
                    )}
                </div>
            );
        }

        if (data.length === 0 && activeTab !== 'products' && activeTab !== 'collections') {
            return <div className="empty-state">Nessun contenuto trovato.</div>;
        }

        if (type === 'comment') {
            return (
                <div className="profile-comments-list">
                    {data.map(item => (
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

        if (activeTab === 'savedPosts') {
            return (
                <div className="profile-feed">
                    {data.map(post => (
                        <PostCard
                            key={post.id}
                            post={post}
                            user={currentUser}
                            onVote={handleVote}
                            onToggleSave={handleToggleSave}
                            isSaved={true}
                        />
                    ))}
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
                                                <>
                                                    {collectionImages.map((img, index) => (
                                                        <img
                                                            key={index}
                                                            src={img}
                                                            alt=""
                                                            style={{
                                                                position: 'absolute',
                                                                width: '80%',
                                                                height: '80%',
                                                                objectFit: 'cover',
                                                                borderRadius: '4px',
                                                                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                                                top: index === 0 ? (collectionImages.length > 1 ? '10%' : '10%') : '25%',
                                                                left: index === 0 ? (collectionImages.length > 1 ? '10%' : '10%') : '25%',
                                                                zIndex: index === 0 ? 2 : 1,
                                                                transform: index === 1 ? 'rotate(5deg)' : 'none'
                                                            }}
                                                        />
                                                    ))}
                                                </>
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
                                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <h3>{col.name}</h3>
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
                                                </div>
                                                {isOwnProfile && (
                                                    <div className="collection-actions" onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', right: 0 }}>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleTogglePromote(col); }}
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                color: col.isPromoted ? '#FFD700' : '#888',
                                                                fontSize: '18px'
                                                            }}
                                                            title={col.isPromoted ? 'Rimuovi promozione' : 'Promuovi collezione'}
                                                        >
                                                            {col.isPromoted ? '⭐' : '☆'}
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteCollection(col.id); }}
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d33' }}
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

        return (
            <div className="profile-content-grid">
                {data.map(item => (
                    <div key={item.id} className={`content-item ${!item.image ? 'text-only' : ''}`}>
                        {item.image && <img src={item.image} alt={item.title} className="content-image" />}
                        <div className="content-info">
                            <h3 className="content-title">{item.title}</h3>
                            <p className="content-preview">{item.type}</p>
                        </div>
                        {isOwnProfile && activeTab === 'posts' && (
                            <button
                                className="delete-post-btn"
                                onClick={(e) => handleDeletePost(item.id, e)}
                                title="Elimina post"
                            >
                                ×
                            </button>
                        )}
                    </div>
                ))}
            </div>
        );
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
                <div className="stat-item">
                    <span className="stat-value">{myPosts.length}</span>
                    <span className="stat-label">Post</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">{followersCount}</span>
                    <span className="stat-label">Follower</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">{followingCount}</span>
                    <span className="stat-label">Following</span>
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

                {
                    user.role === 'Appassionato' && (
                        <>
                            {isOwnProfile && (
                                <>
                                    <button
                                        className={`tab-button ${activeTab === 'upvoted' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('upvoted')}
                                    >
                                        Upvoted
                                    </button>
                                    <button
                                        className={`tab-button ${activeTab === 'downvoted' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('downvoted')}
                                    >
                                        Downvoted
                                    </button>
                                </>
                            )}
                            <button
                                className={`tab-button ${activeTab === 'reviews' ? 'active' : ''}`}
                                onClick={() => setActiveTab('reviews')}
                            >
                                Recensioni
                            </button>
                            <button
                                className={`tab-button ${activeTab === 'comments' ? 'active' : ''}`}
                                onClick={() => setActiveTab('comments')}
                            >
                                Commenti
                            </button>
                            {isOwnProfile && (
                                <>
                                    <button
                                        className={`tab-button ${activeTab === 'savedPosts' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('savedPosts')}
                                    >
                                        Post Salvati
                                    </button>
                                    <button
                                        className={`tab-button ${activeTab === 'savedGuides' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('savedGuides')}
                                    >
                                        Guide Salvate
                                    </button>
                                </>
                            )}
                            <button
                                className={`tab-button ${activeTab === 'communities' ? 'active' : ''}`}
                                onClick={() => setActiveTab('communities')}
                            >
                                Comunità
                            </button>
                        </>
                    )
                }
                {
                    (user.role === 'Bar' || (user.role && user.role.toLowerCase() === 'torrefazione')) && (
                        <button
                            className={`tab-button ${activeTab === 'reviews' ? 'active' : ''}`}
                            onClick={() => setActiveTab('reviews')}
                        >
                            Recensioni
                        </button>
                    )
                }
                {
                    (user.role === 'Bar' || (user.role && user.role.toLowerCase() === 'torrefazione')) && (
                        <button
                            className={`tab-button ${activeTab === 'guides' ? 'active' : ''}`}
                            onClick={() => setActiveTab('guides')}
                        >
                            Guide
                        </button>
                    )
                }
                {
                    user.role && user.role.toLowerCase() === 'torrefazione' && (
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
                    )
                }
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
            {showCollectionModal && (
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
            )}
        </div >
    );

}

export default Profile;
