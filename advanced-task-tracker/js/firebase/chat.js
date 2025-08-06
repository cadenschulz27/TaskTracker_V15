import { db } from './init.js';
import {
    collection,
    query,
    orderBy,
    limit,
    onSnapshot,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

/**
 * Sends a new chat message to the 'chat' collection in Firestore.
 * @param {object} messageData - An object containing the message text and author details.
 * @returns {Promise<DocumentReference>}
 */
export function sendMessage(messageData) {
    const chatCollectionRef = collection(db, 'chat');
    return addDoc(chatCollectionRef, {
        ...messageData,
        timestamp: serverTimestamp()
    });
}

/**
 * Listens for real-time updates to the 'chat' collection.
 * @param {Function} callback - The function to call with the new array of messages.
 * @returns {Function} An unsubscribe function to stop the listener.
 */
export function listenForMessages(callback) {
    const chatCollectionRef = collection(db, 'chat');
    // Order by timestamp and limit to the last 100 messages to keep it performant
    const messagesQuery = query(chatCollectionRef, orderBy("timestamp", "desc"), limit(100));

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // The query gets them in descending order, so we reverse them for correct display order
        callback(messages.reverse());
    }, (error) => {
        console.error("Error listening for chat messages: ", error);
    });

    return unsubscribe;
}