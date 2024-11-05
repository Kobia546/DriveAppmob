import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
    apiKey: "AIzaSyBp6S7q8Zx8FFfiLHHGFZDZMuzA7ctH9cc",
    authDomain: "projet-d11a4.firebaseapp.com",
    projectId: "projet-d11a4",
    storageBucket: "projet-d11a4.appspot.com",
    messagingSenderId: "261115216605",
    appId: "1:261115216605:web:b0bbaaba1d419e64c7d134",
    measurementId: "G-3VWFWYRQQW"
  };

  const app = initializeApp(firebaseConfig);

  // Initialize Firebase Auth with AsyncStorage for persistence
  const auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
  });
  
  // Initialize Firestore and Storage
  const db = getFirestore(app);
  const storage = getStorage(app);
  
  // Export the initialized services
  export { auth, db, storage,app };
