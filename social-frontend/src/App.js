import React, { useState } from 'react';
import './App.css';
import Register from './pages/Register';
import Login from './pages/Login';
import Home from './pages/Home';

function App() {
  const [currentView, setCurrentView] = useState('home');

  const renderView = () => {
    switch (currentView) {
      case 'login':
        return (
          <>
            <Login />
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button onClick={() => setCurrentView('register')}>
                Need an account? Register
              </button>
              <br />
              <button onClick={() => setCurrentView('home')} style={{ marginTop: '10px' }}>
                Back to Home
              </button>
            </div>
          </>
        );
      case 'register':
        return (
          <>
            <Register />
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button onClick={() => setCurrentView('login')}>
                Already have an account? Login
              </button>
              <br />
              <button onClick={() => setCurrentView('home')} style={{ marginTop: '10px' }}>
                Back to Home
              </button>
            </div>
          </>
        );
      case 'home':
      default:
        return <Home onLoginClick={() => setCurrentView('login')} />;
    }
  };

  return (
    <div className="App">
      {renderView()}
    </div>
  );
}

export default App;
