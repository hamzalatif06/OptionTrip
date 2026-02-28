import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { showErrorToast } from '../../utils/toast';
import Input from '../../components/Auth/Input';
import Button from '../../components/Auth/Button';
import SocialButton from '../../components/Auth/SocialButton';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login, loginWithOAuth } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        // Navigate immediately after successful login
        navigate('/', { replace: true });
      } else {
        setErrors({ general: result.error });
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ general: 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    try {
      loginWithOAuth(provider);
    } catch (error) {
      console.error(`${provider} login error:`, error);
      showErrorToast(`Failed to login with ${provider}`);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Left Side - Form */}
        <div className="auth-form-section">
          <div className="auth-form-wrapper">
            {/* Logo */}
            <div className="auth-logo">

                <img src="/images/newLogo.png" alt="OptionTrip" />

            </div>

            {/* Welcome Text */}
            <div className="auth-header">
              <h1 className="auth-title">Welcome back</h1>
              <p className="auth-subtitle">Let's plan your next adventure</p>
            </div>

            {/* General Error Message */}
            {errors.general && (
              <div className="auth-error-banner">
                {errors.general}
              </div>
            )}

            {/* Social Login Buttons */}
            <div className="auth-social-buttons">
              <SocialButton
                provider="google"
                onClick={() => handleSocialLogin('google')}
              />
              <SocialButton
                provider="twitter"
                onClick={() => handleSocialLogin('twitter')}
              />
            </div>

            {/* Divider */}
            <div className="auth-divider">
              <span className="auth-divider-line"></span>
              <span className="auth-divider-text">or continue with email</span>
              <span className="auth-divider-line"></span>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="auth-form">
              <Input
                label="Email Address"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                error={errors.email}
                autoComplete="email"
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                }
              />

              <Input
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                error={errors.password}
                autoComplete="current-password"
                showPasswordToggle
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                }
              />

              {/* Remember Me & Forgot Password */}
              <div className="auth-form-options">
                <label className="auth-checkbox">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="auth-checkbox-label">Remember me</span>
                </label>
                <Link to="/forgot-password" className="auth-link">
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="large"
                fullWidth
                loading={loading}
              >
                Sign In
              </Button>
            </form>

            {/* Sign Up Link */}
            <div className="auth-footer">
              <p className="auth-footer-text">
                Don't have an account?{' '}
                <Link to="/signup" className="auth-link auth-link-primary">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Illustration */}
        <div className="auth-illustration-section">
          <div className="auth-illustration-content">
            <div className="auth-illustration-pattern"></div>
            <div className="auth-illustration-text">
              <h2>Discover Your Next Adventure</h2>
              <p>Plan unforgettable trips with AI-powered recommendations tailored just for you</p>
            </div>
            <div className="auth-illustration-image">
              <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* World Map Illustration */}
                <circle cx="200" cy="200" r="150" fill="#F30F89" opacity="0.1"/>
                <circle cx="200" cy="200" r="120" fill="#0A539D" opacity="0.1"/>

                {/* Airplane */}
                <g transform="translate(180, 100)">
                  <path d="M20 30 L40 20 L60 30 L50 40 Z" fill="#F30F89"/>
                  <circle cx="40" cy="30" r="3" fill="#fff"/>
                </g>

                {/* Location Pins */}
                <g transform="translate(120, 180)">
                  <path d="M10 0 C4.5 0 0 4.5 0 10 C0 15 10 25 10 25 C10 25 20 15 20 10 C20 4.5 15.5 0 10 0 Z" fill="#0A539D"/>
                  <circle cx="10" cy="10" r="4" fill="#fff"/>
                </g>

                <g transform="translate(240, 220)">
                  <path d="M10 0 C4.5 0 0 4.5 0 10 C0 15 10 25 10 25 C10 25 20 15 20 10 C20 4.5 15.5 0 10 0 Z" fill="#F30F89"/>
                  <circle cx="10" cy="10" r="4" fill="#fff"/>
                </g>

                {/* Connecting Lines */}
                <path d="M 130 195 Q 180 180 250 235" stroke="#0A539D" strokeWidth="2" strokeDasharray="5,5" opacity="0.3" fill="none"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
