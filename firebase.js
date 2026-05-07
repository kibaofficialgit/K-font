import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, setDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAVM9g4OTyXZYB6vrJZCsDad-4yllHck3I",
  authDomain: "kfont-194c6.firebaseapp.com",
  projectId: "kfont-194c6",
  storageBucket: "kfont-194c6.firebasestorage.app",
  messagingSenderId: "434182253027",
  appId: "1:434182253027:web:0befaca151328811d298d6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// make global
window.db = db;
window.setDoc = setDoc;
window.doc = doc;
window.getDoc = getDoc;
