import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Edit3, Trash2, RotateCcw, MessageSquare, Calendar, Tag, Youtube, MessageCircle, Instagram, Twitter } from 'lucide-react';
import Logo from '../components/Logo';
import Button from '../components/Button';
import Card from '../components/Card';
import Textarea from '../components/Textarea';

// Mock data - in real app this would come from API
const mockEntry = {
  id: '1',
  title: 'How to Build Better Habits',
  platform: 'youtube' as const,
  url: 'https://youtube.com/watch?v=example',
  thumbnail: 'https://images.pexels.com/photos/1552617/pexels-photo-1552617.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
  category: 'Productivity',
  savedDate: '2024-01-15',
  notes: 'Great insights on habit formation and the psychology behind building lasting habits. The speaker discusses the importance of starting small and being consistent.',
  description: 'In this comprehensive video, we explore the science behind habit formation and practical strategies for building habits that stick. Learn about the habit loop, environmental design, and how to overcome common obstacles.',
  duration: '18:42',
  author: 'Productivity Pro',
  tags: ['habits', 'productivity', 'psychology', 'self-improvement']
};

const platformIcons = {
  youtube: Youtube,
  reddit: MessageCircle,
  instagram: Instagram,
  twitter: Twitter
};

const ViewPage: React.FC = () => {
  const { id } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(mockEntry.notes);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const PlatformIcon = platformIcons[mockEntry.platform];

  const handleSaveNotes = () => {
    // In real app, this would be an API call
    setIsEditing(false);
  };

  const handleDelete = () => {
    // In real app, this would be an API call
    console.log('Delete entry');
  };

  const handleReflect = () => {
    // In real app, this would open reflection dialog or navigate to reflection page
    console.log('Open reflection');
  };

  const handleResurface = () => {
    // In real app, this would set reminder or add to resurface queue
    console.log('Add to resurface queue');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/5 rounded-full blur-3xl animate-pulse-subtle"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse-subtle" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/3 rounded-full blur-3xl animate-pulse-subtle" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header */}
      <div className="relative z-10 bg-dark-900/30 backdrop-blur-xl border-b border-dark-800/50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="p-2 hover:bg-dark-800/50 rounded-lg transition-all duration-200 transform hover:scale-110"
              >
                <ArrowLeft size={20} className="text-dark-400" />
              </Link>
              <Logo size="sm" />
            </div>
            <div className="flex items-center space-x-3">
              <a
                href={mockEntry.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-sm text-dark-400 hover:text-dark-200 transition-all duration-200 transform hover:scale-105"
              >
                <ExternalLink size={16} />
                <span>Open Original</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Media Preview */}
            <Card className="overflow-hidden animate-slide-up transform hover:scale-[1.01] transition-all duration-300">
              <div className="aspect-video bg-dark-800 relative overflow-hidden">
                <img
                  src={mockEntry.thumbnail}
                  alt={mockEntry.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <div className="bg-dark-900/80 backdrop-blur-sm rounded-lg p-2 border border-dark-700/30 transform hover:scale-110 transition-transform duration-300">
                    <PlatformIcon size={20} className="text-dark-300" />
                  </div>
                </div>
                {mockEntry.duration && (
                  <div className="absolute bottom-4 right-4">
                    <div className="bg-black/80 text-white text-sm px-2 py-1 rounded">
                      {mockEntry.duration}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Title & Description */}
            <Card className="p-6 animate-slide-up transform hover:scale-[1.01] transition-all duration-300" style={{ animationDelay: '0.1s' }}>
              <h1 className="text-2xl font-bold text-white mb-4">
                {mockEntry.title}
              </h1>

              <div className="flex items-center space-x-4 mb-4 text-sm text-dark-400">
                <span>{mockEntry.author}</span>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <Calendar size={14} />
                  <span>Saved {mockEntry.savedDate}</span>
                </div>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <Tag size={14} />
                  <span>{mockEntry.category}</span>
                </div>
              </div>

              <p className="text-dark-300 leading-relaxed mb-6">
                {mockEntry.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {mockEntry.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-dark-800/30 text-dark-300 border border-dark-700/30 hover:bg-dark-800/50 hover:border-dark-600/50 transition-all duration-200 transform hover:scale-105"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </Card>

            {/* Personal Notes */}
            <Card className="p-6 animate-slide-up transform hover:scale-[1.01] transition-all duration-300" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Personal Notes</h2>
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2 transform hover:scale-105 transition-all duration-200"
                >
                  <Edit3 size={16} />
                  <span>{isEditing ? 'Cancel' : 'Edit'}</span>
                </Button>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={6}
                    placeholder="Add your thoughts, insights, or reflections..."
                  />
                  <div className="flex justify-end">
                    <Button onClick={handleSaveNotes} className="transform hover:scale-105 transition-all duration-200">
                      Save Notes
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-dark-300 leading-relaxed whitespace-pre-wrap">
                  {notes || (
                    <span className="text-dark-500 italic">
                      No notes yet. Click edit to add your thoughts.
                    </span>
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <Card className="p-6 animate-slide-up transform hover:scale-[1.01] transition-all duration-300" style={{ animationDelay: '0.3s' }}>
              <h3 className="font-semibold text-white mb-4">Actions</h3>
              <div className="space-y-3">
                <Button
                  onClick={handleReflect}
                  variant="outline"
                  className="w-full flex items-center space-x-2 transform hover:scale-105 transition-all duration-200"
                >
                  <MessageSquare size={16} />
                  <span>Reflect</span>
                </Button>

                <Button
                  onClick={handleResurface}
                  variant="outline"
                  className="w-full flex items-center space-x-2 transform hover:scale-105 transition-all duration-200"
                >
                  <RotateCcw size={16} />
                  <span>Resurface</span>
                </Button>

                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  variant="outline"
                  className="w-full flex items-center space-x-2 text-red-400 border-red-800/50 hover:bg-red-900/20 hover:border-red-700/50 transform hover:scale-105 transition-all duration-200"
                >
                  <Trash2 size={16} />
                  <span>Delete</span>
                </Button>
              </div>
            </Card>

            {/* Metadata */}
            <Card className="p-6 animate-slide-up transform hover:scale-[1.01] transition-all duration-300" style={{ animationDelay: '0.4s' }}>
              <h3 className="font-semibold text-white mb-4">Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-dark-400">Platform</span>
                  <div className="flex items-center space-x-2">
                    <PlatformIcon size={16} className="text-dark-300" />
                    <span className="capitalize text-dark-200">{mockEntry.platform}</span>
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-dark-400">Category</span>
                  <span className="text-dark-200">{mockEntry.category}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-dark-400">Saved</span>
                  <span className="text-dark-200">{mockEntry.savedDate}</span>
                </div>

                {mockEntry.duration && (
                  <div className="flex justify-between">
                    <span className="text-dark-400">Duration</span>
                    <span className="text-dark-200">{mockEntry.duration}</span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6 animate-slide-up transform scale-105">
            <h3 className="text-lg font-semibold text-white mb-2">Delete Entry</h3>
            <p className="text-dark-400 mb-6">
              Are you sure you want to delete this entry? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                variant="outline"
                className="flex-1 transform hover:scale-105 transition-all duration-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 border-red-500/20 transform hover:scale-105 transition-all duration-200"
              >
                Delete
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ViewPage;
