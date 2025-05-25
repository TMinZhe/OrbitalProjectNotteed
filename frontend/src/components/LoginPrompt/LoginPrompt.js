import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postData } from '../../../../backend/api';
import './LoginPrompt.css';

export default function LoginPrompt() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginMsg, setLoginMsg] = useState('\u00A0');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    const res = await postData('/api/login', { email, password });

    if (res.success && res.user) {
      localStorage.setItem('user', JSON.stringify(res.user));
      setLoginMsg('');
      navigate('/');
    } else {
      setLoginMsg(res.message || 'Login failed.');
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
          <div id="loginMsg">{loginMsg}</div>
          <button type="submit" className="btn btn-primary w-100">Login</button>
          <a href="/account?action=signup" className="btn btn-secondary w-100 mt-3">Create Account</a>
        </form>
      </div>
    </div>
  );
}
