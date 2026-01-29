import React, { useState, useEffect } from 'react';
import { updateCommunity } from '../services/communityService';

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

            await updateCommunity(community.id, updatePayload);

            if (onCommunityUpdate) onCommunityUpdate();
            setIsEditing(false);
            window.location.reload(); // Keep reload for now as agreed in original code comments
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
