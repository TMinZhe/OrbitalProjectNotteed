import React from 'react';
import './NavBar.css';

export default function NavBar() {
  const user = JSON.parse(localStorage.getItem('user'));

  return (
    <div className="navbar">
      <div className="navbar-content">
        <a className="navbar-name" href="/">NOTTEED</a>
        <div className="navbar-account" style={{ display: 'flex', gap: '16px' }}>
          {user && user.email ? (
            <>
            <a className="navbar-notes" href="/notes">Notes</a>
            <span className="navbar-username">Welcome, {user.username || user.email}</span>
            </>
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
