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
                    <span className="icon">💻</span> r/programming
                </div>
                <div className="sidebar-item">
                    <span className="icon">🎨</span> r/design
                </div>
                <div className="sidebar-item">
                    <span className="icon">🚀</span> r/startups
                </div>
            </div>
        </aside>
    );
};

const Feed = ({ posts }) => {
    return (
        <main className="feed">
            {posts.map(post => (
                <div key={post.id} className="post-card">
                    <div className="post-sidebar">
                        <button className="vote-btn up">▲</button>
                        <span className="vote-count">{post.votes >= 1000 ? (post.votes / 1000).toFixed(1) + 'k' : post.votes}</span>
                        <button className="vote-btn down">▼</button>
                    </div>
                    <div className="post-content">
                        <div className="post-header">
                            <span className="post-author">{post.author}</span>
                            <span className="post-time">• {post.time}</span>
                        </div>
                        <h3 className="post-title">{post.title}</h3>
                        <p className="post-text">{post.content}</p>
                        <div className="post-footer">
                            <button className="action-btn">💬 {post.comments} Comments</button>
                            <button className="action-btn">↗ Share</button>
                            <button className="action-btn">★ Save</button>
                        </div>
                    </div>
                </div>
            ))}
        </main>
    );
};

const Home = ({ onLoginClick, isLoggedIn, posts }) => {
    return (
        <div className="home-layout">
            <div className="main-container">
                <Sidebar />
                <Feed posts={posts} />
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
