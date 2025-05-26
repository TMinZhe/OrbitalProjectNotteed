import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postData } from '../../../../backend/api';
import './SignupPrompt.css'

export default function SignupPrompt() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signupMsg, setSignupMsg] = useState('\u00A0');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setSignupMsg('Please fill all fields');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setSignupMsg('Please enter a valid email address');
      return;
    }

    const res = await postData('/api/signup', { email, password });
    if (res.success) {
      setSignupMsg('Signup successful!');
      navigate('/login');
    } else {
      setSignupMsg('Signup failed: ' + (res.message || 'Unknown error'));
    }
  };

  return (
    <div className = "flex stretch" style={{backgroundColor: '#aabcbf', alignItems: 'justify', justifyContent: 'center'}}>
        <div className="rounded-container mt-3">
            <h2 className="mb-4">Create Account</h2>
            <form onSubmit={handleSignup} noValidate>
                <div className="mb-3">
                <label htmlFor="email" className="form-label">Email address</label>
                <input
                    type="email"
                    id="email"
                    className="form-control"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
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
                    autoComplete="new-password"
                />
                </div>
                <div id ="signupMsg">{signupMsg}</div>
                <button type="submit" className="btn btn-primary w-100">Sign up</button>
                <a href="/account?login" className="btn btn-secondary w-100 mt-3">Log into existing account</a>
            </form>
        </div>
    </div>
  );
}
