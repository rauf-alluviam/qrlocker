import React, { useState, useEffect } from 'react';
import {
  LockClosedIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import api from '../../services/api';

const QRAdvancedSettings = ({ bundle, onClose, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    hasPasscode: false,
    passcodeType: 'random',
    passcode: '',
    showLockStatus: false,
  });
  const [generatedPasscode, setGeneratedPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);

  useEffect(() => {
    if (bundle) {
      setSettings({
        hasPasscode: bundle.accessControl?.hasPasscode || false,
        passcodeType: 'random',
        passcode: '',
        showLockStatus: bundle.accessControl?.showLockStatus || false,
      });
      
      // If bundle has a passcode, attempt to get it
      if (bundle.accessControl?.hasPasscode) {
        fetchCurrentPasscode();
      }
    }
  }, [bundle]);

  const fetchCurrentPasscode = async () => {
    try {
      const response = await api.get(`/qr/${bundle._id}`);
      if (response.data.accessControl?.passcode) {
        setGeneratedPasscode(response.data.accessControl.passcode);
      }
    } catch (error) {
      console.error('Error fetching current passcode:', error);
    }
  };

  const generateRandomPasscode = () => {
    // Generate a 6-digit alphanumeric passcode
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing characters like 0, O, 1, I
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPasscode(result);
    return result;
  };

  const handleSave = async () => {
    setLoading(true);
    
    try {
      // Prepare update data
      const updateData = {
        accessControl: {
          hasPasscode: settings.hasPasscode,
          showLockStatus: settings.showLockStatus,
        },
      };
      
      // If passcode is enabled, add the appropriate passcode
      if (settings.hasPasscode) {
        if (settings.passcodeType === 'random') {
          // Use the displayed generated passcode or generate a new one
          updateData.accessControl.passcode = generatedPasscode || generateRandomPasscode();
        } else {
          // Use custom passcode
          if (!settings.passcode.trim()) {
            toast.error('Please enter a custom passcode');
            setLoading(false);
            return;
          }
          updateData.accessControl.passcode = settings.passcode.trim().toUpperCase();
        }
      }
      
      // Update bundle
      const response = await api.put(`/qr/${bundle._id}`, updateData);
      
      if (response.data) {
        toast.success('QR settings updated successfully');
        onUpdate(response.data); // Send updated bundle to parent
        // Don't close automatically to let the user see the generated passcode
      }
    } catch (error) {
      console.error('Error updating QR settings:', error);
      toast.error('Failed to update QR settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 md:mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <LockClosedIcon className="h-5 w-5 mr-2 text-primary-500" />
            Advanced QR Settings
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-6">
            {/* Password Protection Toggle */}
            <div>
              <div className="flex items-start pb-4 border-b border-gray-200">
                <div className="flex items-center h-5">
                  <input
                    id="hasPasscode"
                    name="hasPasscode"
                    type="checkbox"
                    checked={settings.hasPasscode}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="hasPasscode" className="text-sm font-medium text-gray-700 flex items-center">
                    Enable Password Protection
                  </label>
                  <p className="text-sm text-gray-500">
                    Require a password to access the QR bundle content
                  </p>
                </div>
              </div>
            </div>

            {/* Password Configuration */}
            {settings.hasPasscode && (
              <div className="space-y-4">
                <div className="flex flex-col space-y-4">
                  {/* Random Password Option */}
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="randomPassword"
                        name="passcodeType"
                        type="radio"
                        value="random"
                        checked={settings.passcodeType === 'random'}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                    </div>
                    <div className="ml-3">
                      <label htmlFor="randomPassword" className="text-sm font-medium text-gray-700">
                        Generate random 6-digit password
                      </label>
                    </div>
                  </div>

                  {/* Random Password Display */}
                  {settings.passcodeType === 'random' && (
                    <div className="ml-7">
                      <div className="flex items-center space-x-2">
                        <div className="border border-gray-300 rounded-md px-3 py-2 bg-gray-50 flex-grow text-center font-mono text-lg tracking-wider">
                          {generatedPasscode || '------'}
                        </div>
                        <button
                          type="button"
                          onClick={() => generateRandomPasscode()}
                          className="p-2 border border-gray-300 rounded-md hover:bg-gray-100"
                          title="Generate new random password"
                        >
                          <ArrowPathIcon className="h-5 w-5 text-gray-600" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        This password will be required to access the documents
                      </p>
                    </div>
                  )}

                  {/* Custom Password Option */}
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="customPassword"
                        name="passcodeType"
                        type="radio"
                        value="custom"
                        checked={settings.passcodeType === 'custom'}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                    </div>
                    <div className="ml-3">
                      <label htmlFor="customPassword" className="text-sm font-medium text-gray-700">
                        Set custom password
                      </label>
                    </div>
                  </div>

                  {/* Custom Password Input */}
                  {settings.passcodeType === 'custom' && (
                    <div className="ml-7">
                      <div className="relative">
                        <input
                          type={showPasscode ? 'text' : 'password'}
                          name="passcode"
                          value={settings.passcode}
                          onChange={handleInputChange}
                          placeholder="Enter custom password"
                          className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500 pr-10"
                          maxLength={20}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasscode(!showPasscode)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPasscode ? (
                            <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                          ) : (
                            <EyeIcon className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Custom passwords are case-insensitive and will be converted to uppercase
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Lock Visibility Toggle */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="showLockStatus"
                    name="showLockStatus"
                    type="checkbox"
                    checked={settings.showLockStatus}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="showLockStatus" className="text-sm font-medium text-gray-700 flex items-center">
                    <ShieldCheckIcon className="h-4 w-4 mr-2 text-orange-500" />
                    Show lock status on scan
                  </label>
                  <p className="text-sm text-gray-500">
                    Display a "🔒 Locked Document" message to users who scan the QR code before entering a password
                  </p>
                </div>
              </div>
            </div>

            {/* Access Scope Label */}
            <div className="bg-blue-50 p-4 rounded-md mt-6">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Access Scope</h4>
              <p className="text-sm text-blue-700">
                Even if the QR document is publicly accessible, password protection will restrict access. Only users with the correct password can view the document.
              </p>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <div className="space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 align-[-2px]"></span>
                  Saving...
                </>
              ) : (
                'Save & Apply Settings'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRAdvancedSettings;
