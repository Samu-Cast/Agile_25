import React from 'react';
import { Link } from 'react-router-dom';
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
    const [comments, setComments] = React.useState({});
    const [newComment, setNewComment] = React.useState("");
    const [replyingTo, setReplyingTo] = React.useState(null); // { commentId, author }
    const [loadingComments, setLoadingComments] = React.useState(false);

    React.useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await fetch('http://localhost:3001/api/posts');
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();

                // Extract unique UIDs
                const uids = [...new Set(data.map(post => post.uid))];
                const users = await getUsersByUids(uids);
                const userMap = {};
                users.forEach(u => {
                    userMap[u.uid] = u.nickname || u.name;
                });

                // Map backend data to frontend format
                const formattedPosts = data.map(post => ({
                    id: post.id,
                    author: post.uid,
                    authorName: userMap[post.uid] || post.uid, // Use name/nickname if available
                    time: new Date(post.createdAt).toLocaleDateString(), // Simple formatting
                    title: post.text ? (post.text.substring(0, 50) + (post.text.length > 50 ? "..." : "")) : "No Title",
                    content: post.text,
                    image: post.imageUrl,
                    votes: post.likesCount || 0,
                    comments: post.commentsCount || 0
                }));

                setPosts(formattedPosts);
            } catch (error) {
                console.error("Error fetching posts:", error);
            }
        };

        fetchPosts();
    }, []);

    const toggleComments = async (postId) => {
        if (expandedPostId === postId) {
            setExpandedPostId(null);
            return;
        }

        setExpandedPostId(postId);
        setLoadingComments(true);
        try {
            const response = await fetch(`http://localhost:3001/api/posts/${postId}/comments`);
            const data = await response.json();
            setComments(prev => ({ ...prev, [postId]: data }));
        } catch (error) {
            console.error("Error fetching comments:", error);
        } finally {
            setLoadingComments(false);
        }
    };

    const handleVote = async (postId, type) => {
        if (!isLoggedIn) return;

        // Optimistic update
        setPosts(prevPosts => prevPosts.map(p => {
            if (p.id === postId) {
                return { ...p, votes: p.votes + (type === 'up' ? 1 : -1) };
            }
            return p;
        }));

        try {
            const method = type === 'up' ? 'POST' : 'DELETE';
            const response = await fetch(`http://localhost:3001/api/posts/${postId}/like`, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    uid: user?.uid
                }),
            });

            if (!response.ok) {
                // Revert
                setPosts(prevPosts => prevPosts.map(p => {
                    if (p.id === postId) {
                        return { ...p, votes: p.votes - (type === 'up' ? 1 : -1) };
                    }
                    return p;
                }));
            }
        } catch (error) {
            console.error(`Error ${type}voting post:`, error);
            // Revert
            setPosts(prevPosts => prevPosts.map(p => {
                if (p.id === postId) {
                    return { ...p, votes: p.votes - (type === 'up' ? 1 : -1) };
                }
                return p;
            }));
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


    const handleAddComment = async (postId) => {
        if (!newComment.trim()) return;

        try {
            const response = await fetch(`http://localhost:3001/api/posts/${postId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: newComment,
                    uid: user?.uid,
                    parentComment: replyingTo ? replyingTo.commentId : null
                }),
            });

            if (response.ok) {
                const addedComment = await response.json();
                setComments(prev => ({
                    ...prev,
                    [postId]: [...(prev[postId] || []), addedComment]
                }));
                setNewComment("");
                setReplyingTo(null);

                // Update comment count locally
                setPosts(prevPosts => prevPosts.map(p => {
                    if (p.id === postId) {
                        return { ...p, comments: (p.comments || 0) + 1 };
                    }
                    return p;
                }));
            }
        } catch (error) {
            console.error("Error adding comment:", error);
        }
    };

    return (
        <main className="feed">
            {posts.map(post => (
                <PostCard
                    key={post.id}
                    post={post}
                    user={user}
                    onVote={handleVote}
                    onComment={handleCommentUpdate}
                />
            ))}
        </main>
    );
};

const Home = ({ onLoginClick, isLoggedIn }) => {
    return (
        <div className="home-layout">
            <div className="main-container">
                <Sidebar />
                <Feed isLoggedIn={isLoggedIn} user={{ uid: "2jhOxL66yldZ6PbXUOj4p9iwmfd2", displayName: "Sam" }} />
                {/* TODO: Pass actual user object from context/props */}
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
