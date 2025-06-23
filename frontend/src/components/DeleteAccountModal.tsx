import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import Input from './Input';
import Button from './Button';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
  error: string | null;
  loading: boolean;
  providerId: string;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ isOpen, onClose, onConfirm, error, loading, providerId }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(password);
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in-fast"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-md m-8 p-6 transform animate-slide-up-fast"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center">
              <AlertTriangle size={24} className="text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-dark-900 dark:text-white">Delete Account</h2>
              <p className="text-sm text-dark-500 dark:text-dark-300">This action is permanent and cannot be undone.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-dark-200 dark:hover:bg-dark-700 transition-colors"
          >
            <X size={20} className="text-dark-500 dark:text-dark-300" />
          </button>
        </div>

        <div className="space-y-4">
          {error && (
            <div className="bg-red-500/10 text-red-500 dark:text-red-400 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {providerId === 'password' ? (
            <>
              <p className="text-sm text-dark-600 dark:text-dark-300">
                To confirm, please enter your password. All of your data, including saved content and settings, will be permanently removed.
              </p>
              <Input
                id="delete-confirm-password"
                type={showPassword ? 'text' : 'password'}
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                endIcon={
                  <span className="text-xs font-semibold uppercase tracking-wider cursor-pointer">
                    {showPassword ? 'Hide' : 'Show'}
                  </span>
                }
                onEndIconClick={() => setShowPassword(!showPassword)}
              />
            </>
          ) : (
            <p className="text-sm text-dark-600 dark:text-dark-300">
              To confirm you want to delete your account, we need to re-authenticate you with your provider. Clicking "Delete Account" will open a secure pop-up window.
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            disabled={(providerId === 'password' && !password) || loading}
          >
            {loading ? 'Deleting...' : 'Delete Account'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountModal;
