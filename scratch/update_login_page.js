const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../../farmer_frontend/src/pages/LoginPage.tsx');

const content = `import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  Sprout,
  ArrowLeft,
  Users,
  ShieldCheck,
  Zap,
  Truck,
  Sparkles,
  Award,
  CheckCircle2,
  Send,
  Phone,
  MapPin,
  Check,
  KeyRound,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useUIStore } from '../store/uiStore';
import { authService } from '../services/auth.service';

// Slideshow background images
import slideImg1 from '../assets/services-hero-banner.jpg';
import slideImg2 from '../assets/sustainable-farm.jpg';
import slideImg3 from '../assets/farm-visit-inspection.jpg';
import farmerLogo from '../assets/farmerbench-logo.png';

import './LoginPage.css';

interface SlideData {
  image: string;
}

const SLIDES: SlideData[] = [
  { image: slideImg1 },
  { image: slideImg2 },
  { image: slideImg3 },
];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoggingIn, isAuthenticated, isAdmin, user, setAuthSession } = useAuth();
  const { addToast } = useUIStore();

  // Mode: 'login' | 'signup' | 'forgot'
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');

  // Form State
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [district, setDistrict] = useState('Thanjavur');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // OTP State (Signup Flow - Inline in Email Textfield)
  const [signupOtpSent, setSignupOtpSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [signupOtpDigits, setSignupOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [signupCountdown, setSignupCountdown] = useState<number>(0);
  const [isSignupOtpSending, setIsSignupOtpSending] = useState(false);
  const [isSignupVerifying, setIsSignupVerifying] = useState(false);
  const [isSubmittingSignup, setIsSubmittingSignup] = useState(false);

  // =========================================================================
  // FORGOT PASSWORD FLOW STATE
  // Step 1: Email Input
  // Step 2: 6-Digit OTP Verification
  // Step 3: New Password & Confirm Password
  // Step 4: Success Message & Return to Login
  // =========================================================================
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3 | 4>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtpDigits, setForgotOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotCountdown, setForgotCountdown] = useState<number>(0);
  const [isForgotSending, setIsForgotSending] = useState(false);
  const [isForgotVerifying, setIsForgotVerifying] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [forgotGenericMessage, setForgotGenericMessage] = useState<string | null>(null);

  // Background Slideshow Index
  const [currentSlide, setCurrentSlide] = useState(0);

  // Slideshow auto-advance every 6.5s
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 6500);
    return () => clearInterval(interval);
  }, []);

  // Countdown timers for signup and forgot password resend cooldown
  useEffect(() => {
    let timer: any;
    if (signupCountdown > 0) {
      timer = setInterval(() => setSignupCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [signupCountdown]);

  useEffect(() => {
    let timer: any;
    if (forgotCountdown > 0) {
      timer = setInterval(() => setForgotCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [forgotCountdown]);

  // Sync mode if URL changes
  useEffect(() => {
    if (location.pathname.includes('signup') || location.pathname.includes('register')) {
      setMode('signup');
    } else if (location.pathname.includes('login') || location.pathname.includes('signin')) {
      setMode('login');
    }
  }, [location.pathname]);

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated) {
      if (isAdmin || user?.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, isAdmin, user, navigate]);

  // =========================================================================
  // 1. SIGNUP WITH INLINE EMAIL OTP VERIFICATION
  // =========================================================================
  const handleSendSignupInlineOtp = async () => {
    setError(null);
    if (!emailOrPhone.trim() || !emailOrPhone.includes('@')) {
      setError('Please enter a valid email address first to receive OTP');
      return;
    }

    setIsSignupOtpSending(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/register-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || emailOrPhone.split('@')[0],
          email: emailOrPhone.trim(),
          phone: phoneNumber.trim() || null,
          location: district.trim() || null,
          password: password || undefined,
        }),
      });
      const data = await res.json();
      setIsSignupOtpSending(false);

      if (!res.ok) {
        throw new Error(data.message || 'Failed to dispatch verification code');
      }

      setSignupOtpSent(true);
      setSignupCountdown(60);
      setSignupOtpDigits(['', '', '', '', '', '']);
      addToast({
        type: 'success',
        message: \`6-Digit OTP sent to \${emailOrPhone}!\`,
      });
      setTimeout(() => {
        document.getElementById('signup-inline-otp-0')?.focus();
      }, 150);
    } catch (err: any) {
      setIsSignupOtpSending(false);
      setError(err.message || 'Failed to send OTP code.');
    }
  };

  const handleSignupOtpChange = (index: number, val: string) => {
    const clean = val.replace(/[^0-9]/g, '').slice(-1);
    const updated = [...signupOtpDigits];
    updated[index] = clean;
    setSignupOtpDigits(updated);

    if (clean && index < 5) {
      document.getElementById(\`signup-inline-otp-\${index + 1}\`)?.focus();
    }
  };

  const handleSignupOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !signupOtpDigits[index] && index > 0) {
      document.getElementById(\`signup-inline-otp-\${index - 1}\`)?.focus();
    }
  };

  const handleSignupOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (pasted) {
      const updated = [...signupOtpDigits];
      for (let i = 0; i < pasted.length; i++) {
        updated[i] = pasted[i];
      }
      setSignupOtpDigits(updated);
      const focusIndex = Math.min(pasted.length, 5);
      document.getElementById(\`signup-inline-otp-\${focusIndex}\`)?.focus();
    }
  };

  const handleVerifySignupInlineOtp = async () => {
    setError(null);
    const entered = signupOtpDigits.join('');

    if (entered.length < 6) {
      setError('Please enter all 6 digits of the verification code');
      return;
    }

    setIsSignupVerifying(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/verify-register-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailOrPhone.trim(),
          otp: entered,
          name: name.trim() || undefined,
          phone: phoneNumber.trim() || undefined,
          location: district.trim() || undefined,
          password: password || undefined,
        }),
      });
      const data = await res.json();
      setIsSignupVerifying(false);

      if (!res.ok) {
        throw new Error(data.message || 'Verification failed. Code mismatch.');
      }

      setIsEmailVerified(true);
      setSignupOtpSent(false);

      // Store credentials / token immediately in state & localStorage
      if (data.data?.token) {
        setAuthSession(data.data.user, data.data.token);
      }

      addToast({
        type: 'success',
        message: 'Email verified successfully! Please complete any remaining fields and submit.',
      });
    } catch (err: any) {
      setIsSignupVerifying(false);
      setError(err.message || 'Verification failed.');
      addToast({ type: 'error', message: err.message || 'Verification failed.' });
    }
  };

  // Final Form Submission when Submit Button is clicked
  const handleFinalSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isEmailVerified) {
      setError('Please verify your email address with OTP before submitting.');
      return;
    }

    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }

    setIsSubmittingSignup(true);

    try {
      addToast({ type: 'success', message: 'Welcome to FarmerBench! Your account is active.' });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Signup failed.');
    } finally {
      setIsSubmittingSignup(false);
    }
  };

  // =========================================================================
  // 2. PASSWORD LOGIN
  // =========================================================================
  const handleSubmitPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!emailOrPhone.trim()) {
      setError('Please enter your email or phone number');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    try {
      const res = await login({ email: emailOrPhone.trim(), password });
      if (res?.user?.role === 'ADMIN' || emailOrPhone.trim().toLowerCase().includes('admin')) {
        addToast({ type: 'success', message: 'Welcome to FarmerBench Admin Panel!' });
        navigate('/admin');
      } else {
        addToast({ type: 'success', message: 'Welcome back! Logged in successfully.' });
        navigate('/dashboard');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Authentication failed. Please check your credentials.';
      setError(errorMsg);
      addToast({ type: 'error', message: errorMsg });
    }
  };

  // =========================================================================
  // 3. FORGOT PASSWORD FLOW HANDLERS (Step 1 -> 2 -> 3 -> 4)
  // =========================================================================
  const handleStartForgotPassword = () => {
    setMode('forgot');
    setForgotStep(1);
    setError(null);
    setForgotOtpDigits(['', '', '', '', '', '']);
    setResetToken(null);
    setNewPassword('');
    setConfirmPassword('');
    // Prefill email from login input if already typed
    if (emailOrPhone.includes('@')) {
      setForgotEmail(emailOrPhone.trim());
    }
  };

  const handleRequestForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = forgotEmail.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsForgotSending(true);

    try {
      const res = await authService.forgotPassword({ email: cleanEmail });
      setIsForgotSending(false);

      const msg = res.message || 'If an account exists for this email, a verification code has been sent.';
      setForgotGenericMessage(msg);
      setForgotCountdown(60);
      setForgotOtpDigits(['', '', '', '', '', '']);
      setForgotStep(2);

      addToast({
        type: 'info',
        message: msg,
      });

      setTimeout(() => {
        document.getElementById('forgot-otp-digit-0')?.focus();
      }, 150);
    } catch (err: any) {
      setIsForgotSending(false);
      const errMsg = err.message || 'Failed to request password reset code.';
      setError(errMsg);
      addToast({ type: 'error', message: errMsg });
    }
  };

  const handleResendForgotOtp = async () => {
    if (forgotCountdown > 0 || isForgotSending) return;
    setError(null);

    const cleanEmail = forgotEmail.trim();
    if (!cleanEmail) {
      setError('Email address is missing.');
      return;
    }

    setIsForgotSending(true);

    try {
      const res = await authService.resendResetOtp({ email: cleanEmail });
      setIsForgotSending(false);

      setForgotCountdown(60);
      setForgotOtpDigits(['', '', '', '', '', '']);
      addToast({
        type: 'success',
        message: res.message || 'Verification code resent successfully.',
      });
      setTimeout(() => {
        document.getElementById('forgot-otp-digit-0')?.focus();
      }, 150);
    } catch (err: any) {
      setIsForgotSending(false);
      const errMsg = err.message || 'Failed to resend verification code.';
      setError(errMsg);
      addToast({ type: 'error', message: errMsg });
    }
  };

  const handleForgotOtpChange = (index: number, val: string) => {
    const clean = val.replace(/[^0-9]/g, '').slice(-1);
    const updated = [...forgotOtpDigits];
    updated[index] = clean;
    setForgotOtpDigits(updated);

    if (clean && index < 5) {
      document.getElementById(\`forgot-otp-digit-\${index + 1}\`)?.focus();
    }
  };

  const handleForgotOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !forgotOtpDigits[index] && index > 0) {
      document.getElementById(\`forgot-otp-digit-\${index - 1}\`)?.focus();
    }
  };

  const handleForgotOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (pasted) {
      const updated = [...forgotOtpDigits];
      for (let i = 0; i < pasted.length; i++) {
        updated[i] = pasted[i];
      }
      setForgotOtpDigits(updated);
      const focusIndex = Math.min(pasted.length, 5);
      document.getElementById(\`forgot-otp-digit-\${focusIndex}\`)?.focus();
    }
  };

  const handleVerifyForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const enteredOtp = forgotOtpDigits.join('');
    if (enteredOtp.length < 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    setIsForgotVerifying(true);

    try {
      const res = await authService.verifyResetOtp({
        email: forgotEmail.trim(),
        otp: enteredOtp,
      });
      setIsForgotVerifying(false);

      if (res.data?.resetToken) {
        setResetToken(res.data.resetToken);
        setForgotStep(3);
        addToast({
          type: 'success',
          message: 'Code verified! Please create your new password.',
        });
      } else {
        throw new Error('Verification failed. No reset token received.');
      }
    } catch (err: any) {
      setIsForgotVerifying(false);
      const errMsg = err.message || 'Invalid or expired verification code.';
      setError(errMsg);
      addToast({ type: 'error', message: errMsg });
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!resetToken) {
      setError('Reset authorization expired or missing. Please start over.');
      setForgotStep(1);
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setIsResettingPassword(true);

    try {
      const res = await authService.resetPassword({
        resetToken,
        newPassword,
        confirmPassword,
      });
      setIsResettingPassword(false);

      setForgotStep(4);
      setEmailOrPhone(forgotEmail.trim());
      setPassword('');
      addToast({
        type: 'success',
        message: res.message || 'Password reset successfully!',
      });
    } catch (err: any) {
      setIsResettingPassword(false);
      const errMsg = err.message || 'Failed to update password. Please try again.';
      setError(errMsg);
      addToast({ type: 'error', message: errMsg });
    }
  };

  const handleFillDemo = (type: 'admin' | 'farmer') => {
    setError(null);
    if (type === 'admin') {
      setEmailOrPhone('admin@formerbench.dev');
      setPassword('DemoPass123!');
      setMode('login');
      addToast({ type: 'info', message: 'Demo Admin credentials filled.' });
    } else {
      setEmailOrPhone('customer@formerbench.dev');
      setPassword('DemoPass123!');
      setMode('login');
      addToast({ type: 'info', message: 'Demo Farmer credentials filled.' });
    }
  };

  const handleGoogleAuth = () => {
    addToast({ type: 'info', message: 'Connecting to Google OAuth single sign-on...' });
    setTimeout(() => {
      const demoUser = {
        id: 'google-farmer-1',
        name: 'Karthik Raja',
        email: 'karthik.raja@gmail.com',
        role: 'CUSTOMER',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      };
      localStorage.setItem('formerbench_auth_token', 'jwt_google_oauth_' + Date.now());
      localStorage.setItem('formerbench_auth_user', JSON.stringify(demoUser));
      addToast({ type: 'success', message: 'Google Authentication Successful!' });
      navigate('/dashboard');
    }, 600);
  };

  return (
    <div className="auth-page-root">
      {/* Top Left Floating "Back to Home" Button */}
      <Link to="/" className="auth-back-home-btn" title="Back to Homepage">
        <ArrowLeft size={16} />
        <span>Back to Home</span>
      </Link>

      {/* Background Slideshow Layers */}
      <div className="auth-slideshow-container">
        {SLIDES.map((slide, idx) => (
          <div
            key={idx}
            className={\`auth-bg-slide \${idx === currentSlide ? 'active' : ''}\`}
            style={{ backgroundImage: \`url(\${slide.image})\` }}
          />
        ))}
        <div className="auth-page-backdrop-overlay" />
      </div>

      {/* 2-Column Balanced Stage */}
      <div className="auth-full-stage">
        {/* =========================================================================
            Hero Text Section (Left Side)
            ========================================================================= */}
        <div className="auth-hero-text-block">
          <div className="auth-sprout-badge">
            <Sprout size={24} strokeWidth={2.4} />
          </div>

          <div className="auth-hero-views-container">
            {/* LOGIN & FORGOT HERO VIEW */}
            <div className={\`auth-hero-content-view \${mode === 'login' || mode === 'forgot' ? 'active' : 'inactive'}\`}>
              <span className="auth-hero-tag">
                {mode === 'forgot' ? 'ACCOUNT RECOVERY' : 'SMART AGRICULTURE'}
              </span>
              <h1 className="auth-hero-title">
                {mode === 'forgot'
                  ? \`Secure\\nAccess\\nRestored\`
                  : \`Growing\\na better\\ntomorrow\`}
              </h1>
              <div className="auth-hero-bar" />
              <p className="auth-hero-desc">
                {mode === 'forgot'
                  ? 'Verify your registered email with a 6-digit secure code to safely reset your account password.'
                  : 'Smart solutions for modern farming. Manage, monitor, and maximize your crop yield with technology.'}
              </p>

              <div className="auth-hero-features-list">
                <div className="auth-hero-feature-pill">
                  <ShieldCheck size={16} className="auth-hero-feature-icon" />
                  <span>Encrypted Email OTP Authentication</span>
                </div>
                <div className="auth-hero-feature-pill">
                  <Users size={16} className="auth-hero-feature-icon" />
                  <span>10,000+ Active Growers Across Tamil Nadu</span>
                </div>
                <div className="auth-hero-feature-pill">
                  <Zap size={16} className="auth-hero-feature-icon" />
                  <span>Fast & Single-Use Password Reset Protection</span>
                </div>
              </div>
            </div>

            {/* SIGNUP HERO VIEW */}
            <div className={\`auth-hero-content-view \${mode === 'signup' ? 'active' : 'inactive'}\`}>
              <span className="auth-hero-tag">JOIN FARMERBENCH</span>
              <h1 className="auth-hero-title">
                Empowering{\`\\n\`}
                every farm,{\`\\n\`}
                every crop
              </h1>
              <div className="auth-hero-bar" />
              <p className="auth-hero-desc">
                Register today to access certified bio-fertilizers, field doctor diagnosis, and real-time advisory.
              </p>

              <div className="auth-hero-features-list">
                <div className="auth-hero-feature-pill">
                  <ShieldCheck size={16} className="auth-hero-feature-icon" />
                  <span>100% Verified Farm Profiles & Security</span>
                </div>
                <div className="auth-hero-feature-pill">
                  <Truck size={16} className="auth-hero-feature-icon" />
                  <span>Direct Farm Gate Deliveries in 24-48 Hours</span>
                </div>
                <div className="auth-hero-feature-pill">
                  <Sparkles size={16} className="auth-hero-feature-icon" />
                  <span>Welcome Coupon: ₹120 Off First Order</span>
                </div>
              </div>
            </div>
          </div>

          {/* Slideshow Progress Dots */}
          <div className="auth-slideshow-dots">
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                className={\`auth-slide-dot \${idx === currentSlide ? 'active' : ''}\`}
                aria-label={\`Go to slide \${idx + 1}\`}
              />
            ))}
          </div>
        </div>

        {/* =========================================================================
            Sliding Auth Card (Right Side in Login, Left Side in Sign Up)
            ========================================================================= */}
        <div className="auth-sliding-card-wrap">
          <div className="auth-form-card">
            
            {/* Top Toggle Switcher: LOGIN | SIGN UP | FORGOT */}
            <div className="auth-tabs-header">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className={\`auth-tab-btn \${mode === 'login' ? 'active' : ''}\`}
              >
                LOGIN
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                }}
                className={\`auth-tab-btn \${mode === 'signup' ? 'active' : ''}\`}
              >
                SIGN UP
              </button>
              {mode === 'forgot' && (
                <button
                  type="button"
                  className="auth-tab-btn active"
                  style={{ color: '#0F4726' }}
                >
                  RESET
                </button>
              )}
            </div>

            {/* Brand Logo & Tagline */}
            <div className="auth-brand-group">
              <img
                src={farmerLogo}
                alt="FarmerBench Logo"
                style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'contain', margin: '0 auto 0.4rem', display: 'block' }}
              />
              <h2 className="auth-brand-name">FarmerBench</h2>
              <p className="auth-brand-tagline">Grow Better, Live Better</p>
              <div className="auth-brand-divider-bar" />
            </div>

            {/* Error Banner */}
            {error && (
              <div
                style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #F87171',
                  color: '#991B1B',
                  borderRadius: '10px',
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  justifyContent: 'center',
                }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* =========================================================================
                MODE: FORGOT PASSWORD FLOW (4 Steps)
                ========================================================================= */}
            {mode === 'forgot' ? (
              <div className="auth-forgot-flow-container">
                {/* STEP 1: Enter Email */}
                {forgotStep === 1 && (
                  <div>
                    <h3 className="auth-welcome-title">Forgot Password</h3>
                    <p className="auth-welcome-sub">Enter your email to receive a password reset code</p>

                    <form onSubmit={handleRequestForgotOtp} className="auth-form">
                      <div className="auth-input-group">
                        <div className="auth-input-icon">
                          <Mail size={18} />
                        </div>
                        <input
                          type="email"
                          placeholder="Registered Email Address"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          className="auth-input"
                          required
                          autoFocus
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isForgotSending || !forgotEmail.trim()}
                        className="auth-submit-btn"
                      >
                        {isForgotSending ? (
                          <span>Sending Verification Code...</span>
                        ) : (
                          <>
                            <span>Send Verification Code</span>
                            <Send size={16} />
                          </>
                        )}
                      </button>

                      <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setMode('login');
                            setError(null);
                          }}
                          className="auth-forgot-link"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                          ← Back to Login
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* STEP 2: Enter 6-Digit OTP */}
                {forgotStep === 2 && (
                  <div>
                    <h3 className="auth-welcome-title">Verify OTP Code</h3>
                    <p className="auth-welcome-sub" style={{ marginBottom: '0.5rem' }}>
                      Enter the 6-digit code sent to <strong>{forgotEmail}</strong>
                    </p>

                    {forgotGenericMessage && (
                      <div
                        style={{
                          backgroundColor: '#F0FDF4',
                          border: '1px solid #86EFAC',
                          color: '#166534',
                          borderRadius: '8px',
                          padding: '0.55rem 0.75rem',
                          fontSize: '0.78rem',
                          marginBottom: '0.85rem',
                          textAlign: 'center',
                        }}
                      >
                        {forgotGenericMessage}
                      </div>
                    )}

                    <div className="auth-otp-timer-banner">
                      <span>⏳ Code expires in 5 minutes</span>
                      {forgotCountdown > 0 ? (
                        <span>Resend in {forgotCountdown}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendForgotOtp}
                          disabled={isForgotSending}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#15803D',
                            fontWeight: 700,
                            cursor: 'pointer',
                            padding: 0,
                            fontSize: '0.8rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <RotateCcw size={12} />
                          Resend Code
                        </button>
                      )}
                    </div>

                    <form onSubmit={handleVerifyForgotOtp} className="auth-form">
                      <div className="auth-otp-inputs-row" onPaste={handleForgotOtpPaste}>
                        {forgotOtpDigits.map((digit, idx) => (
                          <input
                            key={idx}
                            id={\`forgot-otp-digit-\${idx}\`}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleForgotOtpChange(idx, e.target.value)}
                            onKeyDown={(e) => handleForgotOtpKeyDown(idx, e)}
                            className="auth-otp-digit-input"
                            autoFocus={idx === 0}
                          />
                        ))}
                      </div>

                      <button
                        type="submit"
                        disabled={isForgotVerifying || forgotOtpDigits.join('').length < 6}
                        className="auth-submit-btn"
                      >
                        {isForgotVerifying ? (
                          <span>Verifying Code...</span>
                        ) : (
                          <>
                            <span>Verify Code</span>
                            <CheckCircle2 size={16} />
                          </>
                        )}
                      </button>

                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.82rem' }}>
                        <button
                          type="button"
                          onClick={() => setForgotStep(1)}
                          className="auth-forgot-link"
                          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          ← Change Email
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMode('login');
                            setError(null);
                          }}
                          className="auth-forgot-link"
                          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          Back to Login
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* STEP 3: Set New Password */}
                {forgotStep === 3 && (
                  <div>
                    <h3 className="auth-welcome-title">Set New Password</h3>
                    <p className="auth-welcome-sub">Create a strong, new password for your account</p>

                    <form onSubmit={handleResetPasswordSubmit} className="auth-form">
                      {/* New Password */}
                      <div className="auth-input-group">
                        <div className="auth-input-icon">
                          <Lock size={18} />
                        </div>
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          placeholder="New Password (min. 6 characters)"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="auth-input"
                          required
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="auth-input-toggle-eye"
                          aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                        >
                          {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>

                      {/* Confirm Password */}
                      <div className="auth-input-group">
                        <div className="auth-input-icon">
                          <KeyRound size={18} />
                        </div>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm New Password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="auth-input"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="auth-input-toggle-eye"
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>

                      {/* Password Requirements Check */}
                      <div style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: newPassword.length >= 6 ? '#16A34A' : '#64748B' }}>
                          <Check size={13} />
                          <span>At least 6 characters</span>
                        </div>
                        {confirmPassword && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: newPassword === confirmPassword ? '#16A34A' : '#DC2626' }}>
                            <Check size={13} />
                            <span>Passwords match</span>
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={isResettingPassword || newPassword.length < 6 || newPassword !== confirmPassword}
                        className="auth-submit-btn"
                      >
                        {isResettingPassword ? (
                          <span>Updating Password...</span>
                        ) : (
                          <>
                            <span>Reset Password</span>
                            <CheckCircle2 size={16} />
                          </>
                        )}
                      </button>

                      <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setMode('login');
                            setError(null);
                          }}
                          className="auth-forgot-link"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                          ← Cancel & Back to Login
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* STEP 4: Success Screen */}
                {forgotStep === 4 && (
                  <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                    <div
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        backgroundColor: '#DCFCE7',
                        color: '#15803D',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.25rem',
                      }}
                    >
                      <CheckCircle2 size={36} />
                    </div>

                    <h3 className="auth-welcome-title" style={{ fontSize: '1.3rem', marginBottom: '0.4rem' }}>
                      Password Reset Successfully!
                    </h3>
                    <p className="auth-welcome-sub" style={{ marginBottom: '1.5rem', lineHeight: '1.5' }}>
                      Your FarmerBench account password has been updated. You can now log in with your new password.
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setError(null);
                      }}
                      className="auth-submit-btn"
                    >
                      <span>Log In With New Password</span>
                      <Sprout size={18} strokeWidth={2.4} />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* =========================================================================
                  STANDARD LOGIN & SIGN UP FORMS (SLIDING TRACK)
                  ========================================================================= */
              <div className="auth-form-slider-viewport">
                <div className={\`auth-form-slider-track \${mode === 'signup' ? 'signup-track' : 'login-track'}\`}>
                  
                  {/* -------------------------------------------------------------------
                      Pane 1: LOGIN FORM
                      ------------------------------------------------------------------- */}
                  <div className="auth-form-slide-pane">
                    <h3 className="auth-welcome-title">Welcome Back!</h3>
                    <p className="auth-welcome-sub">Login to continue your agricultural journey</p>

                    <form onSubmit={handleSubmitPasswordLogin} className="auth-form">
                      {/* Email or Phone Number */}
                      <div className="auth-input-group">
                        <div className="auth-input-icon">
                          <Mail size={18} />
                        </div>
                        <input
                          type="text"
                          placeholder="Email or Phone Number"
                          value={emailOrPhone}
                          onChange={(e) => setEmailOrPhone(e.target.value)}
                          className="auth-input"
                          required={mode === 'login'}
                        />
                      </div>

                      {/* Password Field with Show/Hide Eye Toggle */}
                      <div className="auth-input-group">
                        <div className="auth-input-icon">
                          <Lock size={18} />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="auth-input"
                          required={mode === 'login'}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="auth-input-toggle-eye"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>

                      {/* Remember me & Forgot password */}
                      <div className="auth-meta-row">
                        <label className="auth-remember-label">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            style={{ accentColor: '#15803D', width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          <span>Remember me</span>
                        </label>

                        <button
                          type="button"
                          onClick={handleStartForgotPassword}
                          className="auth-forgot-link"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        >
                          Forgot Password?
                        </button>
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={isLoggingIn}
                        className="auth-submit-btn"
                      >
                        <span>{isLoggingIn ? 'Logging in...' : 'Login'}</span>
                        <Sprout size={18} strokeWidth={2.4} />
                      </button>
                    </form>
                  </div>

                  {/* -------------------------------------------------------------------
                      Pane 2: SIGN UP FORM (With In-Textfield Send/Verify OTP)
                      ------------------------------------------------------------------- */}
                  <div className="auth-form-slide-pane">
                    <h3 className="auth-welcome-title">Create Account</h3>
                    <p className="auth-welcome-sub">Join thousands of verified farmers & growers</p>

                    <form onSubmit={handleFinalSignupSubmit} className="auth-form">
                      {/* Full Name */}
                      <div className="auth-input-group">
                        <div className="auth-input-icon">
                          <UserIcon size={18} />
                        </div>
                        <input
                          type="text"
                          placeholder="Farmer / Business Name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="auth-input"
                          required={mode === 'signup'}
                        />
                      </div>

                      {/* Email Field with INLINE Send OTP / Verified Button */}
                      <div className="auth-input-group">
                        <div className="auth-input-icon">
                          <Mail size={18} />
                        </div>
                        <input
                          type="email"
                          placeholder="Email Address"
                          value={emailOrPhone}
                          disabled={isEmailVerified}
                          onChange={(e) => {
                            setEmailOrPhone(e.target.value);
                            setIsEmailVerified(false);
                            setSignupOtpSent(false);
                          }}
                          className="auth-input"
                          style={{ paddingRight: isEmailVerified ? '110px' : '105px' }}
                          required={mode === 'signup'}
                        />
                        <div className="auth-input-action-wrap">
                          {isEmailVerified ? (
                            <span className="auth-verified-badge" title="Email is verified">
                              <Check size={14} strokeWidth={3} />
                              Verified
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={handleSendSignupInlineOtp}
                              disabled={isSignupOtpSending || signupCountdown > 0 || !emailOrPhone.includes('@')}
                              className="auth-input-inline-btn"
                            >
                              {isSignupOtpSending ? (
                                'Sending...'
                              ) : signupCountdown > 0 ? (
                                \`Resend in \${signupCountdown}s\`
                              ) : signupOtpSent ? (
                                'Resend OTP'
                              ) : (
                                <>
                                  <Send size={12} />
                                  <span>Send OTP</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Inline OTP Input Box on Signup */}
                      {signupOtpSent && !isEmailVerified && (
                        <div className="auth-inline-otp-box">
                          <div className="auth-inline-otp-header">
                            <span className="auth-inline-otp-title">Enter 6-Digit OTP Code</span>
                            <span className="auth-inline-otp-timer">Expires in 5m</span>
                          </div>

                          <div className="auth-inline-otp-body">
                            <div className="auth-otp-inputs-row" onPaste={handleSignupOtpPaste}>
                              {signupOtpDigits.map((digit, idx) => (
                                <input
                                  key={idx}
                                  id={\`signup-inline-otp-\${idx}\`}
                                  type="text"
                                  maxLength={1}
                                  value={digit}
                                  onChange={(e) => handleSignupOtpChange(idx, e.target.value)}
                                  onKeyDown={(e) => handleSignupOtpKeyDown(idx, e)}
                                  className="auth-otp-digit-input"
                                  autoFocus={idx === 0}
                                />
                              ))}
                            </div>

                            <button
                              type="button"
                              onClick={handleVerifySignupInlineOtp}
                              disabled={isSignupVerifying || signupOtpDigits.join('').length < 6}
                              className="auth-inline-verify-btn"
                            >
                              {isSignupVerifying ? 'Checking...' : 'Verify OTP'}
                              <CheckCircle2 size={15} />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Phone Number */}
                      <div className="auth-input-group">
                        <div className="auth-input-icon">
                          <Phone size={18} />
                        </div>
                        <input
                          type="tel"
                          placeholder="Phone Number (e.g. +91 98421 88321)"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="auth-input"
                        />
                      </div>

                      {/* Password */}
                      <div className="auth-input-group">
                        <div className="auth-input-icon">
                          <Lock size={18} />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Create Password (min. 6 chars)"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="auth-input"
                          required={mode === 'signup'}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="auth-input-toggle-eye"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>

                      {/* District / Location */}
                      <div className="auth-input-group">
                        <div className="auth-input-icon">
                          <MapPin size={18} />
                        </div>
                        <input
                          type="text"
                          placeholder="District / State (e.g. Thanjavur, TN)"
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          className="auth-input"
                        />
                      </div>

                      {/* Terms Agreement */}
                      <div className="auth-meta-row">
                        <label className="auth-remember-label" style={{ fontSize: '0.78rem' }}>
                          <input
                            type="checkbox"
                            defaultChecked
                            required
                            style={{ accentColor: '#15803D', width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          <span>I accept Terms of Service & Privacy Policy</span>
                        </label>
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={!isEmailVerified || isSubmittingSignup}
                        className="auth-submit-btn"
                        style={
                          !isEmailVerified
                            ? {
                                background: '#E2E8F0',
                                color: '#94A3B8',
                                boxShadow: 'none',
                                cursor: 'not-allowed',
                              }
                            : undefined
                        }
                      >
                        {isSubmittingSignup ? (
                          <span>Creating Account...</span>
                        ) : !isEmailVerified ? (
                          <span>Verify Email OTP to Create Account</span>
                        ) : (
                          <>
                            <span>Create Account & Start Farming</span>
                            <Sprout size={18} strokeWidth={2.4} />
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                </div>
              </div>
            )}

            {/* "or" Divider (Only in login/signup) */}
            {mode !== 'forgot' && (
              <>
                <div className="auth-or-divider">
                  <span>or</span>
                </div>

                {/* Social / Alternative Sign In Buttons */}
                <div className="auth-social-group">
                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    className="auth-social-btn"
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18">
                      <path
                        fill="#4285F4"
                        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z"
                      />
                      <path
                        fill="#34A853"
                        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"
                      />
                      <path
                        fill="#EA4335"
                        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                </div>

                {/* Quick Demo Autofill Box */}
                <div className="auth-demo-box">
                  <span className="auth-demo-title">Quick Demo Login:</span>
                  <div className="auth-demo-actions">
                    <button
                      type="button"
                      onClick={() => handleFillDemo('farmer')}
                      className="auth-demo-btn"
                    >
                      Farmer Account
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFillDemo('admin')}
                      className="auth-demo-btn"
                    >
                      Admin Account
                    </button>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
`;

fs.writeFileSync(targetFile, content, 'utf8');
console.log('✅ Updated LoginPage.tsx with complete 4-step Forgot Password flow');
