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

const Feed = () => {
    const posts = [
        {
            id: 1,
            author: "u/dev_master",
            time: "4h ago",
            title: "What is the best way to handle state in 2025?",
            content: "I've been using Redux for years, but with the new React hooks and Context API updates, I'm wondering if it's still the go-to solution...",
            votes: 1240,
            comments: 342
        },
        {
            id: 2,
            author: "u/design_guru",
            time: "6h ago",
            title: "Check out this new UI kit I made!",
            content: "It's based on the latest neomorphism trends but with a flat twist. Let me know what you think!",
            votes: 856,
            comments: 120
        },
        {
            id: 3,
            author: "u/startup_joe",
            time: "12h ago",
            title: "We just launched our MVP!",
            content: "After 6 months of hard work, we are finally live. Check it out and give us feedback.",
            votes: 2100,
            comments: 560
        }
    ];

    return (
        <main className="feed">
            {posts.map(post => (
                <div key={post.id} className="post-card">
                    <div className="post-sidebar">
                        <button className="vote-btn up">▲</button>
                        <span className="vote-count">{(post.votes / 1000).toFixed(1)}k</span>
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

const Home = ({ onLoginClick }) => {
    return (
        <div className="home-layout">
            <div className="main-container">
                <Sidebar />
                <Feed />
                <div className="right-sidebar">
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
