import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Scissors, Lock, Mail, User, Phone, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import fetchApi from '../lib/api';

export default function AuthPage() {
  const [tab, setTab] = useState('LOGIN'); // 'LOGIN' or 'REGISTER'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password states
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotResult, setForgotResult] = useState(null);

  // Reset password states
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);

  // Email OTP verification states for registration
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cooldown countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const { login, register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from || null;

  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    if (!fullName.trim() || fullName.trim().length < 2) {
      toast.error('Please enter your full name (at least 2 characters).');
      return;
    }
    if (!phoneNumber.trim() || phoneNumber.trim().length < 10) {
      toast.error('Please enter a valid mobile number (at least 10 digits).');
      return;
    }
    if (!email.trim()) {
      toast.error('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }

    setSendingOtp(true);
    try {
      const res = await fetchApi('/auth/send-registration-otp', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() })
      });
      setIsOtpStep(true);
      setResendCooldown(30);
      toast.success(res.message || 'Verification code sent to ' + email);
    } catch (err) {
      toast.error(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyAndRegister = async (e) => {
    if (e) e.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) {
      toast.error('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const res = await register({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        otp: otp.trim()
      });
      toast.success('Account created and verified successfully!');
      navigate(from || '/portal');
    } catch (err) {
      toast.error(err.message || 'Registration failed. Please verify your OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (tab === 'LOGIN') {
        const res = await login(email, password);
        toast.success('Signed in successfully!');
        if (res.data?.role === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate(from || '/portal');
        }
      } else {
        const res = await register({ email, password, fullName, phoneNumber });
        toast.success('Account created successfully!');
        navigate(from || '/portal');
      }
    } catch (err) {
      toast.error(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      const res = await fetchApi('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: forgotEmail })
      });
      setForgotResult(res);
      toast.info('Reset token generated.');
      if (res.devResetToken) {
        setResetToken(res.devResetToken);
      }
    } catch (err) {
      toast.error(err.message || 'Request failed.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetSubmitting(true);
    try {
      const res = await fetchApi('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token: resetToken, password: newPassword })
      });
      toast.success(res.message || 'Password reset successfully! Please sign in.');
      setForgotModalOpen(false);
      setForgotResult(null);
      setResetToken('');
      setNewPassword('');
    } catch (err) {
      toast.error(err.message || 'Password reset failed.');
    } finally {
      setResetSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-20 space-y-8">
      
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-bronze/10 border border-bronze/30 flex items-center justify-center text-bronze mx-auto">
          <Scissors className="w-6 h-6 -rotate-45" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-ivory">
          Santosh Hair Art
        </h1>
        <p className="text-xs text-ivory/60">
          Sign in to manage your appointments, booking history, and profile.
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-charcoal-800 p-1 rounded-xl flex border border-white/5">
        <button
          onClick={() => { setTab('LOGIN'); setIsOtpStep(false); setOtp(''); }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
            tab === 'LOGIN' ? 'bg-bronze text-charcoal-900 shadow-md' : 'text-ivory/60 hover:text-ivory'
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => { setTab('REGISTER'); setIsOtpStep(false); setOtp(''); }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
            tab === 'REGISTER' ? 'bg-bronze text-charcoal-900 shadow-md' : 'text-ivory/60 hover:text-ivory'
          }`}
        >
          Create Account
        </button>
      </div>

      {/* Form Card */}
      <div className="bg-charcoal-800 rounded-2xl border border-white/5 p-6 sm:p-8 shadow-xl">
        {tab === 'REGISTER' && isOtpStep ? (
          <form onSubmit={handleVerifyAndRegister} className="space-y-5 animate-fade-in text-center">
            <div className="w-12 h-12 rounded-full bg-bronze/10 border border-bronze/30 flex items-center justify-center text-bronze mx-auto">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-ivory">
                Verify Your Email
              </h3>
              <p className="text-xs text-ivory/60 mt-1">
                We sent a 6-digit verification code to <span className="font-semibold text-bronze">{email}</span>.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-ivory/80 mb-2">
                Enter 6-Digit Code
              </label>
              <input
                type="text"
                maxLength={6}
                required
                autoFocus
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="• • • • • •"
                className="w-full tracking-[8px] text-center text-xl font-mono py-3 bg-charcoal-900 border border-white/20 rounded-xl text-ivory focus:outline-none focus:border-bronze"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-bronze text-charcoal-900 font-bold text-sm hover:bg-bronze-light transition disabled:opacity-50 shadow-lg"
            >
              <span>{loading ? 'Verifying...' : 'Verify & Create Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={() => setIsOtpStep(false)}
                className="text-ivory/50 hover:text-ivory underline"
              >
                Change details
              </button>

              <button
                type="button"
                disabled={resendCooldown > 0 || sendingOtp}
                onClick={() => handleRequestOtp()}
                className="text-bronze hover:underline disabled:opacity-40"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : sendingOtp ? 'Sending...' : 'Resend code'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={tab === 'LOGIN' ? handleSubmit : handleRequestOtp} className="space-y-4">
            
            {tab === 'REGISTER' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-ivory/80 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-ivory/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Anand Patel"
                      className="w-full pl-10 pr-4 py-2.5 bg-charcoal-900 border border-white/10 rounded-lg text-sm text-ivory focus:outline-none focus:border-bronze"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-ivory/80 mb-1">
                    Mobile Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-ivory/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full pl-10 pr-4 py-2.5 bg-charcoal-900 border border-white/10 rounded-lg text-sm text-ivory focus:outline-none focus:border-bronze"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-ivory/80 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-ivory/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. customer@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-charcoal-900 border border-white/10 rounded-lg text-sm text-ivory focus:outline-none focus:border-bronze"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-medium text-ivory/80">
                  Password *
                </label>
                {tab === 'LOGIN' && (
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(true)}
                    className="text-[11px] text-bronze hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-ivory/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full pl-10 pr-4 py-2.5 bg-charcoal-900 border border-white/10 rounded-lg text-sm text-ivory focus:outline-none focus:border-bronze"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || sendingOtp}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-bronze text-charcoal-900 font-bold text-sm hover:bg-bronze-light transition disabled:opacity-50 mt-2 shadow-lg"
            >
              <span>{loading || sendingOtp ? 'Processing...' : tab === 'LOGIN' ? 'Sign In' : 'Continue & Verify Email'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}


      </div>

      {/* Forgot / Reset Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-charcoal-800 rounded-2xl border border-white/10 p-6 sm:p-8 max-w-md w-full space-y-6">
            <h3 className="font-serif text-xl font-bold text-ivory">
              Password Recovery
            </h3>

            {!forgotResult ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-xs text-ivory/70">
                  Enter your email address and we will generate a secure one-time password reset token.
                </p>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-2.5 bg-charcoal-900 border border-white/10 rounded-lg text-sm text-ivory focus:outline-none focus:border-bronze"
                />
                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="px-4 py-2 text-xs text-ivory/60 hover:text-ivory"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-5 py-2 rounded-lg bg-bronze text-charcoal-900 font-bold text-xs"
                  >
                    {forgotLoading ? 'Generating...' : 'Request Token'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="p-3 rounded-lg bg-charcoal-900 text-xs text-emerald-400 border border-emerald-500/20">
                  Reset token generated! Enter your new password below.
                </div>
                <div>
                  <label className="block text-xs text-ivory/70 mb-1">Reset Token</label>
                  <input
                    type="text"
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    className="w-full px-3 py-2 bg-charcoal-900 border border-white/10 rounded-lg text-xs font-mono text-bronze"
                  />
                </div>
                <div>
                  <label className="block text-xs text-ivory/70 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full px-3 py-2 bg-charcoal-900 border border-white/10 rounded-lg text-xs text-ivory"
                  />
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotModalOpen(false);
                      setForgotResult(null);
                    }}
                    className="px-4 py-2 text-xs text-ivory/60"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={resetSubmitting}
                    className="px-5 py-2 rounded-lg bg-bronze text-charcoal-900 font-bold text-xs"
                  >
                    {resetSubmitting ? 'Updating...' : 'Set New Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
