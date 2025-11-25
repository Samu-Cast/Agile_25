import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';
import Home from './pages/Home';
import Profile from './pages/Profile';
import CreatePost from './pages/CreatePost';
import PostDetails from './pages/PostDetails';
import ForgotPassword from './pages/ForgotPassword';
import Header from './components/Header';
import AuthModal from './components/AuthModal';
import { createPost, getPosts, updateVotes } from './services/postService';

function AppContent() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const { currentUser, logout } = useAuth();
  const isLoggedIn = !!currentUser;

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

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

  // Funzione per aggiungere un nuovo post (salva su Firebase)
  const addPost = async (newPostData) => {
    try {
      const postToSave = {
        title: newPostData.title,
        content: newPostData.content,
        author: currentUser?.email || 'u/anonymous',
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
      await updateVotes(postId, currentUser.email, value);
      await loadPosts();
    } catch (error) {
      console.error('Errore nel voto:', error);
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
            currentUser={currentUser}
            refreshPosts={loadPosts}
          />
        } />
        <Route path="/profile" element={<Profile />} />
        <Route path="/create-post" element={<CreatePost onPostCreate={addPost} />} />
        <Route path="/post/:id" element={<PostDetails />} />
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
