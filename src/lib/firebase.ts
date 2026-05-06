import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

// Firebase is only initialized when env vars are present.
// When running without a .env file, the app uses mock data instead.
// All Firebase usages are guarded by FIREBASE_CONFIGURED in AuthContext.
const CONFIGURED = Boolean(import.meta.env.VITE_FIREBASE_API_KEY);

// eslint-disable-next-line prefer-const
export let auth: Auth = undefined as unknown as Auth;
export let db: Firestore = undefined as unknown as Firestore;
export let storage: FirebaseStorage = undefined as unknown as FirebaseStorage;

if (CONFIGURED) {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  const app: FirebaseApp = getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApps()[0];

  auth    = getAuth(app);
  db      = getFirestore(app);
  storage = getStorage(app);
}
