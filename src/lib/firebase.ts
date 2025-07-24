
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
    "projectId": "fizu-tw3mo",
    "appId": "1:212957482995:web:51f9eb5fbb4bcfaa024c86",
    "storageBucket": "fizu-tw3mo.firebasestorage.app",
    "apiKey": "AIzaSyDoa3EvVgm3krZ0Psj09H9IDIl0xYzZiCY",
    "authDomain": "fizu-tw3mo.firebaseapp.com",
    "measurementId": "",
    "messagingSenderId": "212957482995"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Enable offline persistence
if (typeof window !== 'undefined') {
    enableIndexedDbPersistence(db)
      .catch((err) => {
        if (err.code == 'failed-precondition') {
          // Multiple tabs open, persistence can only be enabled
          // in one tab at a time.
          console.warn('Firestore persistence failed: multiple tabs open.');
        } else if (err.code == 'unimplemented') {
          // The current browser does not support all of the
          // features required to enable persistence
          console.warn('Firestore persistence not available in this browser.');
        }
      });
}


export { app, auth, db };
