import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, X } from 'lucide-react';

const FloatingFeedbackButton: React.FC = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);

  const handleClick = () => {
    navigate('/feedback');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Feedback Button */}
      <button
        onClick={handleClick}
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        title="Report a bug or suggest a feature"
      >
        <MessageSquare className="w-5 h-5" />
      </button>

      {/* Close Button */}
      <button
        onClick={() => setIsVisible(false)}
        className="absolute -top-2 -right-2 bg-gray-600 hover:bg-gray-700 text-white rounded-full p-1 shadow-lg transition-all duration-200"
        title="Hide feedback button"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};

export default FloatingFeedbackButton; 