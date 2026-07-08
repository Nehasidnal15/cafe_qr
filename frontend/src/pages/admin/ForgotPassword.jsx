import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, ShieldCheck, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import API_BASE_URL from '../../config';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval = null;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleSendOTP = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/admin/forgot-password`, { email });
      toast.success('OTP sent to your email');
      setStep(2);
      setTimer(180); // 3 minutes timer
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/admin/verify-otp`, { email, otp });
      toast.success('OTP Verified');
      setStep(3);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters');

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/admin/reset-password`, { email, otp, newPassword });
      toast.success('Password reset successful');
      navigate('/admin/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ background: 'var(--bg-cream)', justifyContent: 'center', padding: '2rem' }}>
      <div className="cafe-card animate-fade-in" style={{ textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
        <Link to="/admin/login" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)', textDecoration: 'none', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
          <ArrowLeft size={16} /> Back to Login
        </Link>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div style={{ background: 'rgba(111, 78, 55, 0.1)', padding: '20px', borderRadius: '50%' }}>
            {step === 1 && <Mail color="var(--primary-color)" size={32} />}
            {step === 2 && <ShieldCheck color="var(--primary-color)" size={32} />}
            {step === 3 && <Lock color="var(--primary-color)" size={32} />}
          </div>
        </div>

        <h1 className="header-title" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>
          {step === 1 && 'Forgot Password'}
          {step === 2 && 'Verify OTP'}
          {step === 3 && 'New Password'}
        </h1>
        <div style={{ color: 'var(--text-dim)', marginBottom: '2.5rem', fontWeight: '500', lineHeight: '1.5' }}>
          {step === 1 && 'Enter your email to receive a password reset OTP'}
          {step === 2 && (
            <>
              Enter the 6-digit code sent to <strong>{email}</strong>.<br />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-light)', display: 'block', marginTop: '0.5rem' }}>
                Please wait 3-4 minutes to receive the email.<br />
                The OTP is valid for 10 minutes.
              </span>
            </>
          )}
          {step === 3 && 'Set a strong new password for your account'}
        </div>

        {step === 1 && (
          <form onSubmit={handleSendOTP} style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
            <input 
              type="email" 
              className="input-field" 
              placeholder="Admin Email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Enter 6-digit OTP" 
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              maxLength={6}
              style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '1.2rem', fontWeight: 'bold' }}
              required
            />
            <button type="submit" className="btn-primary" disabled={loading || otp.length !== 6}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '0.9rem', cursor: 'pointer' }}>
                Change Email
              </button>
              <button 
                type="button" 
                onClick={handleSendOTP}
                disabled={timer > 0 || loading}
                style={{ background: 'none', border: 'none', color: timer > 0 ? 'var(--text-light)' : 'var(--primary-color)', fontSize: '0.9rem', cursor: timer > 0 ? 'not-allowed' : 'pointer', fontWeight: '600' }}
              >
                {timer > 0 ? `Resend OTP in ${Math.floor(timer / 60)}:${('0' + (timer % 60)).slice(-2)}` : 'Resend OTP'}
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? 'text' : 'password'} 
                className="input-field" 
                placeholder="New Password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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
            
            <div style={{ position: 'relative' }}>
              <input 
                type={showConfirmPassword ? 'text' : 'password'} 
                className="input-field" 
                placeholder="Confirm New Password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{ paddingRight: '40px' }}
              />
              <button 
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
