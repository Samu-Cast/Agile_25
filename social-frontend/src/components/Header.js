import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { searchUsers } from '../services/userService';
import './Header.css';

function Header({ onLoginClick, onLogoutClick, showProfile, isLoggedIn, currentUser }) {
    const location = useLocation();
    const navigate = useNavigate();
    const hideSearch = location.pathname === '/forgot-password';

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const searchRef = useRef(null);
    const [userProfile, setUserProfile] = useState(null);

    // Fetch complete user profile data from backend
    useEffect(() => {
        const fetchUserProfile = async () => {
            if (currentUser?.uid) {
                try {
                    const response = await fetch(`http://localhost:3001/api/users/${currentUser.uid}`);
                    if (response.ok) {
                        const data = await response.json();
                        setUserProfile(data);
                    }
                } catch (error) {
                    console.error('[Header] Error fetching user profile:', error);
                }
            }
        };
        fetchUserProfile();
    }, [currentUser?.uid]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSearchChange = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (query.length > 1) {
            const results = await searchUsers(query);
            setSearchResults(results);
            setShowDropdown(true);
        } else {
            setSearchResults([]);
            setShowDropdown(false);
        }
    };

    const handleUserClick = (uid) => {
        navigate(`/profile/${uid}`);
        setShowDropdown(false);
        setSearchQuery('');
    };

    return (
        <header className="header">
            <div className="navbar-logo">
                <Link to="/" className="logo-link" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <span className="logo-text">BrewHub</span>
                </Link>
            </div>
            {!hideSearch && (
                <div className="navbar-search" ref={searchRef}>
                    <input
                        type="text"
                        placeholder="Search BrewHub..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onFocus={() => searchQuery.length > 1 && setShowDropdown(true)}
                    />
                    {showDropdown && searchResults.length > 0 && (
                        <div className="search-dropdown">
                            {searchResults.map(user => (
                                <div
                                    key={user.uid}
                                    className="search-result-item"
                                    onClick={() => handleUserClick(user.uid)}
                                >
                                    <img src={user.profilePic || "https://cdn-icons-png.flaticon.com/512/847/847969.png"} alt={user.nickname} />
                                    <div className="search-result-info">
                                        <span className="search-result-name">{user.nickname || user.name}</span>
                                        <span className="search-result-role">{user.role || 'Appassionato'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            <div className="navbar-actions">
                {isLoggedIn ? (
                    <button className="btn-login" onClick={onLogoutClick}>Log Out</button>
                ) : (
                    <button className="btn-login" onClick={onLoginClick}>Log In</button>
                )}
                {showProfile && currentUser && (
                    <Link to="/profile" className="profile-btn" aria-label="Profile">
                        {userProfile?.photoURL || userProfile?.profilePic ? (
                            <img
                                src={userProfile.photoURL || userProfile.profilePic}
                                alt="Profile"
                                className="profile-pic-img"
                            />
                        ) : (
                            <span role="img" aria-label="profile">👤</span>
                        )}
                    </Link>
                )}
            </div>
        </header>
    );
}

export default Header;
