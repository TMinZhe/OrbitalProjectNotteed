import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SignupPrompt() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const postData = async (url = '', data = {}) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      alert('Please fill all fields');
      return;
    }
    const res = await postData('/signup', { email, password });
    if (res.success) {
      alert('Signup successful! Please login.');
      navigate('/login');
    } else {
      alert('Signup failed: ' + (res.message || 'Unknown error'));
    }
  };

  return (
    <div className = "flex stretch" style={{backgroundColor: '#aabcbf', alignItems: 'justify', justifyContent: 'center'}}>
        <div className="rounded-container mt-3">
            <h2 className="mb-4">Create Account</h2>
            <form onSubmit={handleSignup}>
                <div className="mb-3">
                <label htmlFor="email" className="form-label">Email address</label>
                <input
                    type="email"
                    id="email"
                    className="form-control"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="username"
                />
                </div>

                <div className="mb-3">
                <label htmlFor="password" className="form-label">Password</label>
                <input
                    type="password"
                    id="password"
                    className="form-control"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                />
                </div>

                <button type="submit" className="btn btn-primary w-100">Sign up</button>
                <a href="/account?login" className="btn btn-secondary w-100 mt-3">Log into existing account</a>
            </form>
        </div>
    </div>
  );
}
