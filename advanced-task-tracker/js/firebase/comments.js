import { db } from './init.js';
import {
    collection,
    query,
    onSnapshot,
    addDoc,
    doc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { addNotification } from './notifications.js';

/**
 * Listens for real-time updates to a task's 'comments' sub-collection.
 * @param {string} taskId - The ID of the parent task.
 * @param {Function} callback - The function to call with the new array of sorted comments.
 * @returns {Function} An unsubscribe function to stop the listener.
 */
export function listenForComments(taskId, callback) {
    const commentsPath = `tasks/${taskId}/comments`;
    const commentsQuery = query(collection(db, commentsPath));

    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
        const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // --- CORRECTED SORT ORDER: Changed from a - b to b - a to put newest first ---
        comments.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        
        callback(taskId, comments);
    });

    return unsubscribe;
}

/**
 * Adds a new comment document and notifies relevant users.
 * @param {string} taskId - The ID of the parent task.
 * @param {object} commentData - The data for the new comment (must include authorId and authorName).
 * @returns {Promise<void>}
 */
export async function addComment(taskId, commentData) {
    // Step 1: Add the new comment to the database.
    const commentsPath = `tasks/${taskId}/comments`;
    const commentsCollectionRef = collection(db, commentsPath);
    await addDoc(commentsCollectionRef, {
        ...commentData,
        createdAt: serverTimestamp()
    });

    // Step 2: Fetch the parent task to identify who to notify.
    const taskDocRef = doc(db, 'tasks', taskId);
    const taskSnapshot = await getDoc(taskDocRef);

    if (!taskSnapshot.exists()) {
        console.error("Could not find parent task to send comment notification.");
        return;
    }
    const taskData = taskSnapshot.data();

    // Step 3: Determine who needs to be notified.
    const commenterId = commentData.authorId;
    const recipients = new Set(); // Use a Set to avoid sending duplicate notifications.

    // Notify the task creator if they aren't the one who commented.
    if (taskData.creatorId && taskData.creatorId !== commenterId) {
        recipients.add(taskData.creatorId);
    }
    // Notify the task assignee if they aren't the one who commented.
    if (taskData.assignedToId && taskData.assignedToId !== commenterId) {
        recipients.add(taskData.assignedToId);
    }
    
    // Step 4: Send the notifications.
    const notificationText = `"${commentData.authorName}" commented on: "${taskData.name}"`;
    for (const userId of recipients) {
        addNotification(userId, {
            text: notificationText,
            type: 'new_comment',
            taskId: taskId,
            taskName: taskData.name
        });
    }
}