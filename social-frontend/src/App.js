import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';
import Home from './pages/Home';
import Profile from './pages/Profile';
import CreatePost from './pages/CreatePost';
import ForgotPassword from './pages/ForgotPassword';
import Header from './components/Header';
import AuthModal from './components/AuthModal';

function AppContent() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const { currentUser, logout } = useAuth();
  const isLoggedIn = !!currentUser;

  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/posts');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();

        // Map backend data to frontend format
        const formattedPosts = data.map(post => ({
          id: post.id,
          author: post.authorName, // Use the author name we fetched
          time: new Date(post.createdAt).toLocaleDateString(), // Simple formatting
          title: post.content.substring(0, 50) + (post.content.length > 50 ? "..." : ""), // Use content as title for now
          content: post.content,
          image: post.image,
          votes: post.likes || 0,
          comments: 0 // Default
        }));

        setPosts(formattedPosts);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };

    fetchPosts();
  }, []);

  const navigate = useNavigate();

  const handleLoginClick = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/'); // Torna alla home page
  };

  const closeModal = () => {
    setShowAuthModal(false);
  };

  const handleLoginSuccess = () => {
    // login(); // Non serve più, AuthContext gestisce lo stato
    closeModal();
  };

  // Funzione per aggiungere un nuovo post
  const addPost = (newPost) => {
    const post = {
      id: posts.length + 1,
      author: "u/you", // TODO: sostituire con l'utente vero
      time: "Just now",
      title: newPost.title,
      content: newPost.content,
      votes: 0,
      comments: 0
    };
    // Aggiunge il nuovo post all'inizio dell'array
    setPosts([post, ...posts]);
  };

  return (
    <div className="App">
      <Header
        onLoginClick={handleLoginClick}
        onLogoutClick={handleLogout}
        showProfile={isLoggedIn}
        isLoggedIn={isLoggedIn}
      />
      <Routes>
        <Route path="/" element={<Home onLoginClick={handleLoginClick} isLoggedIn={isLoggedIn} posts={posts} />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
      {showAuthModal && (
        <AuthModal mode={authMode} onClose={closeModal} onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
