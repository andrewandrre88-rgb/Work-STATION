import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  guestMode: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  continueAsGuest: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guestMode, setGuestMode] = useState<boolean>(() => {
    return localStorage.getItem('productivity_guest_mode') === 'true';
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        // Clear guest mode if user is signed in
        setGuestMode(false);
        localStorage.removeItem('productivity_guest_mode');

        // Upsert user profile to Firestore
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const existingSnap = await getDoc(userDocRef);
          const now = new Date().toISOString();

          if (!existingSnap.exists()) {
            await setDoc(userDocRef, {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || 'Google User',
              photoURL: currentUser.photoURL || '',
              createdAt: now,
              lastLoginAt: now,
            });
          } else {
            await setDoc(
              userDocRef,
              {
                email: currentUser.email || '',
                displayName: currentUser.displayName || '',
                photoURL: currentUser.photoURL || '',
                lastLoginAt: now,
              },
              { merge: true }
            );
          }
        } catch (err) {
          console.warn('Could not sync user profile to Firestore:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      console.error('Google sign in error:', err);
      const firebaseError = err as { code?: string; message?: string };
      if (firebaseError.code === 'auth/popup-blocked') {
        setError('Sign-in pop-up was blocked by your browser. Please allow pop-ups for this site or open the app in a new window.');
      } else if (firebaseError.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled before completion.');
      } else if (firebaseError.code === 'auth/cancelled-popup-request') {
        // Ignored
      } else {
        setError(firebaseError.message || 'Failed to sign in with Google. Please try again.');
      }
    }
  };

  const signOutUser = async () => {
    setError(null);
    try {
      await signOut(auth);
      setGuestMode(false);
      localStorage.removeItem('productivity_guest_mode');
    } catch (err: unknown) {
      console.error('Sign out error:', err);
      const firebaseError = err as { message?: string };
      setError(firebaseError.message || 'Failed to sign out');
    }
  };

  const continueAsGuest = () => {
    setGuestMode(true);
    localStorage.setItem('productivity_guest_mode', 'true');
    setError(null);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        guestMode,
        signInWithGoogle,
        signOutUser,
        continueAsGuest,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
