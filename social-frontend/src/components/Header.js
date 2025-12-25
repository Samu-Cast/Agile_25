import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { searchUsers } from '../services/userService';
import '../styles/components/Header.css';

function Header({ onLoginClick, onLogoutClick, showProfile, isLoggedIn, currentUser, onCreatePostClick }) {
    // console.log('Header props:', { isLoggedIn, showProfile }); // debugging removed
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

    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const profileRef = useRef(null);

    // Click outside handler for both search and profile dropdowns
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowProfileDropdown(false);
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

    const toggleProfileDropdown = () => {
        setShowProfileDropdown(!showProfileDropdown);
        setShowDropdown(false); // Close search dropdown if open
    };

    const handleLogoutWithClose = () => {
        setShowProfileDropdown(false);
        onLogoutClick();
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
                {!isLoggedIn && (
                    <button className="btn-login" onClick={onLoginClick}>Log In</button>
                )}

                {/* Create Post Button */}
                {isLoggedIn && (
                    <button className="btn-create-post" onClick={onCreatePostClick}>
                        <span style={{ fontSize: '20px', marginRight: '5px' }}>+</span>
                        <span style={{ fontWeight: '600' }}>Create</span>
                    </button>
                )}

                {/* Profile Dropdown */}
                {isLoggedIn && showProfile && currentUser && (
                    <div className="profile-dropdown-container" ref={profileRef}>
                        <button
                            className="profile-btn"
                            onClick={toggleProfileDropdown}
                            aria-label="Profile Menu"
                            style={{ border: 'none', padding: 0 }} /* Reset button styles for wrapper */
                        >
                            {userProfile?.photoURL || userProfile?.profilePic ? (
                                <img
                                    src={userProfile.photoURL || userProfile.profilePic}
                                    alt="Profile"
                                    className="profile-pic-img"
                                />
                            ) : (
                                <span role="img" aria-label="profile">👤</span>
                            )}
                        </button>

                        {showProfileDropdown && (
                            <div className="profile-dropdown">
                                <Link
                                    to="/profile"
                                    className="profile-dropdown-item"
                                    onClick={() => setShowProfileDropdown(false)}
                                >
                                    {userProfile?.photoURL || userProfile?.profilePic ? (
                                        <img
                                            src={userProfile.photoURL || userProfile.profilePic}
                                            alt="Profile"
                                            className="dropdown-profile-pic"
                                        />
                                    ) : (
                                        <span className="dropdown-icon">👤</span>
                                    )}
                                    Profile
                                </Link>
                                <Link
                                    to="/settings"
                                    className="profile-dropdown-item"
                                    onClick={() => setShowProfileDropdown(false)}
                                >
                                    <span className="dropdown-icon">⚙️</span> Settings
                                </Link>
                                <div className="dropdown-divider"></div>
                                <button
                                    className="profile-dropdown-item danger"
                                    onClick={handleLogoutWithClose}
                                >
                                    <span className="dropdown-icon">🚪</span> Log Out
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
}

export default Header;
