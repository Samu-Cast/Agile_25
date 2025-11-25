import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';
import Home from './pages/Home';
import Profile from './pages/Profile';
import CreatePost from './pages/CreatePost';
import ForgotPassword from './pages/ForgotPassword';
import Header from './components/Header';
import AuthModal from './components/AuthModal';
import { createPost, getPosts, updateVotes, toggleCoffee } from './services/postService';

function AppContent() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  // Stato utente corrente
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const saved = localStorage.getItem('isLoggedIn');
    return saved === 'true';
  });

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // Carica i post da Firebase all'avvio
  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const fetchedPosts = await getPosts();
      setPosts(fetchedPosts);
    } catch (error) {
      console.error('Errore nel caricamento dei post:', error);
    } finally {
      setLoading(false);
    }
  };

  // Salva lo stato di login e utente in localStorage
  useEffect(() => {
    localStorage.setItem('isLoggedIn', isLoggedIn);
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [isLoggedIn, currentUser]);

  const handleLoginClick = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    navigate('/');
  };

  const closeModal = () => {
    setShowAuthModal(false);
  };

  const handleLoginSuccess = (userData) => {
    setIsLoggedIn(true);
    setCurrentUser({
      username: userData?.username || 'u/you',
      email: userData?.email || ''
    });
    closeModal();
  };

  // Funzione per aggiungere un nuovo post (salva su Firebase)
  const addPost = async (newPostData) => {
    try {
      const postToSave = {
        title: newPostData.title,
        content: newPostData.content,
        author: currentUser?.username || 'u/anonymous',
        tags: newPostData.tags || []
      };

      await createPost(postToSave);
      await loadPosts(); // Ricarica tutti i post

    } catch (error) {
      console.error('Errore nel salvataggio del post:', error);
      alert('Errore nel salvataggio del post. Riprova.');
    }
  };

  // Gestione voti - passa userId
  const handleVote = async (postId, value) => {
    if (!currentUser) {
      alert('Devi essere loggato per votare!');
      return;
    }
    try {
      await updateVotes(postId, currentUser.username, value);
      await loadPosts();
    } catch (error) {
      console.error('Errore nel voto:', error);
    }
  };

  // Gestione tazze di caffè  - passa userId
  const handleCoffee = async (postId) => {
    if (!currentUser) {
      alert('Devi essere loggato per dare caffè!');
      return;
    }
    try {
      await toggleCoffee(postId, currentUser.username);
      await loadPosts();
    } catch (error) {
      console.error('Errore nel toggle del caffè:', error);
    }
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
        <Route path="/" element={
          <Home
            onLoginClick={handleLoginClick}
            isLoggedIn={isLoggedIn}
            posts={posts}
            loading={loading}
            onVote={handleVote}
            onCoffee={handleCoffee}
            currentUser={currentUser}
          />
        } />
        <Route path="/profile" element={<Profile />} />
        <Route path="/create-post" element={<CreatePost onPostCreate={addPost} />} />
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
      <AppContent />
    </Router>
  );
}

export default App;
