import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/components/CreateCommunityModal.css';

// eslint-disable-next-line no-unused-vars
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function CreateCommunityModal({ onClose, onSuccess }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const { currentUser } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!currentUser) {
            alert("You must be logged in.");
            return;
        }

        setLoading(true);

        try {
            // Hardcoding URL to rule out environmental issues
            const cleanUrl = 'http://localhost:3001/api/communities';
            console.log("Attempting fetch to:", cleanUrl);

            const response = await fetch(cleanUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                    // specific headers removed to ensure clean request
                },
                body: JSON.stringify({
                    name,
                    description,
                    creatorId: currentUser.uid
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create community');
            }

            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error("Error creating community:", error);
            alert(`Failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Create Community</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Coffee Lovers"
                            required
                            className="community-input"
                        />
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What is this community about?"
                            rows="3"
                            className="community-input"
                        />
                    </div>

                    <div className="modal-footer">
                        <button
                            type="submit"
                            disabled={loading}
                            className="submit-btn"
                        >
                            {loading ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateCommunityModal;
