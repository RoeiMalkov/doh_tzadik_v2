// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyC0MI6aXkuDXtoE3nh50b3gitNkVuD3FII",
    authDomain: "dohtzadik198.firebaseapp.com",
    projectId: "dohtzadik198",
    storageBucket: "dohtzadik198.firebasestorage.app",
    messagingSenderId: "677113326537",
    appId: "1:677113326537:web:3872265f1bae4c8fddd618",
    measurementId: "G-0XBM3LNCKN"
  };

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);  // Firestore database
export const auth = getAuth(app);     // Authentication