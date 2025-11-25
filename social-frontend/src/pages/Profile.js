import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUserData } from '../hooks/useUserData';
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import './Profile.css';

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/847/847969.png";

function Profile() {
    const { currentUser } = useAuth();
    const user = useUserData();
    const [activeTab, setActiveTab] = useState('posts');
    const [isEditing, setIsEditing] = useState(false);

    // Edit Form State
    const [editForm, setEditForm] = useState({
        name: '',
        bio: '',
        profilePic: ''
    });

    useEffect(() => {
        if (user) {
            setEditForm({
                name: user.name || '',
                bio: user.bio || '',
                profilePic: user.profilePic || DEFAULT_AVATAR
            });
        }
    }, [user]);

    const handleEditClick = () => {
        setEditForm({
            name: user.name || '',
            bio: user.bio || '',
            profilePic: user.profilePic || DEFAULT_AVATAR
        });
        setIsEditing(true);
    };

    const handleCloseDrawer = () => {
        setIsEditing(false);
    };

    const handleSave = async () => {
        if (!currentUser) return;

        try {
            const ref = doc(db, "users", currentUser.uid);
            await updateDoc(ref, {
                name: editForm.name,
                bio: editForm.bio,
                profilePic: editForm.profilePic
            });
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating profile:", error);
            // Handle error (maybe show a toast)
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const fileInputRef = useRef(null);

    const handleImageClick = () => {
        fileInputRef.current.click();
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                // setUser(prev => ({ ...prev, profilePic: reader.result })); // Removed local set
                setEditForm(prev => ({ ...prev, profilePic: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    // Mock Content Data
    const posts = [
        { id: 1, title: "Perfect Espresso", image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400", type: "Post" },
        { id: 2, title: "Latte Art Practice", image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400", type: "Post" },
        { id: 3, title: "New Beans Arrived", image: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400", type: "Post" },
    ];

    const reviews = [
        { id: 1, title: "Blue Mountain Review", image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400", type: "Review" },
        { id: 2, title: "Local Roastery Visit", image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400", type: "Review" },
    ];

    const guides = [
        { id: 1, title: "V60 Brewing Guide", image: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=400", type: "Guide" },
    ];

    const renderContent = () => {
        let data = [];
        if (activeTab === 'posts') data = posts;
        if (activeTab === 'reviews') data = reviews;
        if (activeTab === 'guides') data = guides;

        return (
            <div className="profile-content-grid">
                {data.map(item => (
                    <div key={item.id} className="content-item">
                        <img src={item.image} alt={item.title} className="content-image" />
                        <div className="content-info">
                            <h3 className="content-title">{item.title}</h3>
                            <p className="content-preview">{item.type}</p>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    if (!user) return <div>Loading...</div>;

    return (
        <div className="profile-container">
            {/* Header Section */}
            <div className="profile-header">
                <button className="edit-profile-btn" onClick={handleEditClick} title="Modifica Profilo">
                    ✎
                </button>
                <div className="profile-pic-container" onClick={handleImageClick} style={{ cursor: 'pointer' }}>
                    <img src={user.profilePic || DEFAULT_AVATAR} alt={user.name} className="profile-pic" />
                    <div className="profile-pic-overlay">
                        <span>Cambia Foto</span>
                    </div>
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                    accept="image/*"
                />
                <div className="profile-info">
                    <div className="profile-name-row">
                        <h1 className="profile-name">{user.name}</h1>
                        <span className={`role-tag ${String(user.role || 'Appassionato').toLowerCase()}`}>{user.role || 'Appassionato'}</span>
                    </div>
                    <p className="profile-bio">{user.bio}</p>
                </div>
            </div>

            {/* Stats Row */}
            <div className="profile-stats">
                <div className="stat-item">
                    <span className="stat-value">{user.stats?.posts || 0}</span>
                    <span className="stat-label">Post</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">{user.stats?.followers || 0}</span>
                    <span className="stat-label">Follower</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">{user.stats?.following || 0}</span>
                    <span className="stat-label">Following</span>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="profile-tabs">
                <button
                    className={`tab-button ${activeTab === 'posts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('posts')}
                >
                    Post
                </button>
                <button
                    className={`tab-button ${activeTab === 'reviews' ? 'active' : ''}`}
                    onClick={() => setActiveTab('reviews')}
                >
                    Recensioni
                </button>
                <button
                    className={`tab-button ${activeTab === 'guides' ? 'active' : ''}`}
                    onClick={() => setActiveTab('guides')}
                >
                    Guide
                </button>
            </div>

            {/* Content Area */}
            {renderContent()}

            {/* Edit Drawer Overlay */}
            <div className={`drawer-overlay ${isEditing ? 'open' : ''}`} onClick={handleCloseDrawer}></div>

            {/* Edit Drawer */}
            <div className={`edit-drawer ${isEditing ? 'open' : ''}`}>
                <div className="drawer-header">
                    <h2>Modifica Profilo</h2>
                    <button className="drawer-close-btn" onClick={handleCloseDrawer}>&times;</button>
                </div>
                <div className="drawer-content">
                    <div className="edit-form-group">
                        <div className="edit-pic-container">
                            <img src={editForm.profilePic} alt="Preview" className="edit-pic-preview" />
                        </div>
                    </div>
                    <div className="edit-form-group">
                        <label>Nome</label>
                        <input
                            type="text"
                            name="name"
                            value={editForm.name}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="edit-form-group">
                        <label>Bio</label>
                        <textarea
                            name="bio"
                            value={editForm.bio}
                            onChange={handleInputChange}
                        />
                    </div>
                </div>
                <div className="drawer-footer">
                    <button className="cancel-btn" onClick={handleCloseDrawer}>Annulla</button>
                    <button className="save-btn" onClick={handleSave}>Salva Modifiche</button>
                </div>
            </div>
        </div>
    );
}

export default Profile;
