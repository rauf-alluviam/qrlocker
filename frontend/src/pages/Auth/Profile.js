import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import QRCode from 'qrcode.react';
import { toast } from 'react-toastify';

const Profile = () => {
  const { user, updateProfile, setup2FA, verify2FA, disable2FA, loading } = useAuthStore();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [passwordError, setPasswordError] = useState('');
  const [twoFactorSetup, setTwoFactorSetup] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [showDisable, setShowDisable] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '',
        confirmPassword: '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    
    // Clear password error when either password field changes
    if (e.target.name === 'password' || e.target.name === 'confirmPassword') {
      setPasswordError('');
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    // Check if passwords match if one is provided
    if ((formData.password || formData.confirmPassword) && formData.password !== formData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    // Prepare the update data
    const updateData = {
      name: formData.name,
      email: formData.email,
    };
    
    if (formData.password) {
      updateData.password = formData.password;
    }
    
    const success = await updateProfile(updateData);
    
    if (success) {
      setFormData({
        ...formData,
        password: '',
        confirmPassword: '',
      });
    }
  };

  const handleSetup2FA = async () => {
    try {
      const setupData = await setup2FA();
      if (setupData) {
        setTwoFactorSetup(setupData);
        setShowSetup(true);
      }
    } catch (error) {
      toast.error('Failed to setup two-factor authentication');
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    
    if (!verificationCode) {
      toast.error('Please enter the verification code');
      return;
    }
    
    const success = await verify2FA(verificationCode);
    
    if (success) {
      setShowSetup(false);
      setVerificationCode('');
      setTwoFactorSetup(null);
    }
  };

  const handleDisable2FA = async (e) => {
    e.preventDefault();
    
    if (!disablePassword) {
      toast.error('Please enter your password');
      return;
    }
    
    const success = await disable2FA(disablePassword, disableCode);
    
    if (success) {
      setShowDisable(false);
      setDisableCode('');
      setDisablePassword('');
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Profile Settings</h1>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg leading-6 font-medium text-gray-900">Account Information</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Update your personal details and security settings.</p>
        </div>
        
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <form onSubmit={handleProfileUpdate}>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    autoComplete="name"
                    className="form-input"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    name="email"
                    id="email"
                    autoComplete="email"
                    className="form-input"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  New Password (optional)
                </label>
                <div className="mt-1">
                  <input
                    type="password"
                    name="password"
                    id="password"
                    autoComplete="new-password"
                    className="form-input"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <div className="mt-1">
                  <input
                    type="password"
                    name="confirmPassword"
                    id="confirmPassword"
                    autoComplete="new-password"
                    className="form-input"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
                {passwordError && (
                  <p className="mt-2 text-sm text-error-500">{passwordError}</p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-6">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg leading-6 font-medium text-gray-900">Two-Factor Authentication</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Secure your account with an additional layer of protection.</p>
        </div>
        
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          {user?.twoFactorEnabled ? (
            <>
              <div className="flex items-center text-sm text-green-600 mb-4">
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Two-factor authentication is enabled
              </div>
              <button
                type="button"
                className="btn-danger"
                onClick={() => setShowDisable(true)}
              >
                Disable Two-Factor Authentication
              </button>
              
              {showDisable && (
                <div className="mt-4 p-4 border rounded-md bg-gray-50">
                  <h3 className="text-lg font-medium text-gray-900">Disable Two-Factor Authentication</h3>
                  <p className="mt-1 text-sm text-gray-500">Please enter your password and verification code to disable two-factor authentication.</p>
                  
                  <form onSubmit={handleDisable2FA} className="mt-4">
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="disablePassword" className="block text-sm font-medium text-gray-700">
                          Password
                        </label>
                        <input
                          type="password"
                          id="disablePassword"
                          name="disablePassword"
                          value={disablePassword}
                          onChange={(e) => setDisablePassword(e.target.value)}
                          className="form-input"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="disableCode" className="block text-sm font-medium text-gray-700">
                          Verification Code
                        </label>
                        <input
                          type="text"
                          id="disableCode"
                          name="disableCode"
                          value={disableCode}
                          onChange={(e) => setDisableCode(e.target.value)}
                          className="form-input"
                          required
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          className="btn-outline"
                          onClick={() => setShowDisable(false)}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn-danger"
                          disabled={loading}
                        >
                          {loading ? 'Processing...' : 'Disable 2FA'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Two-factor authentication adds an extra layer of security to your account by requiring more than just a password to sign in.
              </p>
              
              {!showSetup ? (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSetup2FA}
                  disabled={loading}
                >
                  {loading ? 'Setting up...' : 'Setup Two-Factor Authentication'}
                </button>
              ) : (
                <div className="mt-4 p-4 border rounded-md bg-gray-50">
                  <h3 className="text-lg font-medium text-gray-900">Setup Two-Factor Authentication</h3>
                  <p className="mt-1 text-sm text-gray-500">Scan the QR code with your authenticator app (like Google Authenticator or Authy).</p>
                  
                  <div className="mt-4 flex justify-center">
                    {twoFactorSetup && (
                      <div className="p-2 bg-white">
                        <QRCode
                          value={twoFactorSetup.otpauth_url}
                          size={200}
                          level="H"
                          includeMargin={true}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Or enter this code manually in your app:</p>
                    <code className="block p-2 bg-gray-100 rounded text-sm font-mono break-all">
                      {twoFactorSetup?.secret}
                    </code>
                  </div>
                  
                  <form onSubmit={handleVerify2FA} className="mt-4">
                    <div>
                      <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700">
                        Verification Code
                      </label>
                      <input
                        type="text"
                        id="verificationCode"
                        name="verificationCode"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        className="form-input"
                        required
                      />
                    </div>
                    
                    <div className="mt-4 flex justify-end space-x-3">
                      <button
                        type="button"
                        className="btn-outline"
                        onClick={() => {
                          setShowSetup(false);
                          setTwoFactorSetup(null);
                          setVerificationCode('');
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                      >
                        {loading ? 'Verifying...' : 'Verify & Enable'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-6">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg leading-6 font-medium text-gray-900">Account Information</h2>
        </div>
        
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Role</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 capitalize">{user?.role}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Organization</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user?.organization?.name || "Loading..."}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Department</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user?.department?.name || "Loading..."}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Account Created</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default Profile;