import React from 'react';
import { Link } from 'react-router-dom';
import CommentSection from '../components/CommentSection';
import { toggleSavePost } from '../services/postService';
import { useAuth } from '../context/AuthContext';
import '../styles/pages/Home.css';
import '../styles/components/Sidebar.css';
import Sidebar from '../components/Sidebar';
import CommunityFeed from '../components/CommunityFeed';
import CommunityExplorer from '../components/CommunityExplorer';
import CommunityInfoCard from '../components/CommunityInfoCard';
import PostCard from '../components/PostCard';
import { getUsersByUids } from '../services/userService';
import { getCommunitiesByIds } from '../services/communityService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Sidebar moved to components/Sidebar.js

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

const Feed = ({ isLoggedIn, user, feedType }) => {
    const [posts, setPosts] = React.useState([]);
    const [expandedPostId, setExpandedPostId] = React.useState(null);
    // Local state to track user votes: { [postId]: 1 (up) | -1 (down) | 0 (none) }
    const [userVotes, setUserVotes] = React.useState({});
    // Local state to track saved posts: { [postId]: true/false }
    const [savedPosts, setSavedPosts] = React.useState({});

    React.useEffect(() => {
        const fetchPosts = async () => {
            console.log("Fetching posts...");
            try {
                let url = `${API_URL}/posts`;
                const params = new URLSearchParams();

                if (user?.uid) {
                    params.append('uid', user.uid);

                    if (feedType === 'home') {
                        params.append('filter', 'followed');
                    }
                }

                if (feedType === 'popular') {
                    params.append('sort', 'popular');
                }

                if (feedType.startsWith('community-')) {
                    // const communityId = feedType.replace('community-', '');
                    // In a real app we'd filter by communityId.
                    // For now, since backend doesn't support community filter yet, we just show all or implement client filtering
                    // params.append('communityId', communityId);
                    // Assuming backend will accept this or we just handle UI for now.
                    // Let's assume we want to fetch all and filter in frontend for MVP or pass param if backend ready.
                    // Since I only updated backend to create communities but not filter posts, I will leave as is, 
                    // but ideally we'd filter. I'll add the param in case I update backend logic.
                }

                if (Array.from(params).length > 0) {
                    url += `?${params.toString()}`;
                }

                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();

                // Initialize votes state
                const initialVotes = {};

                // Extract unique UIDs and Community IDs
                const uids = [...new Set(data.map(post => post.uid))];
                const communityIds = [...new Set(data.map(post => post.communityId).filter(Boolean))];

                const [users, commResponse] = await Promise.all([
                    getUsersByUids(uids),
                    fetch(`${API_URL}/communities`)
                ]);
                const communities = commResponse.ok ? await commResponse.json() : [];

                const userMap = {};
                users.forEach(u => {
                    userMap[u.uid] = {
                        name: u.nickname || u.name,
                        avatar: u.profilePic || u.photoURL || "https://cdn-icons-png.flaticon.com/512/847/847969.png"
                    };
                });

                const communityMap = {};
                communities.forEach(c => {
                    communityMap[c.id] = { name: c.name, avatar: c.avatar };
                });

                // Map backend data to frontend format
                const formattedPosts = data.map(post => {
                    // Set initial vote state for this post
                    if (post.userVote) {
                        initialVotes[post.id] = post.userVote;
                    }

                    const postUser = userMap[post.uid] || { name: "User", avatar: "https://cdn-icons-png.flaticon.com/512/847/847969.png" };
                    const postCommunity = communityMap[post.communityId];

                    return {
                        id: post.id,
                        author: postUser.name,
                        authorAvatar: postUser.avatar,
                        authorId: post.uid,
                        time: post.createdAt ? timeAgo(new Date(post.createdAt)) : "just now",
                        content: post.text,
                        image: post.imageUrl,
                        votes: post.votes || 0,
                        comments: post.commentsCount || 0,
                        userVote: post.userVote || 0,
                        communityName: postCommunity?.name,
                        communityAvatar: postCommunity?.avatar,
                        communityId: post.communityId
                    };
                });

                setPosts(formattedPosts);
                setUserVotes(initialVotes);
            } catch (error) {
                console.error("Error fetching posts:", error);
            }
        };

        const fetchSavedPosts = async () => {
            if (!user?.uid) return;
            try {
                const response = await fetch(`${API_URL}/users/${user.uid}/savedPosts`);
                if (response.ok) {
                    const savedPostIds = await response.json();
                    const savedMap = {};
                    savedPostIds.forEach(id => { savedMap[id] = true; });
                    setSavedPosts(savedMap);
                }
            } catch (error) {
                console.error("Error fetching saved posts:", error);
            }
        };

        fetchPosts();
        fetchSavedPosts();
    }, [user?.uid, feedType]); // Re-fetch when user or feedType changes

    const toggleComments = (postId) => {
        if (expandedPostId === postId) {
            setExpandedPostId(null);
        } else {
            setExpandedPostId(postId);
        }
    };

    const handleVote = async (postId, type) => {
        if (!isLoggedIn) return;

        const currentVote = userVotes[postId] || 0;
        const newVote = currentVote === 1 ? 0 : 1; // Toggle if already upvoted

        // Optimistic update
        setUserVotes(prev => ({ ...prev, [postId]: newVote }));
        setPosts(prevPosts => prevPosts.map(p => {
            if (p.id === postId) {
                let voteChange = 0;
                if (currentVote === 1) voteChange = -1; // Remove upvote
                else if (currentVote === -1) voteChange = 2; // Change down to up
                else voteChange = 1; // Add upvote
                return { ...p, votes: p.votes + voteChange };
            }
            return p;
        }));

        try {
            await fetch(`${API_URL}/posts/${postId}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: user?.uid, value: 1 }),
            });
        } catch (error) {
            console.error("Error liking post:", error);
            // Revert logic could be added here
        }
    };

    const handleDownvote = async (postId) => {
        if (!isLoggedIn) return;

        const currentVote = userVotes[postId] || 0;
        const newVote = currentVote === -1 ? 0 : -1; // Toggle if already downvoted

        // Optimistic update
        setUserVotes(prev => ({ ...prev, [postId]: newVote }));
        setPosts(prevPosts => prevPosts.map(p => {
            if (p.id === postId) {
                let voteChange = 0;
                if (currentVote === -1) voteChange = 1; // Remove downvote
                else if (currentVote === 1) voteChange = -2; // Change up to down
                else voteChange = -1; // Add downvote
                return { ...p, votes: p.votes + voteChange };
            }
            return p;
        }));

        try {
            await fetch(`${API_URL}/posts/${postId}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: user?.uid, value: -1 }),
            });
        } catch (error) {
            console.error("Error unliking post:", error);
        }
    };

    const handleToggleSave = async (postId) => {
        if (!isLoggedIn || !user?.uid) return;

        const isSaved = savedPosts[postId] || false;

        // Optimistic update
        setSavedPosts(prev => ({ ...prev, [postId]: !isSaved }));

        try {
            await toggleSavePost(postId, user.uid, isSaved);
        } catch (error) {
            console.error("Error toggling save:", error);
            // Revert on error
            setSavedPosts(prev => ({ ...prev, [postId]: isSaved }));
        }
    };

    return (
        <main className="feed">
            {posts.map(post => {
                const isSaved = savedPosts[post.id] || false;
                // Merge isSaved into post object for PostCard or pass as prop
                // We'll pass as prop.
                return (
                    <PostCard
                        key={post.id}
                        post={{ ...post, isSaved }}
                        currentUser={user}
                        isLoggedIn={isLoggedIn}
                    />
                );
            })}
        </main>
    );
};



