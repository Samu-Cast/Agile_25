import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

function Header({ onLoginClick, onLogoutClick, showProfile, isLoggedIn }) {
    const location = useLocation();
    const hideSearch = location.pathname === '/forgot-password';

    return (
        <header className="header">
            <div className="navbar-logo">
                <Link to="/" className="logo-link" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <span className="logo-text">BrewHub</span>
                </Link>
            </div>
            {!hideSearch && (
                <div className="navbar-search">
                    <input type="text" placeholder="Search BrewHub..." />
                </div>
            )}
            <div className="navbar-actions">
                {isLoggedIn ? (
                    <button className="btn-login" onClick={onLogoutClick}>Log Out</button>
                ) : (
                    <button className="btn-login" onClick={onLoginClick}>Log In</button>
                )}
                {showProfile && (
                    <Link to="/profile" className="profile-btn" aria-label="Profile">
                        <span role="img" aria-label="profile">👤</span>
                    </Link>
                )}
            </div>
        </header>
    );
}

export default Header;
