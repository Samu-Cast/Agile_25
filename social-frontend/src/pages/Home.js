import React from 'react';
import { Link } from 'react-router-dom';
import CommentSection from '../components/CommentSection';
import StarRating from '../components/StarRating';
import { updateRating, toggleSavePost } from '../services/postService';
import { useAuth } from '../context/AuthContext';
import './Home.css';
import PostCard from '../components/PostCard';
import { getUsersByUids } from '../services/userService';

const Navbar = ({ onLoginClick }) => {
    return (
        <nav className="navbar">
            <div className="navbar-logo">
                <span className="logo-text">BrewHub</span>
            </div>
            <div className="navbar-search">
                <input type="text" placeholder="Search BrewHub..." />
            </div>
            <div className="navbar-actions">
                <button className="btn-login" onClick={onLoginClick}>
                    Log In
                </button>
                <button className="btn-icon">
                    ⋯
                </button>
            </div>
        </nav>
    );
};

const Sidebar = () => {
    return (
        <aside className="sidebar">
            <div className="sidebar-section">
                <div className="sidebar-item active">
                    <span className="icon"></span> Home
                </div>
                <div className="sidebar-item">
                    <span className="icon"></span> Popular
                </div>
                <div className="sidebar-item">
                    <span className="icon"></span> All
                </div>
            </div>

            <div className="sidebar-section">
                <h3 className="sidebar-title">COMMUNITIES</h3>
                <div className="sidebar-item">
                    <span className="icon"></span> cappucinos
                </div>
                <div className="sidebar-item">
                    <span className="icon"></span> latteArt
                </div>
                <div className="sidebar-item">
                    <span className="icon"></span> coffeeChats
                </div>
            </div>
        </aside>
    );
};

const Feed = ({ isLoggedIn, user }) => {
    const [posts, setPosts] = React.useState([]);
    const [expandedPostId, setExpandedPostId] = React.useState(null);
    // Local state to track user votes: { [postId]: 1 (up) | -1 (down) | 0 (none) }
    const [userVotes, setUserVotes] = React.useState({});
    // Local state to track saved posts: { [postId]: true/false }
    const [savedPosts, setSavedPosts] = React.useState({});

    React.useEffect(() => {
        const fetchPosts = async () => {
            try {
                const url = user?.uid
                    ? `http://localhost:3001/api/posts?uid=${user.uid}`
                    : 'http://localhost:3001/api/posts';

                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();

                // Initialize votes state
                const initialVotes = {};

                // Extract unique UIDs
                const uids = [...new Set(data.map(post => post.uid))];
                const users = await getUsersByUids(uids);
                const userMap = {};
                users.forEach(u => {
                    userMap[u.uid] = u.nickname || u.name;
                });

                // Map backend data to frontend format
                const formattedPosts = data.map(post => {
                    // Set initial vote state for this post
                    if (post.userVote) {
                        initialVotes[post.id] = post.userVote;
                    }

                    return {
                        id: post.id,
                        author: userMap[post.uid] || post.uid,
                        authorId: post.uid,
                        time: new Date(post.createdAt).toLocaleDateString(),
                        title: post.text ? (post.text.substring(0, 50) + (post.text.length > 50 ? "..." : "")) : "No Title",
                        content: post.text,
                        image: post.imageUrl,
                        votes: post.likesCount || 0,
                        comments: post.commentsCount || 0,
                        ratingBy: post.ratingBy || {} // Ensure ratingBy is passed
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
                const response = await fetch(`http://localhost:3001/api/users/${user.uid}/savedPosts`);
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
    }, [user?.uid]); // Re-fetch when user changes

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
            await fetch(`http://localhost:3001/api/posts/${postId}/like`, {
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
            await fetch(`http://localhost:3001/api/posts/${postId}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: user?.uid, value: -1 }),
            });
        } catch (error) {
            console.error("Error unliking post:", error);
        }
    };

    const handleCommentUpdate = (postId) => {
        setPosts(prevPosts => prevPosts.map(p => {
            if (p.id === postId) {
                return { ...p, comments: (p.comments || 0) + 1 };
            }
            return p;
        }));
    };

    const handleRatingChange = async (postId, newRating) => {
        if (!isLoggedIn || !user?.uid) return;

        // Optimistic update
        setPosts(prevPosts => prevPosts.map(p => {
            if (p.id === postId) {
                const newRatingBy = { ...p.ratingBy, [user.uid]: newRating };
                return { ...p, ratingBy: newRatingBy };
            }
            return p;
        }));

        try {
            await updateRating(postId, user.uid, newRating);
        } catch (error) {
            console.error("Error updating rating:", error);
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
                const userVote = userVotes[post.id] || 0;

                return (
                    <div key={post.id} className="post-card">
                        <div className="post-sidebar">
                            <button
                                className={`vote-btn up ${userVote === 1 ? 'active' : ''}`}
                                onClick={() => handleVote(post.id)}
                                style={{ color: userVote === 1 ? '#4169E1' : '' }}
                            >
                                ▲
                            </button>
                            <span className="vote-count">{post.votes >= 1000 ? (post.votes / 1000).toFixed(1) + 'k' : post.votes}</span>
                            <button
                                className={`vote-btn down ${userVote === -1 ? 'active' : ''}`}
                                onClick={() => handleDownvote(post.id)}
                                style={{ color: userVote === -1 ? '#4169E1' : '' }}
                            >
                                ▼
                            </button>
                        </div>
                        <div className="post-content">
                            <div className="post-header">
                                <span className="post-author">{post.author}</span>
                                <span className="post-time">• {post.time}</span>
                            </div>
                            <h3 className="post-title">{post.title}</h3>
                            {post.image && <img src={post.image} alt="Post content" className="post-image" />}
                            <p className="post-text">{post.content}</p>
                            <div className="post-footer">
                                <button className="action-btn" onClick={() => toggleComments(post.id)}>
                                    💬 {post.comments} Comments
                                </button>
                                <button className="action-btn">↗ Share</button>
                                <button
                                    className="action-btn"
                                    onClick={() => handleToggleSave(post.id)}
                                    style={{ color: savedPosts[post.id] ? '#FFD700' : 'inherit' }}
                                >
                                    {savedPosts[post.id] ? '🔖' : '📑'} {savedPosts[post.id] ? 'Salvato' : 'Salva'}
                                </button>
                                <StarRating
                                    postId={post.id}
                                    userRatingMap={post.ratingBy || {}}
                                    currentUserId={user?.uid}
                                    onRatingChange={handleRatingChange}
                                />
                            </div>
                            {expandedPostId === post.id && (
                                <CommentSection postId={post.id} currentUser={user} />
                            )}
                        </div>
                    </div>
                );
            })}
        </main>
    );
};



const Home = ({ onLoginClick, isLoggedIn }) => {
    const { currentUser } = useAuth();

    return (
        <div className="home-layout">
            <div className="main-container">
                <Sidebar />
                <Feed isLoggedIn={isLoggedIn} user={currentUser} />
                <div className="right-sidebar">
                    {/* Create Post button - only visible when logged in */}
                    {isLoggedIn && (
                        <div className="info-card">
                            <h3>Create Post</h3>
                            <p>Share your thoughts with the community.</p>
                            <Link to="/create-post" className="btn-primary" style={{ textDecoration: 'none', textAlign: 'center' }}>
                                + New Post
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Home;
