import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { showErrorToast } from '../../utils/toast';
import Input from '../../components/Auth/Input';
import Button from '../../components/Auth/Button';
import SocialButton from '../../components/Auth/SocialButton';
import './Signup.css';

const Signup = () => {
  const navigate = useNavigate();
  const { register, verifyOtp, resendOtp, loginWithOAuth } = useAuth();
  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [pendingEmail, setPendingEmail] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

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

    // Full Name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    // Confirm Password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Phone validation (optional)
    if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Terms acceptance
    if (!acceptTerms) {
      newErrors.terms = 'You must accept the terms and privacy policy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const userData = {
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        phoneNumber: formData.phone || undefined
      };

      const result = await register(userData);

      if (result.success && result.requiresOtp) {
        setPendingEmail(result.email);
        setStep('otp');
        startResendCooldown();
      } else if (!result.success) {
        setErrors({ general: result.error });
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ general: 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const startResendCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (otpValue.length !== 6) {
      setOtpError('Please enter the 6-digit code');
      return;
    }
    setOtpLoading(true);
    setOtpError('');
    const result = await verifyOtp(pendingEmail, otpValue);
    if (result.success) {
      navigate('/');
    } else {
      setOtpError(result.error || 'Invalid OTP');
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setOtpError('');
    const result = await resendOtp(pendingEmail);
    if (result.success) startResendCooldown();
  };

  const handleSocialSignup = (provider) => {
    try {
      loginWithOAuth(provider);
    } catch (error) {
      console.error(`${provider} signup error:`, error);
      showErrorToast(`Failed to signup with ${provider}`);
    }
  };

  if (step === 'otp') {
    return (
      <div className="auth-page">
        <div className="auth-container signup-container">
          <div className="auth-form-section">
            <div className="auth-form-wrapper">
              <div className="auth-logo">
                <img src="/images/newLogo.png" alt="OptionTrip" />
              </div>

              <div className="auth-header">
                <h1 className="auth-title">Check your email</h1>
                <p className="auth-subtitle">
                  We sent a 6-digit code to <strong>{pendingEmail}</strong>
                </p>
              </div>

              <form onSubmit={handleOtpSubmit} className="auth-form">
                <div className="otp-input-wrapper">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpValue}
                    onChange={e => {
                      setOtpError('');
                      setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6));
                    }}
                    placeholder="000000"
                    className="otp-input"
                    autoFocus
                  />
                  {otpError && <p className="auth-input-error" style={{ marginTop: 8 }}>{otpError}</p>}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="large"
                  fullWidth
                  loading={otpLoading}
                >
                  Verify Email
                </Button>
              </form>

              <div className="otp-resend-row">
                <span className="auth-footer-text">Didn&apos;t receive it?</span>
                <button
                  type="button"
                  className={`otp-resend-btn${resendCooldown > 0 ? ' disabled' : ''}`}
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>

              <div className="auth-footer">
                <button
                  type="button"
                  className="auth-link"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  onClick={() => { setStep('form'); setOtpValue(''); setOtpError(''); }}
                >
                  ← Back to sign up
                </button>
              </div>
            </div>
          </div>

          {/* Right Side - Illustration (reused) */}
          <div className="auth-illustration-section">
            <div className="auth-illustration-content">
              <div className="auth-illustration-pattern"></div>
              <div className="auth-illustration-text">
                <h2>Almost there!</h2>
                <p>Verify your email to start planning extraordinary trips</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container signup-container">
        {/* Left Side - Form */}
        <div className="auth-form-section">
          <div className="auth-form-wrapper">
            {/* Logo */}
            <div className="auth-logo">

                <img src="/images/newLogo.png" alt="OptionTrip" />

            </div>

            {/* Welcome Text */}
            <div className="auth-header">
              <h1 className="auth-title">Start your journey</h1>
              <p className="auth-subtitle">Create an account and discover amazing destinations</p>
            </div>

            {/* General Error Message */}
            {errors.general && (
              <div className="auth-error-banner">
                {errors.general}
              </div>
            )}

            {/* Social Signup Buttons */}
            <div className="auth-social-buttons">
              <SocialButton
                provider="google"
                onClick={() => handleSocialSignup('google')}
              />
              <SocialButton
                provider="twitter"
                onClick={() => handleSocialSignup('twitter')}
              />
            </div>

            {/* Divider */}
            <div className="auth-divider">
              <span className="auth-divider-line"></span>
              <span className="auth-divider-text">or continue with email</span>
              <span className="auth-divider-line"></span>
            </div>

            {/* Signup Form */}
            <form onSubmit={handleSubmit} className="auth-form">
              <Input
                label="Full Name"
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
                error={errors.fullName}
                autoComplete="name"
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                }
              />

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
                placeholder="Create a password"
                required
                error={errors.password}
                autoComplete="new-password"
                showPasswordToggle
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                }
              />

              <Input
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                required
                error={errors.confirmPassword}
                autoComplete="new-password"
                showPasswordToggle
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                }
              />

              <div className="phone-field">
                <Input
                  label="Phone Number"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number (optional)"
                  error={errors.phone}
                  autoComplete="tel"
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                  }
                />
              </div>

              {/* Terms Checkbox */}
              <div className="auth-terms-wrapper">
                <label className="auth-checkbox auth-terms-checkbox">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => {
                      setAcceptTerms(e.target.checked);
                      if (errors.terms && e.target.checked) {
                        setErrors(prev => ({ ...prev, terms: '' }));
                      }
                    }}
                  />
                  <span className="auth-checkbox-label">
                    I agree to the{' '}
                    <Link to="/terms" className="auth-link">Terms of Service</Link>
                    {' '}and{' '}
                    <Link to="/privacy" className="auth-link">Privacy Policy</Link>
                  </span>
                </label>
                {errors.terms && <span className="auth-input-error">{errors.terms}</span>}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="large"
                fullWidth
                loading={loading}
              >
                Create Account
              </Button>
            </form>

            {/* Login Link */}
            <div className="auth-footer">
              <p className="auth-footer-text">
                Already have an account?{' '}
                <Link to="/login" className="auth-link auth-link-primary">
                  Log in
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
              <h2>Join Thousands of Travelers</h2>
              <p>Experience seamless trip planning with personalized recommendations and exclusive deals</p>
            </div>
            <div className="auth-illustration-image">
              <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Globe Illustration */}
                <circle cx="200" cy="200" r="140" fill="#F30F89" opacity="0.15"/>
                <circle cx="200" cy="200" r="110" fill="#0A539D" opacity="0.15"/>
                <circle cx="200" cy="200" r="80" fill="#F30F89" opacity="0.15"/>

                {/* Travel Icons */}
                <g transform="translate(150, 120)">
                  <circle cx="0" cy="0" r="25" fill="#F30F89"/>
                  <path d="M -8 -5 L 8 -5 L 8 5 L -8 5 Z" fill="#fff"/>
                  <path d="M -10 -8 L 10 -8 L 10 -5 L -10 -5 Z" fill="#fff"/>
                </g>

                <g transform="translate(250, 160)">
                  <circle cx="0" cy="0" r="22" fill="#0A539D"/>
                  <circle cx="0" cy="-3" r="8" fill="#fff"/>
                  <path d="M -10 5 L 0 15 L 10 5" stroke="#fff" strokeWidth="2" fill="none"/>
                </g>

                <g transform="translate(180, 260)">
                  <circle cx="0" cy="0" r="20" fill="#F30F89"/>
                  <rect x="-8" y="-6" width="16" height="12" fill="#fff" rx="2"/>
                  <path d="M -8 -2 L 8 -2" stroke="#F30F89" strokeWidth="1"/>
                </g>

                {/* Compass */}
                <g transform="translate(230, 240)">
                  <circle cx="0" cy="0" r="28" stroke="#0A539D" strokeWidth="2" fill="none"/>
                  <path d="M 0 -20 L 8 0 L 0 20 L -8 0 Z" fill="#F30F89"/>
                  <circle cx="0" cy="0" r="4" fill="#fff"/>
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
