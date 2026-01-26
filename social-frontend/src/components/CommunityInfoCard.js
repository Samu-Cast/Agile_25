import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const CommunityInfoCard = ({ community, currentUser, onCommunityUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedDescription, setEditedDescription] = useState('');
    const [editedRules, setEditedRules] = useState([]);

    useEffect(() => {
        if (community) {
            setEditedDescription(community.description || '');
            setEditedRules(community.rules || []);
        }
    }, [community]);

    if (!community) return null;

    const isOwner = currentUser?.uid === community.creatorId;
    const creationDate = new Date(community.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    const handleAddRule = () => {
        setEditedRules([...editedRules, 'New rule']);
    };

    const handleRuleChange = (index, value) => {
        const newRules = [...editedRules];
        newRules[index] = value;
        setEditedRules(newRules);
    };

    const handleRemoveRule = (index) => {
        const newRules = editedRules.filter((_, i) => i !== index);
        setEditedRules(newRules);
    };

    const handleSave = async () => {
        try {
            const updatePayload = {
                description: editedDescription,
                rules: editedRules.filter(r => r.trim() !== ''), // Filter empty
                updaterId: currentUser.uid
            };

            const response = await fetch(`${API_URL}/communities/${community.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatePayload)
            });

            if (!response.ok) throw new Error('Failed to update');

            // Optimistic update via valid callback or simple UI switch
            // ideally we call onCommunityUpdate to refresh parent data
            if (onCommunityUpdate) onCommunityUpdate();
            // Since we can't easily push data UP to Home -> CommunityFeed without refetch 
            // (Home doesn't fetch, Feed does), we might get stale data if we don't handle it carefully.
            // But visually updating local state/props is handled by parent re-render? 
            // Actually Home passes `currentCommunity`. We need to mutate that or wait for re-fetch.
            // For now, toggle editing off. The user will see 'community' prop updates IF parent fetches.
            // But parent (Home) gets it from Feed. Feed fetches. Feed needs to refetch.
            // `onCommunityUpdate` in Home triggers `sidebarRefresh` which triggers Sidebar fetch. 
            // It does NOT trigger CommunityFeed fetch.
            // We should probably rely on a location reload or just optimistic local display if possible, 
            // but `community` prop comes from parent.
            // Let's rely on the fact that if we update, maybe we just show the edited values until refresh?
            // No, better to try to trigger a refresh.

            // Force reload for now to be safe/simple, or just update local if parent doesn't.
            // Actually, we can just update the `community` object in place in memory if it's a prop reference? No, immutable.
            setIsEditing(false);
            window.location.reload(); // Simplest way to ensure sync for now given the architecture
        } catch (error) {
            console.error("Error saving community info:", error);
            alert("Failed to save changes");
        }
    };

    return (
        <div className="info-card" style={{ marginBottom: '20px', position: 'relative', textAlign: 'left' }}>
            {isOwner && !isEditing && (
                <button
                    onClick={() => setIsEditing(true)}
                    style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                    title="Edit Info"
                >
                    ✏️
                </button>
            )}

            <h3 style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '12px' }}>About Community</h3>

            {/* Description */}
            <div style={{ marginBottom: '16px', fontSize: '14px', lineHeight: '1.5' }}>
                {isEditing ? (
                    <textarea
                        value={editedDescription}
                        onChange={(e) => setEditedDescription(e.target.value)}
                        style={{ width: '100%', minHeight: '80px', padding: '8px', borderRadius: '8px', border: '1px solid #ddd', fontFamily: 'inherit' }}
                    />
                ) : (
                    community.description || "No description provided."
                )}
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '14px' }}>
                <span style={{ fontSize: '16px' }}>📅</span>
                <span>Created {creationDate}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '14px' }}>
                <span style={{ fontSize: '16px' }}>👥</span>
                <span>{community.members ? community.members.length : 1} Members</span>
            </div>

            <div style={{ borderTop: '1px solid #eee', margin: '12px 0' }}></div>

            {/* Rules */}
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '12px' }}>Rules</h3>
            <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                {isEditing ? (
                    <div>
                        {editedRules.map((rule, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                <input
                                    type="text"
                                    value={rule}
                                    onChange={(e) => handleRuleChange(idx, e.target.value)}
                                    style={{ flex: 1, padding: '4px 8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                />
                                <button onClick={() => handleRemoveRule(idx)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
                            </div>
                        ))}
                        <button onClick={handleAddRule} style={{ fontSize: '12px', color: 'var(--accent-color)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>+ Add Rule</button>
                    </div>
                ) : (
                    community.rules && community.rules.length > 0 ? (
                        <ul style={{ paddingLeft: '20px', margin: 0, textAlign: 'left' }}>
                            {community.rules.map((rule, idx) => (
                                <li key={idx} style={{ marginBottom: '6px' }}>{rule}</li>
                            ))}
                        </ul>
                    ) : (
                        <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No rules established yet.</p>
                    )
                )}
            </div>

            {isEditing && (
                <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                    <button
                        onClick={handleSave}
                        className="btn-primary"
                        style={{ padding: '8px', fontSize: '14px', marginTop: 0 }}
                    >
                        Save Changes
                    </button>
                    <button
                        onClick={() => setIsEditing(false)}
                        style={{ padding: '8px 16px', border: '1px solid #ddd', borderRadius: '20px', background: 'white', cursor: 'pointer' }}
                    >
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );
};

export default CommunityInfoCard;
