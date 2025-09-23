// Import React hooks and components
import React, { createContext, useContext, useEffect, useState } from 'react';
// Import Firebase authentication functions and types
import {
  User,
  createUserWithEmailAndPassword, // Create new user account with email/password
  onAuthStateChanged, // Listen for user login/logout changes
  sendEmailVerification, // Send email verification to user
  signInWithEmailAndPassword, // Sign in with email/password
  signOut, // Sign out current user
  GoogleAuthProvider, // Google sign-in provider
  signInWithPopup, // Sign in using popup window
  GithubAuthProvider, // GitHub sign-in provider
  EmailAuthProvider, // Email/password provider for reauthentication
  reauthenticateWithCredential, // Reauthenticate with email/password
  reauthenticateWithPopup, // Reauthenticate with popup (Google/GitHub)
  deleteUser, // Delete user account
  UserCredential, // Type for authentication results
} from 'firebase/auth';
import { auth } from '../firebase'; // Firebase auth instance

// Define the shape of our authentication context
interface AuthContextType {
  currentUser: User | null; // Currently logged in user (null if not logged in)
  loading: boolean; // Whether we're still checking if user is logged in
  signup: (email: string, pass: string) => Promise<UserCredential>; // Create new account
  login: (email: string, pass: string) => Promise<UserCredential>; // Sign in with email/password
  signInWithGoogle: () => Promise<UserCredential>; // Sign in with Google
  signInWithGitHub: () => Promise<UserCredential>; // Sign in with GitHub
  logout: () => Promise<void>; // Sign out current user
  getIdToken: () => Promise<string | null>; // Get user's ID token for API calls
  sendVerificationEmail: () => Promise<void>; // Send email verification
  deleteAccount: (password?: string) => Promise<void>; // Delete user account
}

// Create the authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  // Make sure this hook is used inside an AuthProvider
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Main authentication provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State to track the currently logged in user
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  // State to track if we're still loading/checking authentication status
  const [loading, setLoading] = useState(true);

  // Function to create a new user account with email and password
  const signup = async (email: string, pass: string) => {
    // We will no longer send the email from here.
    // The VerifyEmailPage component will now handle this responsibility.
    return createUserWithEmailAndPassword(auth, email, pass);
  };

  // Function to sign in with email and password
  const login = (email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass);
  };

  // Function to sign in with Google using popup
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    // Use popup for better reliability and user experience
    provider.setCustomParameters({
      prompt: 'select_account' // Always show account selection
    });
    return await signInWithPopup(auth, provider);
  };

  // Function to sign in with GitHub using popup
  const signInWithGitHub = async () => {
    const provider = new GithubAuthProvider();
    // Use popup for better reliability and user experience
    return await signInWithPopup(auth, provider);
  };

  // Function to delete the current user's account
  const deleteAccount = async (password?: string) => {
    const user = auth.currentUser;
    // Check if user is logged in
    if (!user) {
      throw new Error("No user is currently signed in.");
    }

    // Get the sign-in method used (email/password, Google, or GitHub)
    const providerId = user.providerData[0]?.providerId;

    try {
      // Reauthenticate based on sign-in method before deleting
      if (providerId === 'password') {
        // For email/password accounts, need password to reauthenticate
        if (!password) {
          throw new Error("Password is required to delete your account.");
        }
        const credential = EmailAuthProvider.credential(user.email!, password);
        await reauthenticateWithCredential(user, credential);
      } else if (providerId === 'google.com') {
        // For Google accounts, use popup to reauthenticate
        const googleProvider = new GoogleAuthProvider();
        await reauthenticateWithPopup(user, googleProvider);
      } else if (providerId === 'github.com') {
        // For GitHub accounts, use popup to reauthenticate
        const githubProvider = new GithubAuthProvider();
        await reauthenticateWithPopup(user, githubProvider);
      } else {
        throw new Error(`Account deletion is not supported for your sign-in method.`);
      }

      // Delete the user account after successful reauthentication
      await deleteUser(user);
    } catch (error) {
      console.error("Error during account deletion:", error);
      throw error;
    }
  };

  // Function to sign out the current user
  const logout = () => {
    return signOut(auth);
  };

  // Function to send email verification to the current user
  const sendVerificationEmail = async () => {
    if (currentUser) {
      await sendEmailVerification(currentUser);
    } else {
      throw new Error("No user is currently signed in.");
    }
  };

  // Function to get the current user's ID token (used for API authentication)
  const getIdToken = async () => {
    if (currentUser) {
      return await currentUser.getIdToken();
    }
    return null;
  };

  // Listen for authentication state changes (login/logout)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      // Update current user when authentication state changes
      setCurrentUser(user);
      // Stop loading once we know the auth state
      setLoading(false);
    });

    // Cleanup function to unsubscribe when component unmounts
    return unsubscribe;
  }, []);


  // Create the context value object with all auth functions and state
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
      {/* Only render children when not loading (auth state is determined) */}
      {!loading && children}
    </AuthContext.Provider>
  );
};
