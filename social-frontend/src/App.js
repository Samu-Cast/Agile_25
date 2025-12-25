import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './styles/App.css';
import Home from './pages/Home';
import Profile from './pages/Profile';
import CreatePostModal from './components/CreatePostModal';
// import CreatePost from './pages/CreatePost'; // Removed
import ForgotPassword from './pages/ForgotPassword';

import Header from './components/Header';
import AuthModal from './components/AuthModal';

function AppContent() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false); // Modal state
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const { currentUser, logout } = useAuth();
  const isLoggedIn = !!currentUser;

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

  return (
    <div className="App">
      <Header
        onLoginClick={handleLoginClick}
        onLogoutClick={handleLogout}
        showProfile={isLoggedIn}
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        onCreatePostClick={() => setIsCreatePostOpen(true)}
      />
      <Routes>
        <Route path="/" element={<Home onLoginClick={handleLoginClick} isLoggedIn={isLoggedIn} />} />
        {/* <Route path="/create-post" element={<CreatePost />} /> Removed */}
        <Route path="/profile/:uid?" element={<Profile />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Routes>
      {showAuthModal && (
        <AuthModal mode={authMode} onClose={closeModal} onLoginSuccess={handleLoginSuccess} />
      )}
      {isCreatePostOpen && (
        <CreatePostModal
          onClose={() => setIsCreatePostOpen(false)}
          onSuccess={() => window.location.reload()}
        />
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
