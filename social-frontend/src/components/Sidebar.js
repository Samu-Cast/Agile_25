import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import CreateCommunityModal from './CreateCommunityModal';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const Sidebar = ({ activeFeed, onFeedChange, refreshTrigger }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [communities, setCommunities] = useState([]);
    const [isCreateCommunityOpen, setIsCreateCommunityOpen] = useState(false);
    const { currentUser } = useAuth();

    useEffect(() => {
        const fetchCommunities = async () => {
            if (!currentUser) return;
            try {
                // Fetch all communities (simplification for now, user should see all or joined)
                const response = await fetch(`${API_URL}/communities`);
                if (response.ok) {
                    const data = await response.json();
                    setCommunities(data);
                }
            } catch (error) {
                console.error("Error fetching communities:", error);
            }
        };
        fetchCommunities();
    }, [currentUser, isCreateCommunityOpen, refreshTrigger]); // Reload when new one created or triggered

    return (
        <>
            <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-scroll-area">
                    <div className="sidebar-section">
                        <div
                            className={`sidebar-item ${activeFeed === 'home' ? 'active' : ''}`}
                            onClick={() => onFeedChange('home')}
                        >
                            <span className="icon">🏠</span>
                            <span className="sidebar-label">Home</span>
                        </div>
                        <div
                            className={`sidebar-item ${activeFeed === 'popular' ? 'active' : ''}`}
                            onClick={() => onFeedChange('popular')}
                        >
                            <span className="icon">🔥</span>
                            <span className="sidebar-label">Popular</span>
                        </div>
                        <div
                            className={`sidebar-item ${activeFeed === 'all' ? 'active' : ''}`}
                            onClick={() => onFeedChange('all')}
                        >
                            <span className="icon">♾️</span>
                            <span className="sidebar-label">All</span>
                        </div>
                    </div>

                    <div className="sidebar-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: '12px' }}>
                            <h3 className={`sidebar-title ${isCollapsed ? 'hidden' : ''}`}>COMMUNITIES</h3>
                            {!isCollapsed && (
                                <button
                                    className="create-community-btn-small"
                                    onClick={(e) => { e.stopPropagation(); setIsCreateCommunityOpen(true); }}
                                    title="Create Community"
                                >
                                    +
                                </button>
                            )}
                        </div>

                        {/* Explore Item */}
                        <div
                            className={`sidebar-item ${activeFeed === 'explore' ? 'active' : ''}`}
                            onClick={() => onFeedChange('explore')}
                        >
                            <span className="icon">🔍</span>
                            <span className="sidebar-label">Explore</span>
                        </div>

                        {/* MY COMMUNITIES (Created by me) */}
                        {currentUser && communities.some(c => c.creatorId === currentUser.uid) && (
                            <>
                                <div style={{
                                    padding: '10px 12px 5px',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    color: 'var(--text-secondary)',
                                    display: isCollapsed ? 'none' : 'block'
                                }}>
                                    MY COMMUNITIES
                                </div>
                                {communities
                                    .filter(c => c.creatorId === currentUser.uid)
                                    .map(community => (
                                        <div
                                            key={community.id}
                                            className={`sidebar-item ${activeFeed === `community-${community.id}` ? 'active' : ''}`}
                                            onClick={() => onFeedChange(`community-${community.id}`)}
                                        >
                                            {community.avatar ? (
                                                <img src={community.avatar} alt={community.name} className="icon" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                                            ) : (
                                                <span className="icon">👑</span>
                                            )}
                                            <span className="sidebar-label">{community.name}</span>
                                        </div>
                                    ))}
                            </>
                        )}

                        {/* FOLLOWING (Joined but not created) */}
                        {currentUser && communities.some(c => c.members?.includes(currentUser.uid) && c.creatorId !== currentUser.uid) && (
                            <>
                                <div style={{
                                    padding: '10px 12px 5px',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    color: 'var(--text-secondary)',
                                    display: isCollapsed ? 'none' : 'block'
                                }}>
                                    FOLLOWING
                                </div>
                                {communities
                                    .filter(c => c.members?.includes(currentUser.uid) && c.creatorId !== currentUser.uid)
                                    .map(community => (
                                        <div
                                            key={community.id}
                                            className={`sidebar-item ${activeFeed === `community-${community.id}` ? 'active' : ''}`}
                                            onClick={() => onFeedChange(`community-${community.id}`)}
                                        >
                                            {community.avatar ? (
                                                <img src={community.avatar} alt={community.name} className="icon" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                                            ) : (
                                                <span className="icon">👥</span>
                                            )}
                                            <span className="sidebar-label">{community.name}</span>
                                        </div>
                                    ))}
                            </>
                        )}

                        {communities.filter(c => c.members && currentUser && c.members.includes(currentUser.uid)).length === 0 && !isCollapsed && (
                            <div style={{ padding: '0 12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                Not following any communities.
                            </div>
                        )}
                    </div>
                </div>
                <button
                    className="sidebar-toggle"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    aria-label="Toggle Sidebar"
                >
                    {isCollapsed ? '›' : '‹'}
                </button>
            </aside>

            {isCreateCommunityOpen && (
                <CreateCommunityModal
                    onClose={() => setIsCreateCommunityOpen(false)}
                    onSuccess={() => setIsCreateCommunityOpen(false)} // Trigger re-render effect via dependency
                />
            )}
        </>
    );
};

export default Sidebar;
