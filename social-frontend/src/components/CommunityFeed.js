
import React, { useState, useEffect } from 'react';
import PostCard from './PostCard';
import { getUsersByUids } from '../services/userService';
import { getCommunity, updateCommunity } from '../services/communityService';
import { getFeedPosts } from '../services/postService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m";
    return Math.floor(seconds) + "s";
};

const CommunityFeed = ({ communityId, isLoggedIn, user, onCommunityUpdate, onCommunityLoaded }) => {
    const [community, setCommunity] = useState(null);
    const [posts, setPosts] = useState([]);
    // eslint-disable-next-line no-unused-vars
    const [expandedPostId, setExpandedPostId] = useState(null);
    // eslint-disable-next-line no-unused-vars
    const [userVotes, setUserVotes] = useState({});
    // eslint-disable-next-line no-unused-vars
    const [savedPosts, setSavedPosts] = useState([]);
    // eslint-disable-next-line no-unused-vars
    const [isLoading, setIsLoading] = useState(true);

    // Editing state
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');

    useEffect(() => {
        if (community) {
            setEditName(community.name);
            setEditDescription(community.description);
        }
    }, [community]);

    useEffect(() => {
        const fetchCommunityDetails = async () => {
            try {
                const response = await fetch(`${API_URL}/communities/${communityId}`);
                if (response.ok) {
                    const data = await response.json();
                    setCommunity(data);
                    if (onCommunityLoaded) onCommunityLoaded(data);
                }
            } catch (error) {
                console.error("Error fetching community:", error);
            }
        };

        const fetchPosts = async () => {
            try {
                const params = { communityId: communityId };
                if (user?.uid) params.uid = user.uid;

                const data = await getFeedPosts(params);

                // Extract unique UIDs
                const uids = new Set(data.map(post => post.uid));
                data.forEach(p => {
                    if (p.taggedUsers && Array.isArray(p.taggedUsers)) {
                        p.taggedUsers.forEach(uid => uids.add(uid));
                    }
                    if (p.hosts && Array.isArray(p.hosts)) {
                        p.hosts.forEach(uid => uids.add(uid));
                    }
                });

                let userMap = {};

                if (uids.size > 0) {
                    try {
                        const users = await getUsersByUids([...uids]);
                        users.forEach(u => {
                            userMap[u.uid] = {
                                name: u.nickname || u.name,
                                avatar: u.photoURL || u.profilePic || "https://cdn-icons-png.flaticon.com/512/847/847969.png",
                                nickname: u.nickname, // keep original object data if needed
                                uid: u.uid
                            };
                        });
                    } catch (err) {
                        console.error("Failed to fetch user details", err);
                    }
                }

                // Ensure community details are available
                let communityDetails = community;
                if (!communityDetails) {
                    try {
                        const commData = await getCommunity(communityId);
                        if (commData) communityDetails = commData;
                    } catch (e) { console.error("Error fetching community details for posts", e); }
                }

                const formattedPosts = data.map(post => {
                    const postUser = userMap[post.uid] || { name: "User", avatar: "https://cdn-icons-png.flaticon.com/512/847/847969.png" };

                    // Enrich tagged users data
                    const taggedUsersData = (post.taggedUsers || []).map(uid => {
                        const u = userMap[uid];
                        return u ? { ...u, uid: u.uid } : null;
                    }).filter(Boolean);

                    return {
                        id: post.id,
                        type: post.type || 'post', // Include post type (review, post, etc.)
                        author: postUser.name,
                        authorAvatar: postUser.avatar,
                        authorId: post.uid,
                        time: post.createdAt ? timeAgo(new Date(post.createdAt)) : "just now",
                        content: post.text,
                        image: post.imageUrl,
                        mediaUrls: post.mediaUrls || [], // Include media URLs array for carousel
                        reviewData: post.reviewData || null, // Include review data for review posts
                        comparisonData: post.comparisonData || null, // Include comparison data
                        votes: post.votes || 0,
                        comments: post.commentsCount || 0,
                        userVote: post.userVote || 0,
                        communityName: communityDetails?.name || "Community", // Use fetched details
                        // Event Details
                        eventDetails: post.eventDetails || null,
                        hosts: post.hosts || [],
                        participants: post.participants || [],
                        taggedUsersData: taggedUsersData, // Pass full objects
                    };
                });

                const initialVotes = {};
                data.forEach(p => initialVotes[p.id] = p.userVote || 0);

                setPosts(formattedPosts);
                setUserVotes(initialVotes);
            } catch (error) {
                console.error("Error fetching community posts:", error);
            } finally {
                setIsLoading(false);
            }
        };

        setIsLoading(true);
        if (communityId) {
            fetchCommunityDetails();
            fetchPosts();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [communityId, user?.uid]);

    const handleImageUpload = async (event, type) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'communities');

        try {
            // 1. Upload Image
            const uploadRes = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                body: formData
            });
            const { url } = await uploadRes.json();

            // 2. Update Community
            const updatePayload = { [type]: url, updaterId: user.uid };
            await updateCommunity(communityId, updatePayload);

            // 3. Update Local State
            setCommunity(prev => ({ ...prev, [type]: url }));

            // Notify parent to refresh Sidebar, avoiding full reload
            if (onCommunityUpdate) onCommunityUpdate();

        } catch (error) {
            console.error("Error updating community image:", error);
            alert("Failed to update image. Did you restart the backend?");
        }
    };

    const handleSaveDetails = async () => {
        try {
            const updatePayload = { name: editName, description: editDescription, updaterId: user.uid };
            await updateCommunity(communityId, updatePayload);

            setCommunity(prev => ({ ...prev, name: editName, description: editDescription }));
            setIsEditing(false);

            // Notify Sidebar to update name in list
            if (onCommunityUpdate) onCommunityUpdate();
        } catch (error) {
            console.error("Error updating details:", error);
            alert("Failed to save changes.");
        }
    };

    // const toggleComments = (postId) => {
    //     setActiveComments(prev => (prev === postId ? null : postId));
    // };

    if (!community) return <div style={{ padding: '20px' }}>Loading Community...</div>;

    return (
        <main className="feed">
            {/* Community Header Banner */}
            <div className="community-header" style={{ position: 'relative', marginBottom: '80px', width: '100%' }}>
                <div className="community-banner" style={{
                    backgroundColor: '#C4C4C4',
                    height: '170px',
                    width: '100%',
                    borderRadius: 'var(--border-radius)',
                    overflow: 'hidden',
                    position: 'relative',
                    group: 'banner-group'
                }}>
                    {community.banner && <img src={community.banner} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}

                    {/* Banner Upload Button - Owner Only */}
                    {user?.uid === community.creatorId && (
                        <label style={{
                            position: 'absolute',
                            right: '10px',
                            bottom: '10px',
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            color: 'white',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                        }}>
                            📷 Edit Cover
                            <input type="file" hidden onChange={(e) => handleImageUpload(e, 'banner')} accept="image/*" />
                        </label>
                    )}
                </div>

                {/* Logo centered vertically overlapping the banner bottom edge, aligned left */}
                <div className="community-info-container" style={{
                    position: 'absolute',
                    top: '105px', // Adjusted: 170px (banner) - 65px (half avatar) = 105px
                    left: '30px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '20px'
                }}>
                    <div className="community-avatar-large" style={{
                        width: '130px',
                        height: '130px',
                        borderRadius: '50%',
                        backgroundColor: '#fff',
                        border: '5px solid var(--bg-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '50px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                        flexShrink: 0,
                        position: 'relative',
                        cursor: user?.uid === community.creatorId ? 'pointer' : 'default'
                    }}>
                        <label style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: user?.uid === community.creatorId ? 'pointer' : 'default'
                        }}>
                            {community.avatar ? (
                                <img src={community.avatar} alt={community.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <span>👥</span>
                            )}
                            {user?.uid === community.creatorId && (
                                <input type="file" hidden onChange={(e) => handleImageUpload(e, 'avatar')} accept="image/*" />
                            )}
                        </label>
                    </div>

                    {/* Text Information to the right of avatar, pushed down to sit below banner */}
                    <div style={{ paddingTop: '70px', flex: 1 }}>
                        {isEditing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '400px' }}>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    style={{ fontSize: '24px', fontWeight: 'bold', padding: '4px', borderRadius: '4px', border: '1px solid #ddd' }}
                                />
                                <textarea
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    style={{ fontSize: '15px', padding: '4px', borderRadius: '4px', border: '1px solid #ddd', minHeight: '60px', resize: 'vertical' }}
                                />
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={handleSaveDetails}
                                        style={{ padding: '6px 12px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        style={{ padding: '6px 12px', backgroundColor: '#ccc', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)' }}>{community.name}</h1>
                                    {user?.uid === community.creatorId && (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', opacity: 0.6 }}
                                            title="Edit Details"
                                        >
                                            ✏️
                                        </button>
                                    )}
                                </div>
                                <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '15px' }}>{community.description}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Posts List */}
            <div className="posts-container" style={{ marginTop: '20px', maxWidth: '680px', marginLeft: 'auto', marginRight: 'auto' }}>
                {posts.length === 0 ? (
                    <div className="empty-state" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                        <h3>No posts yet</h3>
                        <p>Be the first to post in {community.name}!</p>
                    </div>
                ) : (
                    posts.map(post => (
                        <PostCard
                            key={post.id}
                            post={post}
                            currentUser={user}
                            isLoggedIn={isLoggedIn}
                        />
                    ))
                )}
            </div>
        </main>
    );
};

export default CommunityFeed;
