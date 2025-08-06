import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

// Your web app's Firebase configuration, kept in one place.
const firebaseConfig = {
  apiKey: "AIzaSyCvHDlMyxZpgtmhfHram1_OzhBV3Ha0lPo",
  authDomain: "curitt-e2f3d.firebaseapp.com",
  projectId: "curitt-e2f3d",
  storageBucket: "curitt-e2f3d.firebasestorage.app",
  messagingSenderId: "261977761812",
  appId: "1:261977761812:web:9a8d6e0bccea14b5305f01"
};

// Initialize the Firebase app.
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service.
export const db = getFirestore(app);
// Initialize Firebase Authentication and get a reference to the service.
export const auth = getAuth(app);
// Initialize Cloud Storage and get a reference to the service.
export const storage = getStorage(app);