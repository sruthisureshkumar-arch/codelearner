import React, { useState } from 'react';
import axios from 'axios';

const inputStyle = { width: '100%', padding: '9px 12px', border: '1px solid #ced4da', borderRadius: 4, fontSize: 14, boxSizing: 'border-box', outline: 'none' };
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 500, color: '#333', marginBottom: 6 };

const Login = ({ onLogin }) => {
  const [mode, setMode]         = useState('login'); // 'login' | 'register'
  const [role, setRole]         = useState('student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const resetMessages = () => setError('');

  const switchMode = (m) => {
    setMode(m);
    resetMessages();
    setUsername('');
    setPassword('');
    setName('');
    setRollNumber('');
  };

  const switchRole = (r) => {
    setRole(r);
    resetMessages();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await axios.post('/api/auth/login', { username, password });
        const actualRole = res.data.user?.role;
        if (actualRole !== role) {
          setError(`This is a ${actualRole} account. Please select "${actualRole === 'teacher' ? '🏫 Teacher' : '🎓 Student'}" above and try again.`);
          setLoading(false);
          return;
        }
        onLogin(res.data);
      } else {
        if (!name.trim()) {
          setError('Please enter your full name.');
          setLoading(false);
          return;
        }
        if (role === 'student' && !rollNumber.trim()) {
          setError('Please enter your roll number.');
          setLoading(false);
          return;
        }
        const res = await axios.post('/api/auth/register', { username, password, name, role, rollNumber });
        onLogin(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f2f2f2', display: 'flex', flexDirection: 'column' }}>
      {/* Moodle-style header */}
      <div style={{ background: '#0f6cbf', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <svg width="36" height="36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" rx="8" fill="white" fillOpacity="0.15"/>
          <text x="50" y="68" textAnchor="middle" fontSize="52" fontWeight="bold" fill="white">M</text>
        </svg>
        <span style={{ color: 'white', fontSize: 22, fontWeight: 600, letterSpacing: 0.5 }}>Code Learner LMS</span>
      </div>

      {/* Login / Register card */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: 'white', borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.12)', width: '100%', maxWidth: 420, overflow: 'hidden' }}>
          {/* Login / Register tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #dee2e6' }}>
            {['login', 'register'].map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                style={{
                  flex: 1, padding: '14px 0', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500,
                  background: mode === m ? 'white' : '#f8f9fa',
                  color: mode === m ? '#0f6cbf' : '#666',
                  borderBottom: mode === m ? '3px solid #0f6cbf' : '3px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                {m === 'login' ? 'Log in' : 'Create account'}
              </button>
            ))}
          </div>

          <div style={{ padding: '32px 32px 28px' }}>
            <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 600, color: '#333' }}>
              {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
            </h2>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#666' }}>
              {mode === 'login'
                ? 'Select your role above, then sign in with your credentials.'
                : 'Register as a student or a teacher, then create or join a course.'}
            </p>

            {/* Role selector */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, opacity: mode === 'login' ? 0.6 : 1 }}>
              {['student', 'teacher'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => switchRole(r)}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 4, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    border: role === r ? '1px solid #0f6cbf' : '1px solid #ced4da',
                    background: role === r ? '#e8f0fb' : '#fff',
                    color: role === r ? '#0f6cbf' : '#666',
                  }}
                >
                  {r === 'student' ? '🎓 Student' : '🏫 Teacher'}
                </button>
              ))}
            </div>

            {error && (
              <div style={{ background: '#fdf2f2', border: '1px solid #f5c6cb', borderRadius: 4, padding: '10px 14px', marginBottom: 18, fontSize: 13, color: '#842029' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {mode === 'register' && (
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Full name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Johnson"
                    style={inputStyle}
                    required
                  />
                </div>
              )}
              {mode === 'register' && role === 'student' && (
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Roll number</label>
                  <input
                    type="text"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    placeholder="e.g. 21CS045"
                    style={inputStyle}
                    required
                  />
                  <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>Used when enrolling in courses.</div>
                </div>
              )}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  style={inputStyle}
                  autoCapitalize="none"
                  required
                />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={inputStyle}
                  required
                />
                {mode === 'register' && (
                  <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>At least 6 characters.</div>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', padding: '10px', background: '#0f6cbf', color: 'white', border: 'none', borderRadius: 4, fontSize: 15, fontWeight: 600, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Please wait…' : (mode === 'login' ? 'Log in' : 'Create account')}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: '12px', fontSize: 12, color: '#888' }}>
        Code Learner LMS · Powered by Moodle
      </div>
    </div>
  );
};

export default Login;
