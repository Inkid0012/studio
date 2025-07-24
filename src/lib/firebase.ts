
import { initializeApp, getApp, getApps, FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyDoa3EvVgm3krZ0Psj09H9IDIl0xYzZiCY",
  authDomain: "fizu-tw3mo.firebaseapp.com",
  projectId: "fizu-tw3mo",
  storageBucket: "fizu-tw3mo.firebasestorage.app",
  messagingSenderId: "212957482995",
  appId: "1:212957482995:web:73ca8961ec767f4f024c86"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Enable offline persistence only in the browser
if (typeof window !== 'undefined') {
    enableIndexedDbPersistence(db)
      .catch((err) => {
        if (err.code == 'failed-precondition') {
          // This can happen if multiple tabs are open and persistence is enabled in one already.
          console.warn('Firestore persistence failed: Failed to obtain exclusive lock on database. This is expected if you have multiple tabs open.');
        } else if (err.code == 'unimplemented') {
          // The current browser does not support all of the features required to enable persistence
          console.warn('Firestore persistence not available in this browser.');
        }
      });
}


export { app, auth, db };
