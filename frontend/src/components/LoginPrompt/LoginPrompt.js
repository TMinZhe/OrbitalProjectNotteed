import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPrompt() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const postData = async (url = '', data = {}) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await response.json();
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    const res = await postData('/login', { email, password });

    if (res.success && res.user) {
      localStorage.setItem('user', JSON.stringify(res.user));
      alert('Login successful!');
      navigate('/');
    } else {
      alert(res.message || 'Login failed.');
    }
  };

  return (
    <div className = "flex stretch" style={{backgroundColor: '#aabcbf', alignItems: 'justify', justifyContent: 'center'}}>
      <div className="rounded-container mt-3">
        <h2 className="mb-4">Login</h2>
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email address</label>
            <input type="email" className="form-control" id="email"
                  value={email} onChange={e => setEmail(e.target.value)} required />
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <input type="password" className="form-control" id="password"
                  value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          <button type="submit" className="btn btn-primary w-100">Login</button>
          <a href="/account?action=signup" className="btn btn-secondary w-100 mt-3">Create Account</a>
        </form>
      </div>
    </div>
  );
}
