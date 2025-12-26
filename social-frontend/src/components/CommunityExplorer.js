import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const CommunityExplorer = ({ currentUser, onNavigate, onCommunityUpdate }) => {
    const [communities, setCommunities] = useState([]);

    useEffect(() => {
        const fetchCommunities = async () => {
            try {
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
    }, []);

    const handleJoinLeave = async (communityId, isMember) => {
        if (!currentUser) return;
        try {
            const response = await fetch(`${API_URL}/communities/${communityId}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: currentUser.uid })
            });

            if (response.ok) {
                // Update local state
                setCommunities(prev => prev.map(c => {
                    if (c.id === communityId) {
                        const newMembers = isMember
                            ? c.members.filter(uid => uid !== currentUser.uid)
                            : [...(c.members || []), currentUser.uid];
                        return { ...c, members: newMembers };
                    }
                    return c;
                }));
                // Update Sidebar
                if (onCommunityUpdate) onCommunityUpdate();
            }
        } catch (error) {
            console.error("Error toggling membership:", error);
        }
    };

    return (
        <main className="feed">
            <h1 style={{ marginBottom: '20px' }}>Explore Communities</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                {communities.map(community => {
                    const isMember = community.members && community.members.includes(currentUser?.uid);
                    return (
                        <div key={community.id} style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            border: '1px solid #eee',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <div style={{ height: '100px', backgroundColor: '#ddd', position: 'relative' }}>
                                {community.banner && <img src={community.banner} alt="banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                            </div>
                            <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '-40px', position: 'relative', zIndex: 1 }}>
                                <div style={{
                                    width: '70px', height: '70px', borderRadius: '50%', backgroundColor: 'white',
                                    border: '4px solid white', overflow: 'hidden', marginBottom: '10px'
                                }}>
                                    {community.avatar ? (
                                        <img src={community.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px' }}>👥</div>
                                    )}
                                </div>
                                <h3 style={{ margin: '0 0 5px 0', textAlign: 'center' }}>{community.name}</h3>
                                <p style={{ fontSize: '13px', color: '#666', textAlign: 'center', flex: 1, marginBottom: '15px' }}>{community.description}</p>

                                <button
                                    onClick={() => handleJoinLeave(community.id, isMember)}
                                    disabled={community.creatorId === currentUser?.uid}
                                    style={{
                                        width: '100%',
                                        padding: '8px 0',
                                        borderRadius: '20px',
                                        border: isMember ? '1px solid #ccc' : 'none',
                                        backgroundColor: community.creatorId === currentUser?.uid ? '#e0e0e0' : (isMember ? 'white' : 'var(--accent-color)'),
                                        color: community.creatorId === currentUser?.uid ? '#888' : (isMember ? '#666' : 'white'),
                                        fontWeight: 'bold',
                                        cursor: community.creatorId === currentUser?.uid ? 'default' : 'pointer'
                                    }}
                                >
                                    {community.creatorId === currentUser?.uid ? 'Owner' : (isMember ? 'Joined' : 'Join')}
                                </button>

                                <button
                                    onClick={() => onNavigate(`community-${community.id}`)}
                                    style={{
                                        marginTop: '8px',
                                        fontSize: '12px',
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--text-secondary)',
                                        cursor: 'pointer',
                                        textDecoration: 'underline'
                                    }}
                                >
                                    Visit
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </main>
    );
};

export default CommunityExplorer;
