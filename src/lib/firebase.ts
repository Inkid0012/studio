
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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

export { app, auth, db };
