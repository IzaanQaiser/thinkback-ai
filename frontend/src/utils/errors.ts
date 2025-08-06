const firebaseErrorMap: { [key: string]: string } = {
  'Firebase: Error (auth/invalid-credential).': 'Invalid email or password. Please try again.',
  'Firebase: Error (auth/email-already-in-use).': 'This email is already registered. Please log in or use a different email.',
  'Firebase: Error (auth/weak-password).': 'Your password is too weak. Please use at least 6 characters.',
  'Firebase: Error (auth/user-not-found).': 'No account found with this email. Please sign up.',
  'Firebase: Error (auth/wrong-password).': 'Incorrect password. Please try again.',
  'Firebase: Error (auth/popup-closed-by-user).': 'Sign-in was cancelled. Please try again.',
  'Firebase: Error (auth/popup-blocked).': 'Sign-in popup was blocked. Please allow popups for this site.',
  'Firebase: Error (auth/redirect-cancelled-by-user).': 'Sign-in was cancelled. Please try again.',
  'Firebase: Error (auth/redirect-operation-pending).': 'Sign-in is already in progress. Please wait.',
  'Firebase: Error (auth/network-request-failed).': 'Network error. Please check your connection and try again.',
  'Firebase: Error (auth/too-many-requests).': 'Too many sign-in attempts. Please try again later.',
  'Firebase: Error (auth/operation-not-allowed).': 'Google sign-in is not enabled. Please contact support.',
};

export const mapFirebaseAuthError = (errorMessage: string): string => {
  return firebaseErrorMap[errorMessage] || 'An unexpected error occurred. Please try again.';
};
