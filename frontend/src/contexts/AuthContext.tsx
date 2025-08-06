import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  Auth,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  GithubAuthProvider,
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  deleteUser,
} from 'firebase/auth';
import { auth } from '../firebase'; // Corrected import path

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signup: (email: string, pass: string) => Promise<any>;
  login: (email: string, pass: string) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  signInWithGitHub: () => Promise<any>;
  logout: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
  sendVerificationEmail: () => Promise<void>;
  deleteAccount: (password?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const signup = async (email: string, pass: string) => {
    // We will no longer send the email from here.
    // The VerifyEmailPage component will now handle this responsibility.
    return createUserWithEmailAndPassword(auth, email, pass);
  };

  const login = (email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    // Use redirect instead of popup for better compatibility with custom domains
    await signInWithRedirect(auth, provider);
  };

  const signInWithGitHub = async () => {
    const provider = new GithubAuthProvider();
    // Use redirect instead of popup for better compatibility with custom domains
    await signInWithRedirect(auth, provider);
  };

  const deleteAccount = async (password?: string) => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("No user is currently signed in.");
    }

    const providerId = user.providerData[0]?.providerId;

    try {
      if (providerId === 'password') {
        if (!password) {
          throw new Error("Password is required to delete your account.");
        }
        const credential = EmailAuthProvider.credential(user.email!, password);
        await reauthenticateWithCredential(user, credential);
      } else if (providerId === 'google.com') {
        const googleProvider = new GoogleAuthProvider();
        await reauthenticateWithPopup(user, googleProvider);
      } else if (providerId === 'github.com') {
        const githubProvider = new GithubAuthProvider();
        await reauthenticateWithPopup(user, githubProvider);
      } else {
        throw new Error(`Account deletion is not supported for your sign-in method.`);
      }

      await deleteUser(user);
    } catch (error) {
      console.error("Error during account deletion:", error);
      throw error;
    }
  };

  const logout = () => {
    return signOut(auth);
  };

  const sendVerificationEmail = async () => {
    if (currentUser) {
      await sendEmailVerification(currentUser);
    } else {
      throw new Error("No user is currently signed in.");
    }
  };

  const getIdToken = async () => {
    if (currentUser) {
      return await currentUser.getIdToken();
    }
    return null;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Handle redirect result on component mount
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        console.log('🔍 Checking for redirect result...');
        const result = await getRedirectResult(auth);
        if (result) {
          console.log('✅ Redirect result received:', result.user.email);
          console.log('User signed in successfully:', result.user);
          // The user is now signed in, onAuthStateChanged will handle the state update
        } else {
          console.log('ℹ️ No redirect result found - user may not have completed OAuth flow');
        }
      } catch (error) {
        console.error('❌ Error handling redirect result:', error);
        // Don't throw here, just log the error
      }
    };

    // Try immediately, then retry after a short delay to handle timing issues
    handleRedirectResult();
    const timer = setTimeout(handleRedirectResult, 500);
    return () => clearTimeout(timer);
  }, []);

  const value = {
    currentUser,
    loading,
    signup,
    login,
    signInWithGoogle,
    signInWithGitHub,
    logout,
    getIdToken,
    sendVerificationEmail,
    deleteAccount,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
