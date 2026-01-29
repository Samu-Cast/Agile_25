import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getUser, searchGlobal } from '../services/userService';
import { useChat } from '../context/ChatContext'; // Import
import '../styles/components/Header.css';

function Header({ onLoginClick, onLogoutClick, showProfile, isLoggedIn, currentUser, onCreatePostClick }) {
    // console.log('Header props:', { isLoggedIn, showProfile }); // debugging removed
    const location = useLocation();
    const navigate = useNavigate();
    const { toggleChat } = useChat(); // Destructure
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
                    const data = await getUser(currentUser.uid);
                    if (data) {
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

    // Debounced search - only query after user stops typing for 300ms
    useEffect(() => {
        if (searchQuery.length > 1) {
            const timer = setTimeout(async () => {
                try {
                    const results = await searchGlobal(searchQuery);
                    const profileResults = results.filter(r => ['user', 'bar', 'roaster'].includes(r.type));
                    setSearchResults(profileResults);
                    setShowDropdown(true);
                } catch (error) {
                    console.error('Search error:', error);
                }
            }, 300); // Wait 300ms after user stops typing

            return () => clearTimeout(timer);
        } else {
            setSearchResults([]);
            setShowDropdown(false);
        }
    }, [searchQuery]);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
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
                                    key={user.id || user.uid}
                                    className="search-result-item"
                                    onClick={() => handleUserClick(user.id || user.uid)}
                                >
                                    <img src={user.profilePic || "https://cdn-icons-png.flaticon.com/512/847/847969.png"} alt={user.nickname} />
                                    <div className="search-result-info">
                                        <span className="search-result-name">{user.nickname || user.name}</span>
                                        <span className="search-result-role">
                                            {user.role || (user.type === 'bar' ? 'Bar' : user.type === 'roaster' ? 'Torrefazione' : 'Appassionato')}
                                        </span>
                                        {(user.location || user.city) && (
                                            <span className="search-result-location">
                                                📍 {user.location || user.city}
                                            </span>
                                        )}
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

                {/* Chat Button */}
                {isLoggedIn && (
                    <button
                        className="btn-chat-icon"
                        onClick={toggleChat}
                        title="Messaggi"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                            <circle cx="8" cy="12" r="1" fill="currentColor" stroke="none"></circle>
                            <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"></circle>
                            <circle cx="16" cy="12" r="1" fill="currentColor" stroke="none"></circle>
                        </svg>
                    </button>
                )}

                {/* Create Post Button */}
                {isLoggedIn && (
                    <button className="btn-create-post" onClick={onCreatePostClick}>
                        <span style={{
                            marginRight: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: '1.5px solid currentColor',
                        }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </span>
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
