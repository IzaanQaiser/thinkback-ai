import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';

const FloatingFeedbackButton: React.FC = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/feedback');
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center justify-center w-10 h-10 rounded-full bg-dark-100/50 dark:bg-dark-800/50 hover:bg-dark-200/60 dark:hover:bg-dark-700/70 transition-colors duration-200 text-dark-800 dark:text-white"
      title="Report a bug or suggest a feature"
    >
      <MessageSquare size={16} className="text-gray-600 dark:text-white" />
    </button>
  );
};

export default FloatingFeedbackButton; 