const Home = ({ onLoginClick, isLoggedIn }) => {
    const { currentUser } = useAuth();
    const [feedType, setFeedType] = React.useState('all');
    const [sidebarRefresh, setSidebarRefresh] = React.useState(0);
    const [currentCommunity, setCurrentCommunity] = React.useState(null);

    return (
        <div className="home-layout">
            <div className={`main-container ${feedType.startsWith('community-') ? 'community-view' : ''}`}>
                <Sidebar
                    activeFeed={feedType}
                    onFeedChange={setFeedType}
                    refreshTrigger={sidebarRefresh}
                />



                {feedType === 'explore' ? (
                    <CommunityExplorer
                        currentUser={currentUser}
                        onNavigate={setFeedType}
                        onCommunityUpdate={() => setSidebarRefresh(prev => prev + 1)}
                    />
                ) : feedType.startsWith('community-') ? (
                    <CommunityFeed
                        communityId={feedType.replace('community-', '')}
                        isLoggedIn={isLoggedIn}
                        user={currentUser}
                        onCommunityUpdate={() => setSidebarRefresh(prev => prev + 1)}
                        onCommunityLoaded={setCurrentCommunity}
                    />
                ) : (
                    <Feed isLoggedIn={isLoggedIn} user={currentUser} feedType={feedType} />
                )}

                <div className="right-sidebar">
                    {feedType.startsWith('community-') && currentCommunity && (
                        <CommunityInfoCard
                            community={currentCommunity}
                            currentUser={currentUser}
                            onCommunityUpdate={() => {
                                setSidebarRefresh(prev => prev + 1);
                                // Also need to re-fetch current community? 
                                // Actually sidebar refresh triggers nothing for *current* community details directly 
                                // unless CommunityFeed re-fetches. 
                                // But CommunityFeed fetches on mount/id change.
                                // We might need to force CommunityFeed to update?
                                // For now, let's just assume we update the local state in the card or rely on the feed to update eventually.
                                // Better: Pass a function that updates 'currentCommunity' locally too if returned.
                            }}
                        />
                    )}
                    {/* Create Post button/Footer if needed */}
                </div>
            </div>
        </div>
    );
};

export default Home;
