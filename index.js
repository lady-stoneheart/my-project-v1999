import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, addDoc, updateDoc, deleteDoc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
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
setPersistence(auth, browserLocalPersistence);

const ADMIN_EMAIL = 'iijaggernut@gmail.com';
let isSimulatingUser = false;
let unsubscribeRoadmap = null;
let currentFilter = 'all';
let lastSnapshotDocs = [];

window.switchView = (viewName) => {
    const loader = document.getElementById('global-loader');
    const authView = document.getElementById('view-auth');
    const dashboard = document.getElementById('view-dashboard');
    const feed = document.getElementById('view-feed');
    const sidebar = document.getElementById('sidebar');

    if (loader) loader.classList.add('hidden');
    if (viewName === 'auth') {
        authView?.classList.remove('hidden');
        dashboard?.classList.add('hidden');
        sidebar?.classList.add('hidden');
    } else {
        authView?.classList.add('hidden');
        sidebar?.classList.remove('hidden');
        if (viewName === 'roadmap') {
            dashboard?.classList.remove('hidden');
            feed?.classList.add('hidden');
        } else {
            dashboard?.classList.add('hidden');
            feed?.classList.remove('hidden');
        }
    }
};

onAuthStateChanged(auth, (user) => {
    if (user) {
        window.switchView('roadmap');
        setupRoadmapListener();
        if (typeof initSocialFeed === 'function') initSocialFeed(auth, db, user.email === ADMIN_EMAIL);
    } else {
        window.switchView('auth');
    }
});

function setupRoadmapListener() {
    if (unsubscribeRoadmap) unsubscribeRoadmap();
    const q = query(collection(db, 'updates'), orderBy('timestamp', 'desc'));
    unsubscribeRoadmap = onSnapshot(q, (snap) => {
        lastSnapshotDocs = snap.docs;
        const container = document.getElementById('roadmap-container');
        if (container) {
            container.innerHTML = lastSnapshotDocs.map(d => `
                <div class="p-6 border-2 border-black rounded-3xl mb-4 bg-white shadow-sm">
                    <h3 class="font-black uppercase">${d.data().title}</h3>
                    <p class="text-sm text-neutral-600">${d.data().shortDescription || ''}</p>
                </div>
            `).join('');
        }
    });
}

const authForm = document.getElementById('auth-form');
if (authForm) {
    authForm.onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            try {
                await createUserWithEmailAndPassword(auth, email, password);
            } catch (err2) {
                alert(err2.message);
            }
        }
    };
}
