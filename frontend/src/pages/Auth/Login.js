import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const { user, login, loading, error, requireTwoFactor, twoFactorEmail, resetTwoFactorState, isInitialized } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Get redirect URL from query string if it exists
  const queryParams = new URLSearchParams(location.search);
  const redirectUrl = queryParams.get('redirect') || '/';

  // Redirect authenticated users away from login page
  useEffect(() => {
    if (isInitialized && user) {
      navigate(redirectUrl, { replace: true });
    }
  }, [user, isInitialized, navigate, redirectUrl]);

  // Handle the form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (requireTwoFactor) {
      // Submit with 2FA code
      const success = await login(twoFactorEmail, password, twoFactorCode);
      if (success) {
        // Use replace to avoid going back to login page
        navigate(redirectUrl, { replace: true });
      }
    } else {
      // Initial login
      const success = await login(email, password);
      if (success) {
        // Use replace to avoid going back to login page
        navigate(redirectUrl, { replace: true });
      }
    }
  };

  // Reset 2FA state when component unmounts
  useEffect(() => {
    return () => {
      resetTwoFactorState();
    };
  }, [resetTwoFactorState]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <svg className="h-12 w-auto text-primary-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4H20V20H4V4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M7 7H17V17H7V7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10 10H14V14H10V10Z" fill="currentColor" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {requireTwoFactor ? 'Enter verification code' : 'Sign in to your account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {requireTwoFactor 
              ? 'Please enter the verification code from your authenticator app' 
              : 'Or '}
            {!requireTwoFactor && (
              <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
                create a new account
              </Link>
            )}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            {requireTwoFactor ? (
              <div>
                <label htmlFor="two-factor-code" className="sr-only">
                  Verification Code
                </label>
                <input
                  id="two-factor-code"
                  name="code"
                  type="text"
                  autoComplete="one-time-code"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Verification code"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                />
              </div>
            ) : (
              <>
                <div>
                  <label htmlFor="email-address" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none rounded-t-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="password" className="sr-only">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="appearance-none rounded-b-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          {error && (
            <div className="text-sm text-error-500">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400"
            >
              {loading ? (
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
              ) : null}
              {requireTwoFactor ? 'Verify' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;