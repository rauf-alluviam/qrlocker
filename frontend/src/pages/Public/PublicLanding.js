import React from 'react';
import { Link } from 'react-router-dom';
import {
  DocumentTextIcon,
  InboxIcon,
  CheckCircleIcon,
  ClockIcon,
  EnvelopeIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

const PublicLanding = () => {
  const features = [
    {
      name: 'Simple Request Process',
      description: 'Submit document access requests with just a few clicks. No account registration required.',
      icon: DocumentTextIcon,
    },
    {
      name: 'Fast Processing',
      description: 'Requests are reviewed promptly by organization administrators.',
      icon: ClockIcon,
    },
    {
      name: 'Email Notifications',
      description: 'Receive updates on your request status directly in your inbox.',
      icon: EnvelopeIcon,
    },
    {
      name: 'Secure Access',
      description: 'Access approved documents through secure QR codes and links.',
      icon: CheckCircleIcon,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      {/* Header */}
      <div className="relative bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6 md:justify-start md:space-x-10">
            <div className="flex justify-start lg:w-0 lg:flex-1">
              <Link to="/" className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-auto text-indigo-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 4H20V20H4V4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M7 7H17V17H7V7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M10 10H14V14H10V10Z" fill="currentColor" />
                  </svg>
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">QRLocker</span>
              </Link>
            </div>
            <div className="hidden md:flex items-center justify-end md:flex-1 lg:w-0">
              <Link
                to="/login"
                className="whitespace-nowrap text-base font-medium text-gray-500 hover:text-gray-900"
              >
                Staff Login
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero section */}
      <div className="relative">
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gray-100" />
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="relative shadow-xl sm:rounded-2xl sm:overflow-hidden">
            <div className="absolute inset-0">
              <img
                className="h-full w-full object-cover"
                src="data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f0f9ff' fill-opacity='0.4'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"
                alt=""
              />
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-cyan-600 mix-blend-multiply" />
            </div>
            <div className="relative px-4 py-16 sm:px-6 sm:py-24 lg:py-32 lg:px-8">
              <h1 className="text-center text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                <span className="block text-white">Request Document</span>
                <span className="block text-indigo-200">Access</span>
              </h1>
              <p className="mt-6 max-w-lg mx-auto text-center text-xl text-indigo-200 sm:max-w-3xl">
                Need access to organizational documents? Submit a request and get secure access to the information you need.
              </p>
              <div className="mt-10 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center">
                <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex">
                  <Link
                    to="/request"
                    className="flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50 md:py-4 md:text-lg md:px-10 transition-colors duration-200"
                  >
                    Submit Request
                    <ArrowRightIcon className="ml-2 h-5 w-5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">How it works</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Simple document access requests
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Our streamlined process makes it easy to request and receive access to organizational documents.
            </p>
          </div>

          <div className="mt-16">
            <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              {features.map((feature) => (
                <div key={feature.name} className="relative">
                  <dt>
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                      <feature.icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">{feature.name}</p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-gray-500">{feature.description}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* CTA section */}
      <div className="bg-indigo-700">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">Ready to get started?</span>
            <span className="block">Submit your document request today.</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-indigo-200">
            The process is quick and easy. You'll receive updates via email as your request is processed.
          </p>
          <Link
            to="/request"
            className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 sm:w-auto transition-colors duration-200"
          >
            <InboxIcon className="mr-2 h-5 w-5" />
            Submit Request
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex justify-center space-x-6 md:order-2">
            <Link to="/login" className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">Staff Login</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
          <div className="mt-8 md:mt-0 md:order-1">
            <p className="text-center text-base text-gray-400">&copy; 2025 QRLocker. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLanding;
