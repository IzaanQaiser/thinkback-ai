import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

const Footer: React.FC = () => {
  return (
    <footer className="bg-dark-900 border-t border-dark-800">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <Logo size="sm" />
            <span className="ml-2 text-sm text-gray-400">
              © {new Date().getFullYear()} Thinkback. All rights reserved.
            </span>
          </div>
          
          <div className="flex space-x-6 text-sm">
            <Link 
              to="/privacy" 
              className="text-gray-400 hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <Link 
              to="/terms" 
              className="text-gray-400 hover:text-white transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 