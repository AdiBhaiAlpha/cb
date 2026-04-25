/** Author: Chitron Bhattacharjee **/
import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  User, 
  setPersistence, 
  browserLocalPersistence,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, setDoc } from 'firebase/firestore';
import { UserProfile, SiteSettings } from '../types';

interface FirebaseContextType {
  app: FirebaseApp | null;
  auth: ReturnType<typeof getAuth> | null;
  db: ReturnType<typeof getFirestore> | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  settings: SiteSettings | null;
  refreshSettings: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType>({
  app: null,
  auth: null,
  db: null,
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  settings: null,
  refreshSettings: async () => {},
  signInWithGoogle: async () => {},
});

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [app, setApp] = useState<FirebaseApp | null>(null);
  const [auth, setAuth] = useState<ReturnType<typeof getAuth> | null>(null);
  const [db, setDb] = useState<ReturnType<typeof getFirestore> | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const response = await fetch('${import.meta.env.BASE_URL}/firebase-applet-config.json');
        if (!response.ok) throw new Error('Config missing');
        const config = await response.json();
        
        const initializedApp = getApps().length === 0 ? initializeApp(config) : getApps()[0];
        const initializedAuth = getAuth(initializedApp);
        const initializedDb = getFirestore(initializedApp, config.firestoreDatabaseId);

        await setPersistence(initializedAuth, browserLocalPersistence);

        setApp(initializedApp);
        setAuth(initializedAuth);
        setDb(initializedDb);
      } catch (err) {
        console.error('Firebase failed to initialize:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const signInWithGoogle = async () => {
    if (!auth || !db) return;
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if profile exists, if not create it
      const profileSnap = await getDocFromServer(doc(db, 'users', user.uid));
      if (!profileSnap.exists()) {
        const [firstName = '', lastName = ''] = (user.displayName || '').split(' ');
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          firstName,
          lastName,
          username: user.email?.split('@')[0] || `user_${user.uid.slice(0,5)}`,
          phone: '',
          photoURL: user.photoURL,
          createdAt: Date.now()
        });
      }
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      throw error;
    }
  };

  const refreshSettings = async () => {
    if (!db) return;
    try {
      const snap = await getDocFromServer(doc(db, 'site_settings', 'main'));
      if (snap.exists()) {
        setSettings(snap.data() as SiteSettings);
      }
    } catch (e) {
      console.error('Error fetching settings:', e);
    }
  };

  useEffect(() => {
    if (!auth || !db) return;

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const profileSnap = await getDocFromServer(doc(db, 'users', u.uid));
        if (profileSnap.exists()) {
          setProfile(profileSnap.data() as UserProfile);
        }
        
        const adminSnap = await getDocFromServer(doc(db, 'admins', u.uid));
        setIsAdmin(adminSnap.exists());
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
      refreshSettings();
    });

    return () => unsubscribe();
  }, [auth, db]);

  return (
    <FirebaseContext.Provider value={{ 
      app, auth, db, user, profile, loading, isAdmin, settings, refreshSettings, signInWithGoogle 
    }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = () => useContext(FirebaseContext);
