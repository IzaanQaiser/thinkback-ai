const firebaseErrorMap: { [key: string]: string } = {
  'Firebase: Error (auth/invalid-credential).': 'Invalid email or password. Please try again.',
  'Firebase: Error (auth/email-already-in-use).': 'This email is already registered. Please log in or use a different email.',
  'Firebase: Error (auth/weak-password).': 'Your password is too weak. Please use at least 6 characters.',
  'Firebase: Error (auth/user-not-found).': 'No account found with this email. Please sign up.',
  'Firebase: Error (auth/wrong-password).': 'Incorrect password. Please try again.',
};

export const mapFirebaseAuthError = (errorMessage: string): string => {
  return firebaseErrorMap[errorMessage] || 'An unexpected error occurred. Please try again.';
};
