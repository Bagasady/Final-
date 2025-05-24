import React from 'react';
import { Link } from 'react-router-dom';
import { PackageOpen } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <PackageOpen className="h-16 w-16 text-blue-600 dark:text-blue-500 mb-4" />
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">404</h1>
      <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">Page not found</p>
      <p className="text-base text-gray-500 dark:text-gray-400 mb-8 text-center max-w-md">
        The page you are looking for might have been removed or is temporarily unavailable.
      </p>
      <Link
        to="/"
        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg 
          transition-colors duration-200 flex items-center justify-center focus:outline-none focus:ring-2 
          focus:ring-offset-2 focus:ring-blue-500"
      >
        Return to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;