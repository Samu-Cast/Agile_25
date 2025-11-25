import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    // Mock initial user data
    const [user, setUser] = useState({
        name: "Matteo Rossi",
        role: "Barista", // "Barista", "Appassionato", "Torrefazione"
        bio: "Coffee lover & latte art enthusiast. Always looking for the perfect bean. ☕✨",
        stats: {
            posts: 42,
            followers: 1205,
            following: 350
        },
        profilePic: "https://ui-avatars.com/api/?name=Matteo+Rossi&background=6F4E37&color=fff&size=150"
    });

    const [isLoggedIn, setIsLoggedIn] = useState(true); // Default to true for dev

    const login = () => setIsLoggedIn(true);
    const logout = () => setIsLoggedIn(false);

    const updateProfile = (updatedData) => {
        setUser(prev => ({
            ...prev,
            ...updatedData
        }));
    };

    return (
        <AuthContext.Provider value={{ user, isLoggedIn, login, logout, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
