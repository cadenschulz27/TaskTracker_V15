import { db } from './init.js';
import { collection, query, onSnapshot, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

/**
 * Adds a new log entry document to a task's 'activity' sub-collection.
 * @param {string} taskId - The ID of the parent task to log against.
 * @param {string} logText - The description of the activity (e.g., "Task created").
 * @returns {Promise<DocumentReference>}
 */
export function addActivityLog(taskId, logText) {
    const activityCollectionRef = collection(db, `tasks/${taskId}/activity`);
    return addDoc(activityCollectionRef, {
        text: logText,
        timestamp: serverTimestamp()
    });
}

/**
 * Listens for real-time updates to a task's 'activity' sub-collection.
 * @param {string} taskId - The ID of the parent task.
 * @param {Function} callback - The function to call with the new array of sorted logs.
 * @returns {Function} An unsubscribe function to stop the listener.
 */
export function listenForActivity(taskId, callback) {
    const activityPath = `tasks/${taskId}/activity`;
    const q = query(collection(db, activityPath));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort by timestamp to ensure chronological order
        logs.sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
        callback(taskId, logs);
    });
    
    return unsubscribe;
}