import React, { useState } from 'react';
import { 
  LockClosedIcon, 
  EyeIcon, 
  EyeSlashIcon,
  ArrowLeftIcon,
  ExclamationCircleIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import { toast } from 'react-toastify';

const PasscodeEntry = ({ uuid, bundle, onSuccess, onCancel }) => {
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!passcode.trim()) {
      setError('Please enter the passcode');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post(`/qr/verify-passcode/${uuid}`, {
        passcode: passcode.trim().toUpperCase()
      });

      // Success - call the onSuccess callback with the verified bundle data
      onSuccess(response.data);
      
    } catch (error) {
      setAttempts(prev => prev + 1);
      console.error('Error verifying passcode:', error);
      
      if (error.response?.status === 401) {
        setError('Invalid passcode. Please try again.');
      } else if (error.response?.status === 403) {
        setError('This QR bundle is not accessible.');
      } else if (error.response?.status === 404) {
        setError('QR bundle not found.');
      } else {
        setError('Failed to verify passcode. Please try again.');
      }
      
      // Clear passcode on error
      setPasscode('');
      
      // Show toast for repeated failures
      if (attempts >= 2) {
        toast.error('Multiple failed attempts. Please check your passcode.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasscodeChange = (e) => {
    // Convert to uppercase and limit to reasonable length
    const value = e.target.value.toUpperCase().slice(0, 20);
    setPasscode(value);
    setError(''); // Clear error when user starts typing
  };

  const handleEmailPasscodeRequest = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    if (!bundle?._id) {
      toast.error('Bundle information not available');
      return;
    }

    setEmailLoading(true);

    try {
      await api.post(`/qr/${bundle._id}/send-passcode`, {
        email: email.trim()
      });

      toast.success(`Passcode sent to ${email}`);
      setShowEmailForm(false);
      setEmail('');
    } catch (error) {
      console.error('Error sending passcode email:', error);
      if (error.response?.status === 403) {
        toast.error('Not authorized to request passcode for this bundle');
      } else if (error.response?.status === 400) {
        toast.error('This bundle does not have passcode protection enabled');
      } else {
        toast.error('Failed to send passcode. Please try again.');
      }
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-8">
      <div className="text-center mb-6">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-orange-100 mb-4">
          <LockClosedIcon className="h-8 w-8 text-orange-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Enter Passcode</h2>
        <p className="text-gray-600">
          This QR bundle is password protected. Please enter the passcode to access the documents.
        </p>
      </div>

      {/* Bundle Info */}
      {bundle && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-2">{bundle.title}</h3>
          {bundle.description && (
            <p className="text-sm text-gray-600">{bundle.description}</p>
          )}
          {bundle.organization && (
            <p className="text-xs text-gray-500 mt-2">
              {bundle.organization.name}
              {bundle.department && ` • ${bundle.department.name}`}
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Passcode Input */}
        <div>
          <label htmlFor="passcode" className="block text-sm font-medium text-gray-700 mb-2">
            Passcode
          </label>
          <div className="relative">
            <input
              type={showPasscode ? 'text' : 'password'}
              id="passcode"
              value={passcode}
              onChange={handlePasscodeChange}
              placeholder="Enter passcode"
              className={`block w-full pr-12 py-3 px-4 border rounded-lg shadow-sm text-center text-lg font-mono tracking-wider focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                error 
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                  : 'border-gray-300'
              }`}
              disabled={loading}
              autoComplete="off"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPasscode(!showPasscode)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              disabled={loading}
            >
              {showPasscode ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
          
          {error && (
            <div className="mt-2 flex items-center text-sm text-red-600">
              <ExclamationCircleIcon className="h-4 w-4 mr-1" />
              {error}
            </div>
          )}
          
          {attempts > 0 && !error && (
            <p className="mt-2 text-sm text-gray-500">
              {attempts} failed attempt{attempts !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-col space-y-3">
          <button
            type="submit"
            disabled={loading || !passcode.trim()}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Verifying...
              </div>
            ) : (
              'Access Documents'
            )}
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Cancel
          </button>
        </div>
      </form>

      {/* Help Text */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500 mb-3">
          Don't have the passcode? 
        </p>
        <button
          type="button"
          onClick={() => setShowEmailForm(!showEmailForm)}
          disabled={loading}
          className="text-sm text-indigo-600 hover:text-indigo-500 underline"
        >
          Request passcode via email
        </button>
      </div>

      {/* Email Form */}
      {showEmailForm && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Request Passcode</h3>
          <form onSubmit={handleEmailPasscodeRequest} className="space-y-3">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                disabled={emailLoading}
                required
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={emailLoading || !email.trim()}
                className="flex-1 flex justify-center items-center py-2 px-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {emailLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </div>
                ) : (
                  <>
                    <EnvelopeIcon className="h-4 w-4 mr-2" />
                    Send Passcode
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEmailForm(false);
                  setEmail('');
                }}
                disabled={emailLoading}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
          <p className="text-xs text-gray-500 mt-2">
            The passcode will be sent to your email if you have permission to access this bundle.
          </p>
        </div>
      )}
    </div>
  );
};

export default PasscodeEntry;
