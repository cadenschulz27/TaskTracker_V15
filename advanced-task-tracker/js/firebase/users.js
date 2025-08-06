import { db } from './init.js';
import { doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

/**
 * Fetches a single user's document from the 'users' collection in Firestore.
 * @param {string} userId - The unique ID of the user to fetch.
 * @returns {Promise<DocumentSnapshot>} A promise that resolves with the user's document data.
 */
export function getUserData(userId) {
    const userRef = doc(db, 'users', userId);
    return getDoc(userRef);
}

/**
 * Fetches all documents from the 'users' collection in Firestore.
 * @returns {Promise<QuerySnapshot>} A promise that resolves with all user documents.
 */
export function getAllUsers() {
    const usersCollectionRef = collection(db, 'users');
    return getDocs(usersCollectionRef);
}