import React from 'react';
import { X } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in-fast"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-lg m-8 p-6 transform animate-slide-up-fast"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-dark-900 dark:text-white">User Guide</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-dark-200 dark:hover:bg-dark-700 transition-colors"
          >
            <X size={20} className="text-dark-500 dark:text-dark-300" />
          </button>
        </div>
        <div className="text-dark-600 dark:text-dark-300 space-y-4">
          <p>
            Welcome to thinkback! This is your personal knowledge vault. Here's a quick guide to get you started:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Adding Content:</strong> Click the '+' button to save new links, notes, or ideas.</li>
            <li><strong>Searching:</strong> Use the search bar at the top to instantly find any content you've saved.</li>
            <li><strong>Categories:</strong> Organize your content into categories on the left. You can create, rename, and delete them as you see fit.</li>
            <li><strong>For You:</strong> This special section provides smart suggestions based on your activity and saved items.</li>
          </ul>
          <p>
            We're constantly working on new features to help you remember what matters.
          </p>
          <div className="mt-4 p-8 bg-gray-100 dark:bg-dark-700/50 rounded-lg text-center border border-dashed border-gray-300 dark:border-dark-600">
            <p className="text-sm text-gray-500 dark:text-dark-400">
              Future home of an awesome GIF showing how to use the product!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
