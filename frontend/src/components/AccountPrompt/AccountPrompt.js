import React from 'react'
import './AccountPrompt.css'

const handleLogout = () => {
  localStorage.removeItem('user');
  window.location.href = '/';
};

export default function AccountPrompt() {
    return (
        <div id='account-prompt'>
            <button id='account-prompt-logout' onClick={handleLogout}>Log Out</button>
        </div>
    );
}