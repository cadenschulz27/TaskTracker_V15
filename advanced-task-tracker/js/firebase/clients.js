import { db } from './init.js';
import {
    collection,
    query,
    onSnapshot,
    addDoc,
    doc,
    updateDoc,
    deleteDoc,
    orderBy,
    writeBatch,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

/**
 * Listens for real-time updates to the 'clients' collection.
 * @param {Function} callback - The function to call with the new array of clients.
 * @returns {Function} An unsubscribe function to stop the listener.
 */
export function listenForClients(callback) {
    console.log("[Clients] Setting up listener..."); // Diagnostic log
    const clientsCollectionRef = collection(db, 'clients');
    const clientsQuery = query(clientsCollectionRef, orderBy("name", "asc"));

    const unsubscribe = onSnapshot(clientsQuery, (snapshot) => {
        // --- DIAGNOSTIC LOGGING ADDED ---
        console.log(`[Clients] Listener fired! Found ${snapshot.size} client documents.`);
        
        const clients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(clients);
    }, (error) => {
        console.error("Error listening for client updates:", error);
    });
    return unsubscribe;
}

/**
 * Creates a new client document in Firestore.
 * @param {object} clientData - The data for the new client (e.g., name, email, phone).
 * @returns {Promise<DocumentReference>}
 */
export function addClient(clientData) {
    const clientsCollectionRef = collection(db, 'clients');
    return addDoc(clientsCollectionRef, {
        ...clientData,
        createdAt: serverTimestamp()
    });
}

/**
 * Adds an array of new clients to Firestore using a batch write.
 * @param {Array<object>} clients - An array of client data objects to add.
 * @returns {Promise<void>}
 */
export async function addMultipleClients(clients) {
    if (!clients || clients.length === 0) {
        return;
    }

    const clientsCollectionRef = collection(db, 'clients');
    const batch = writeBatch(db);

    clients.forEach(client => {
        const newClientRef = doc(clientsCollectionRef);
        batch.set(newClientRef, {
            ...client,
            createdAt: serverTimestamp()
        });
    });

    await batch.commit();
}

/**
 * Updates an existing client document in Firestore.
 * @param {string} clientId - The ID of the client to update.
 * @param {object} clientData - An object containing the fields to update.
 * @returns {Promise<void>}
 */
export function updateClient(clientId, clientData) {
    const clientDocRef = doc(db, 'clients', clientId);
    return updateDoc(clientDocRef, clientData);
}

/**
 * Deletes a client document from Firestore.
 * @param {string} clientId - The ID of the client to delete.
 * @returns {Promise<void>}
 */
export function deleteClient(clientId) {
    const clientDocRef = doc(db, 'clients', clientId);
    return deleteDoc(clientDocRef);
}