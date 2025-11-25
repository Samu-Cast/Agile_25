import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

function Header({ onLoginClick, onLogoutClick, showProfile, isLoggedIn }) {
    return (
        <header className="header">
            <div className="navbar-logo">
                <span className="logo-text">BrewHub</span>
            </div>
            <div className="navbar-search">
                <input type="text" placeholder="Search BrewHub..." />
            </div>
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
