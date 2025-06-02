import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          <div className="mb-6">
            <h1 className="text-6xl font-bold text-gray-900">404</h1>
            <h2 className="mt-2 text-2xl font-semibold text-gray-700">Page Not Found</h2>
            <p className="mt-2 text-gray-600">
              The page you are looking for doesn't exist or has been moved.
            </p>
          </div>
          
          <div className="mt-6">
            <Link
              to="/"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Go Back Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
