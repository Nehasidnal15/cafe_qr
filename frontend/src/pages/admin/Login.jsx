import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Lock, Eye, EyeOff } from 'lucide-react';
import API_BASE_URL from '../../config';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
       const res = await axios.post(`${API_BASE_URL}/api/admin/login`, { username, password });
      localStorage.setItem('adminToken', res.data.token);
      localStorage.setItem('cafe_admin_token', res.data.token); 
      navigate('/admin/dashboard', { replace: true });
    } catch (error) {
      if (error.response?.status === 400 || error.response?.status === 404) {
        alert('Invalid credentials. (Note: If this is the first run, ensure setup is called via Postman or script)');
      } else {
        alert('Login failed');
      }
    }
  };

  return (
    <div className="app-container" style={{ background: 'var(--bg-cream)', justifyContent: 'center', padding: '2rem' }}>
      <div className="cafe-card animate-fade-in" style={{ textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div style={{ background: 'var(--bg-cream)', padding: '20px', borderRadius: '50%' }}>
            <Lock color="var(--primary-color)" size={32} />
          </div>
        </div>
        <h1 className="header-title" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Admin Portal</h1>
        <p style={{ color: 'var(--text-dim)', marginBottom: '2.5rem', fontWeight: '500' }}>Sign in to manage the cafe</p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
          <input 
            type="text" 
            className="input-field" 
            placeholder="Username or Email" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <div style={{ position: 'relative' }}>
            <input 
              type={showPassword ? 'text' : 'password'} 
              className="input-field" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ paddingRight: '40px' }}
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0
              }}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <div style={{ textAlign: 'right', marginTop: '-0.5rem' }}>
            <Link to="/admin/forgot-password" style={{ color: 'var(--primary-color)', fontSize: '0.85rem', fontWeight: '600', textDecoration: 'none' }}>
              Forgot Password?
            </Link>
          </div>
          <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>
            Sign In
          </button>
        </form>

      </div>
    </div>
  );
};

export default AdminLogin;
