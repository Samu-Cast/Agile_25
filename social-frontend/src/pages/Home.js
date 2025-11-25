import React from 'react';

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
                    <span className="icon"></span> r/programming
                </div>
                <div className="sidebar-item">
                    <span className="icon"></span> r/design
                </div>
                <div className="sidebar-item">
                    <span className="icon"></span> r/startups
                </div>
            </div>
        </aside>
    );
};

const Feed = ({ posts, loading, onVote, currentUser }) => {
    if (loading) {
        return (
            <main className="feed">
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    Caricamento post...
                </div>
            </main>
        );
    }

    if (posts.length === 0) {
        return (
            <main className="feed">
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    Nessun post disponibile. Crea il primo! ☕
                </div>
            </main>
        );
    }

    return (
        <main className="feed">
            {posts.map(post => {
                const userId = currentUser?.email;
                const userVote = post.votedBy && userId ? post.votedBy[userId] : null;

                return (
                    <div key={post.id} className="post-card">
                        <div className="post-header">
                            <span className="post-author">{post.author}</span>
                            <span className="post-time">• {post.time}</span>
                        </div>

                        <div className="post-content">
                            <h3 className="post-title">{post.title}</h3>
                            <p className="post-text">{post.content}</p>

                            {/* Display image if present */}
                            {post.imageUrl && (
                                <img
                                    src={String(post.imageUrl)}
                                    alt={post.title}
                                    className="post-image"
                                />
                            )}
                        </div>

                        <div className="post-footer">
                            <div className="vote-actions">
                                <button
                                    className={`vote-btn up ${Number(userVote) === 1 ? 'active' : ''}`}
                                    onClick={(e) => { e.stopPropagation(); onVote(post.id, 1); }}
                                    title="Upvote"
                                >
                                    ▲
                                </button>
                                <span className="vote-count">{post.votes >= 1000 ? (post.votes / 1000).toFixed(1) + 'k' : post.votes}</span>
                                <button
                                    className={`vote-btn down ${Number(userVote) === -1 ? 'active' : ''}`}
                                    onClick={(e) => { e.stopPropagation(); onVote(post.id, -1); }}
                                    title="Downvote"
                                >
                                    ▼
                                </button>
                            </div>

                            <div className="social-actions">
                                <button className="action-btn" onClick={() => window.location.href = `/post/${post.id}`}>
                                    💬 {post.comments || 0} Comments
                                </button>
                                <button className="action-btn">↗ Share</button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </main>
    );
};

const Home = ({ onLoginClick, isLoggedIn, posts, loading, onVote, currentUser, refreshPosts }) => {
    return (
        <div className="home-layout">
            <div className="main-container">
                <Sidebar />
                <Feed posts={posts} loading={loading} onVote={onVote} currentUser={currentUser} />
                <div className="right-sidebar">
                    {/* Create Post button - only visible when logged in */}
                    {isLoggedIn && (
                        <div className="info-card">
                            <h3>Create Post</h3>
                            <p>Share your thoughts with the community.</p>
                            <a href="/create-post" className="btn-primary" style={{ textDecoration: 'none', textAlign: 'center' }}>
                                + New Post
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Home;
