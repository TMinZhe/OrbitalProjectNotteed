import React from 'react'
import './AccountPrompt.css'

const handleLogout = () => {
  localStorage.removeItem('user');
  window.location.href = '/';
};

// Prompt for additional account options (only logout)
export default function AccountPrompt() {
    return (
        <div>
            <button onClick={handleLogout}>Log Out</button>
        </div>
    );
}