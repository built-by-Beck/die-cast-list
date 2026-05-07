import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { UserDoc } from '../types';
// Require Firebase to be configured — no hardcoded accounts.
// Set up a .env file with VITE_FIREBASE_* vars to run the app.
const FIREBASE_CONFIGURED = Boolean(import.meta.env.VITE_FIREBASE_API_KEY);

interface AuthContextType {
  user: User | null;
  userDoc: UserDoc | null;
  loading: boolean;
  logout: () => Promise<void>;
  isMockMode: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userDoc: null,
  loading: true,
  logout: async () => {},
  isMockMode: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!FIREBASE_CONFIGURED) {
      // No Firebase configured — treat as logged out.
      setLoading(false);
      return;
    }

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setUserDoc(null);
        setLoading(false);
      }
    });

    return unsubAuth;
  }, []);

  useEffect(() => {
    if (!FIREBASE_CONFIGURED || !user) return;

    const userRef = doc(db, 'users', user.uid);
    const unsubDoc = onSnapshot(
      userRef,
      (snap) => {
        if (snap.exists()) {
          setUserDoc({ uid: snap.id, ...snap.data() } as UserDoc);
        }
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return unsubDoc;
  }, [user]);

  const logout = async () => {
    if (!FIREBASE_CONFIGURED) return;
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userDoc,
        loading,
        logout,
        isMockMode: !FIREBASE_CONFIGURED,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
