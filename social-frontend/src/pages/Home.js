import React from 'react';
import { Link } from 'react-router-dom';
import { getFeedPosts } from '../services/postService';
import { useAuth } from '../context/AuthContext';
import '../styles/pages/Home.css';
import '../styles/components/Sidebar.css';
import Sidebar from '../components/Sidebar';
import CommunityFeed from '../components/CommunityFeed';
import CommunityExplorer from '../components/CommunityExplorer';
import CommunityInfoCard from '../components/CommunityInfoCard';
import PostCard from '../components/PostCard';
import { getUsersByUids, getUserSavedPostIds } from '../services/userService';
import { getAllCommunities } from '../services/communityService';

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

    // Local state to track saved posts: { [postId]: true/false }
    const [savedPosts, setSavedPosts] = React.useState({});

    React.useEffect(() => {
        const fetchPosts = async () => {
            try {
                const params = {};
                if (user?.uid) {
                    params.uid = user.uid;
                    if (feedType === 'home') {
                        params.filter = 'followed';
                    }
                }
                if (feedType === 'popular') {
                    params.sort = 'popular';
                }

                // Community filter not fully supported by backend yet, but we can pass it
                if (feedType.startsWith('community-')) {
                    // params.communityId = feedType.replace('community-', '');
                }

                const data = await getFeedPosts(params);



                // Extract unique UIDs and Community IDs
                const uids = [...new Set(data.map(post => post.uid))];

                const [users, communities] = await Promise.all([
                    getUsersByUids(uids),
                    getAllCommunities()
                ]);

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
                        communityId: post.communityId,
                        createdAt: post.createdAt
                    };
                });

                setPosts(formattedPosts);

            } catch (error) {
                console.error("Error fetching posts:", error);
            }
        };

        const fetchSavedPosts = async () => {
            if (!user?.uid) return;
            try {
                const savedPostIds = await getUserSavedPostIds(user.uid);
                const savedMap = {};
                savedPostIds.forEach(id => { savedMap[id] = true; });
                setSavedPosts(savedMap);
            } catch (error) {
                console.error("Error fetching saved posts:", error);
            }
        };

        fetchPosts();
        fetchSavedPosts();
    }, [user?.uid, feedType]); // Re-fetch when user or feedType changes



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
