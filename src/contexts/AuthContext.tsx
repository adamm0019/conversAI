import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  UserCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth } from '../lib/firebase/firebaseConfig';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  signInWithEmailPassword: (email: string, password: string) => Promise<UserCredential>;
  signUpWithEmailPassword: (email: string, password: string, displayName?: string) => Promise<UserCredential>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUser(firebaseUser);
        setIsLoading(false);
        setAuthInitialized(true);
      },
      (error) => {
        setError(error);
        setIsLoading(false);
        setAuthInitialized(true);
      }
    );


    return () => unsubscribe();
  }, []);

  const signInWithEmailPassword = async (email: string, password: string) => {
    try {
      setError(null);
      return await firebaseSignInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown authentication error'));
      throw err;
    }
  };

  const signUpWithEmailPassword = async (email: string, password: string, displayName?: string) => {
    try {
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);


      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: displayName
        });
      }

      return userCredential;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown authentication error'));
      throw err;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await firebaseSignOut(auth);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown sign out error'));
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown password reset error'));
      throw err;
    }
  };

  const clearError = () => setError(null);

  const value = {
    user,
    isLoading: isLoading || !authInitialized,
    error,
    signInWithEmailPassword,
    signUpWithEmailPassword,
    signOut,
    resetPassword,
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 