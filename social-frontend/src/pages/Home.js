import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import Header from '../components/Header';

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
                    <span className="icon">🏠</span> Home
                </div>
                <div className="sidebar-item">
                    <span className="icon">🔥</span> Popular
                </div>
                <div className="sidebar-item">
                    <span className="icon">🌐</span> All
                </div>
            </div>

            <div className="sidebar-section">
                <h3 className="sidebar-title">COMMUNITIES</h3>
                <div className="sidebar-item">
                    <span className="icon">☕</span> r/cappucinos
                </div>
                <div className="sidebar-item">
                    <span className="icon">🥛</span> r/latteArt
                </div>
                <div className="sidebar-item">
                    <span className="icon">☕</span> r/coffeeChats
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

                // Map backend data to frontend format
                const formattedPosts = data.map(post => ({
                    id: post.id,
                    author: post.uid, // TODO: Fetch user details to show name
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

    const handleUpvote = async (postId) => {
        if (!isLoggedIn) return;

        // Optimistic update: +1
        setPosts(prevPosts => prevPosts.map(p => {
            if (p.id === postId) {
                return { ...p, votes: p.votes + 1 };
            }
            return p;
        }));

        try {
            const response = await fetch(`http://localhost:3001/api/posts/${postId}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    uid: user?.uid
                }),
            });

            if (!response.ok) {
                // If failed (e.g., already liked), revert the +1
                setPosts(prevPosts => prevPosts.map(p => {
                    if (p.id === postId) {
                        return { ...p, votes: p.votes - 1 };
                    }
                    return p;
                }));
            }
        } catch (error) {
            console.error("Error liking post:", error);
            // Revert on network error
            setPosts(prevPosts => prevPosts.map(p => {
                if (p.id === postId) {
                    return { ...p, votes: p.votes - 1 };
                }
                return p;
            }));
        }
    };

    const handleDownvote = async (postId) => {
        if (!isLoggedIn) return;

        // Optimistic update: -1
        setPosts(prevPosts => prevPosts.map(p => {
            if (p.id === postId) {
                return { ...p, votes: p.votes - 1 };
            }
            return p;
        }));

        try {
            const response = await fetch(`http://localhost:3001/api/posts/${postId}/like`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    uid: user?.uid
                }),
            });

            if (!response.ok) {
                // If failed (e.g., not liked yet), revert the -1
                setPosts(prevPosts => prevPosts.map(p => {
                    if (p.id === postId) {
                        return { ...p, votes: p.votes + 1 };
                    }
                    return p;
                }));
            }
        } catch (error) {
            console.error("Error unliking post:", error);
            // Revert on network error
            setPosts(prevPosts => prevPosts.map(p => {
                if (p.id === postId) {
                    return { ...p, votes: p.votes + 1 };
                }
                return p;
            }));
        }
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
                <div key={post.id} className="post-card">
                    <div className="post-sidebar">
                        <button className="vote-btn up" onClick={() => handleUpvote(post.id)}>▲</button>
                        <span className="vote-count">{post.votes >= 1000 ? (post.votes / 1000).toFixed(1) + 'k' : post.votes}</span>
                        <button className="vote-btn down" onClick={() => handleDownvote(post.id)}>▼</button>
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
                            <button className="action-btn">★ Save</button>
                        </div>

                        {expandedPostId === post.id && (
                            <div className="comments-section">
                                {loadingComments ? (
                                    <p>Loading comments...</p>
                                ) : (
                                    <>
                                        <div className="comments-list">
                                            {comments[post.id]?.map(comment => (
                                                <div key={comment.id} className="comment" style={{ marginLeft: comment.parentComment ? '20px' : '0' }}>
                                                    <span className="comment-author">{comment.uid}</span>
                                                    <p className="comment-text">{comment.text}</p>
                                                    <button
                                                        className="reply-btn"
                                                        style={{ fontSize: '0.8em', color: 'gray', background: 'none', border: 'none', cursor: 'pointer' }}
                                                        onClick={() => setReplyingTo({ commentId: comment.id, author: comment.uid })}
                                                    >
                                                        Reply
                                                    </button>
                                                </div>
                                            ))}
                                            {(!comments[post.id] || comments[post.id].length === 0) && (
                                                <p className="no-comments">No comments yet.</p>
                                            )}
                                        </div>
                                        {isLoggedIn && (
                                            <div className="add-comment">
                                                {replyingTo && (
                                                    <div className="replying-indicator">
                                                        Replying to {replyingTo.author}
                                                        <button onClick={() => setReplyingTo(null)} style={{ marginLeft: '5px' }}>x</button>
                                                    </div>
                                                )}
                                                <input
                                                    type="text"
                                                    value={newComment}
                                                    onChange={(e) => setNewComment(e.target.value)}
                                                    placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
                                                />
                                                <button onClick={() => handleAddComment(post.id)}>Post</button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
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

                    {/* Placeholder for right sidebar content like 'Recent' or 'Trending' */}
                    <div className="info-card">
                        <h3>BrewHub Premium</h3>
                        <p>The best social experience for developers.</p>
                        <button className="btn-primary">Try Now</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
