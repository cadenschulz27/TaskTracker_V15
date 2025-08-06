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
 * Listens for real-time updates to a task's 'attachments' sub-collection.
 * @param {string} taskId - The ID of the parent task.
 * @param {Function} callback - The function to call with the new array of sorted attachments.
 * @returns {Function} An unsubscribe function to stop the listener.
 */
export function listenForAttachments(taskId, callback) {
    const attachmentsPath = `tasks/${taskId}/attachments`;
    const attachmentsQuery = query(collection(db, attachmentsPath));

    const unsubscribe = onSnapshot(attachmentsQuery, (snapshot) => {
        const attachments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort attachments by upload time
        attachments.sort((a, b) => (a.uploadedAt?.seconds || 0) - (b.uploadedAt?.seconds || 0));
        callback(taskId, attachments);
    });

    return unsubscribe;
}

/**
 * Adds a new attachment document and notifies relevant users.
 * @param {string} taskId - The ID of the parent task.
 * @param {object} attachmentData - The metadata for the new attachment (must include uploaderId and uploaderName).
 * @returns {Promise<void>}
 */
export async function addAttachment(taskId, attachmentData) {
    // Step 1: Add the attachment record to the database.
    const attachmentsPath = `tasks/${taskId}/attachments`;
    await addDoc(collection(db, attachmentsPath), {
        ...attachmentData,
        uploadedAt: serverTimestamp()
    });

    // Step 2: Fetch the parent task to identify who to notify.
    const taskDocRef = doc(db, 'tasks', taskId);
    const taskSnapshot = await getDoc(taskDocRef);
    if (!taskSnapshot.exists()) return;
    const taskData = taskSnapshot.data();

    // Step 3: Determine who needs to be notified.
    const uploaderId = attachmentData.uploaderId;
    const recipients = new Set();

    // Notify the task creator if they aren't the one who uploaded the file.
    if (taskData.creatorId && taskData.creatorId !== uploaderId) {
        recipients.add(taskData.creatorId);
    }
    // Notify the task assignee if they aren't the one who uploaded the file.
    if (taskData.assignedToId && taskData.assignedToId !== uploaderId) {
        recipients.add(taskData.assignedToId);
    }
    
    // Step 4: Send the notifications.
    const notificationText = `"${attachmentData.uploaderName}" attached a file to: "${taskData.name}"`;
    for (const userId of recipients) {
        addNotification(userId, {
            text: notificationText,
            type: 'new_attachment',
            taskId: taskId,
            taskName: taskData.name
        });
    }
}