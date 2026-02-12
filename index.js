import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// UPDATED TO .JS
import { initSocialFeed } from "./social-feed.js";

const firebaseConfig = {
    apiKey: "AIzaSyAC_Grs2F0UEKfiUn1ckVYxE49Gj2UMAus",
    authDomain: "v1999-bfd2e.firebaseapp.com",
    projectId: "v1999-bfd2e",
    storageBucket: "v1999-bfd2e.firebasestorage.app",
    messagingSenderId: "243022609522",
    appId: "1:243022609522:web:0c4667ef677fa961ff96eb",
    measurementId: "G-GW63MXM2JT"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ... (KEEP THE REST OF YOUR LOGIC THE SAME) ...
// Ensure all your (window as any) functions are here
