import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, addDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAVM9g4OTyXZYB6vrJZCsDad-4yllHck3I",
  authDomain: "kfont-194c6.firebaseapp.com",
  projectId: "kfont-194c6",
  storageBucket: "kfont-194c6.appspot.com",
  messagingSenderId: "434182253027",
  appId: "1:434182253027:web:0befaca151328811d298d6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.db = db;
window.addDoc = addDoc;
window.collection = collection;
window.getDocs = getDocs;
