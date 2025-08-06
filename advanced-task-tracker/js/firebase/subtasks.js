import { db } from './init.js';
import {
    collection,
    query,
    onSnapshot,
    addDoc,
    doc,
    getDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { addNotification } from './notifications.js';

// listenForSubtasks function (no change)
export function listenForSubtasks(taskId, callback) {
    const subtasksPath = `tasks/${taskId}/subtasks`;
    const subtasksQuery = query(collection(db, subtasksPath));
    const unsubscribe = onSnapshot(subtasksQuery, (snapshot) => {
        const subtasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        subtasks.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
        callback(taskId, subtasks);
    });
    return unsubscribe;
}

/**
 * Adds a new subtask and notifies the parent task's owner and creator.
 * @param {string} taskId - The ID of the parent task.
 * @param {object} subtaskData - The data for the new subtask.
 * @returns {Promise<void>}
 */
export async function addSubtask(taskId, subtaskData) {
    const subtasksPath = `tasks/${taskId}/subtasks`;
    await addDoc(collection(db, subtasksPath), {
        ...subtaskData,
        createdAt: serverTimestamp()
    });

    // Fetch the parent task to notify relevant users
    const taskDocRef = doc(db, 'tasks', taskId);
    const taskSnapshot = await getDoc(taskDocRef);
    if (!taskSnapshot.exists()) return;
    const taskData = taskSnapshot.data();

    const recipients = new Set([taskData.creatorId, taskData.assignedToId]);
    recipients.delete(undefined); // Remove any potential undefined IDs

    const notificationText = `A new subtask was added to: "${taskData.name}"`;
    for (const userId of recipients) {
        addNotification(userId, {
            text: notificationText,
            type: 'subtask_added',
            taskId: taskId,
            taskName: taskData.name
        });
    }
}

/**
 * Updates a subtask's status and notifies the parent task's owner/creator on completion.
 * @param {string} taskId - The ID of the parent task.
 * @param {string} subtaskId - The ID of the subtask to update.
 * @param {boolean} isCompleted - The new completion state.
 * @returns {Promise<void>}
 */
export async function updateSubtaskStatus(taskId, subtaskId, isCompleted) {
    const subtaskPath = `tasks/${taskId}/subtasks/${subtaskId}`;
    const subtaskDocRef = doc(db, subtaskPath);
    await updateDoc(subtaskDocRef, {
        status: isCompleted ? 'Completed' : 'Incomplete'
    });

    // Only send a notification when the task is marked as complete
    if (isCompleted) {
        const taskDocRef = doc(db, 'tasks', taskId);
        const taskSnapshot = await getDoc(taskDocRef);
        if (!taskSnapshot.exists()) return;
        const taskData = taskSnapshot.data();

        const recipients = new Set([taskData.creatorId, taskData.assignedToId]);
        recipients.delete(undefined);

        const notificationText = `A subtask was completed in: "${taskData.name}"`;
        for (const userId of recipients) {
            addNotification(userId, {
                text: notificationText,
                type: 'subtask_completed',
                taskId: taskId,
                taskName: taskData.name
            });
        }
    }
}

// deleteSubtask function (no change)
export function deleteSubtask(taskId, subtaskId) {
    const subtaskPath = `tasks/${taskId}/subtasks/${subtaskId}`;
    const subtaskDocRef = doc(db, subtaskPath);
    return deleteDoc(subtaskDocRef);
}