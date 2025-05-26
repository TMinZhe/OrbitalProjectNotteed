import React, { useState, useEffect } from 'react';
import './NavBar.css';
import AccountPrompt from '../AccountPrompt/AccountPrompt';

export default function NavBar() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const syncUser = () => {
      const storedUser = localStorage.getItem('user');
      setUser(storedUser ? JSON.parse(storedUser) : null);
    };

    syncUser();

    window.addEventListener('storage', syncUser);
    return () => window.removeEventListener('storage', syncUser);
  }, []);

  const [showPrompt, setShowPrompt] = useState(false);

  return (
    <div className="navbar">
      <div className="navbar-content">
        <a className="navbar-name" href="/">NOTTEED</a>
        <div className="navbar-account" style={{ display: 'flex', gap: '16px' }}>
          {user && user.email ? (
            <div className='navbar-user'>
              <a className="navbar-notes" href="/notes">Notes</a>
              <span className="navbar-username" onClick={() => setShowPrompt(!showPrompt)}>Welcome, {user.username || user.email}</span>
              {showPrompt && (<div className='account-prompt'><AccountPrompt /></div>)}
            </ div>
          ) : (
            <>
              <a href="/account?action=login"><button className='navbar-login'>Login</button></a>
              <a href="/account?action=signup"><button className='navbar-signup'>Signup</button></a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
