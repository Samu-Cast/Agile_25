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
  const { isLoggedIn, login, logout } = useAuth();

  // Lista dei post - inizia con alcuni post di esempio
  const [posts, setPosts] = useState([
    {
      id: 1,
      author: "u/dev_master",
      time: "4h ago",
      title: "What is the best way to handle state in 2025?",
      content: "I've been using Redux for years, but with the new React hooks and Context API updates, I'm wondering if it's still the go-to solution...",
      votes: 1240,
      comments: 342
    },
    {
      id: 2,
      author: "u/design_guru",
      time: "6h ago",
      title: "Check out this new UI kit I made!",
      content: "It's based on the latest neomorphism trends but with a flat twist. Let me know what you think!",
      votes: 856,
      comments: 120
    },
    {
      id: 3,
      author: "u/startup_joe",
      time: "12h ago",
      title: "We just launched our MVP!",
      content: "After 6 months of hard work, we are finally live. Check it out and give us feedback.",
      votes: 2100,
      comments: 560
    }
  ]);

  const navigate = useNavigate();

  const handleLoginClick = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const handleLogout = () => {
    logout();
    navigate('/'); // Torna alla home page
  };

  const closeModal = () => {
    setShowAuthModal(false);
  };

  const handleLoginSuccess = () => {
    login();
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
