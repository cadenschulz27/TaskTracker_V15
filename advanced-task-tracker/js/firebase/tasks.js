import { db } from './init.js';
import {
    collection,
    query,
    where,
    or,
    onSnapshot,
    addDoc,
    doc,
    getDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { addActivityLog } from './activity.js';
import * as FB_NOTIFICATIONS from './notifications.js';
import * as FB_USERS from './users.js'; // Import users module for fetching all users

/**
 * Listens for real-time task updates from Firestore based on the user's role and identity.
 * Each query is crafted to perfectly match the `allow read` rules in firestore.rules.
 * @param {object} user - The currently logged-in user object, must contain `id` and `role`.
 * @param {Function} callback - The function to call with the new array of tasks.
 * @returns {Function} An unsubscribe function to stop the listener.
 */
export function listenForTasks(user, callback) {
    const tasksCollectionRef = collection(db, 'tasks');
    let tasksQuery;

    // The query logic is now broken down by role to match the specific
    // permissions defined in the backend security rules.
    if (user.role === 'Advisor') {
        // Advisors see all non-personal tasks OR any task assigned directly to them.
        tasksQuery = query(tasksCollectionRef,
            or(
                where("isPersonal", "==", false),
                where("assignedToId", "==", user.id)
            )
        );
    } else if (user.role === 'WMA') {
        // WMAs see all non-personal tasks OR tasks assigned to them.
        // This query now perfectly aligns with the Firestore Security Rule for WMAs.
        tasksQuery = query(tasksCollectionRef,
            or(
                where("isPersonal", "==", false), // See all public tasks
                where("assignedToId", "==", user.id) // See tasks assigned to them
            )
        );
    } else if (user.role === 'Intern') {
        // Interns see tasks assigned to them OR tasks available for any intern to claim.
        tasksQuery = query(tasksCollectionRef,
            or(
                where("assignedToId", "==", user.id),
                where("assignedToId", "==", "any_intern")
            )
        );
    }

    if (tasksQuery) {
        const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
            const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(tasks);
        }, (error) => {
            console.error("Error listening for task updates: ", error);
        });
        return unsubscribe;
    } else {
        console.error("Unknown user role, cannot fetch tasks.");
        return () => {}; // Return an empty unsubscribe function
    }
}

/**
 * Creates a new task document in Firestore.
 * @param {object} taskData - The core data for the new task.
 * @param {object} creator - The user object of the person creating the task.
 * @returns {Promise<DocumentReference>}
 */
export async function addTask(taskData, creator) {
    const tasksCollectionRef = collection(db, 'tasks');
    const newTaskRef = await addDoc(tasksCollectionRef, {
        ...taskData,
        creatorId: creator.id,
        creatorName: creator.displayName,
        creatorRole: creator.role,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        completedAt: null, // Initialize completedAt field
    });
    addActivityLog(newTaskRef.id, `Task created by ${creator.displayName}.`);
    
    // NEW: Trigger notifications for the new task
    if (taskData.assignedToId === 'any_intern') {
        // If assigned to any intern, notify all interns (excluding the creator)
        const allUsersSnapshot = await FB_USERS.getAllUsers();
        const allInterns = allUsersSnapshot.docs.filter(doc => doc.data().role === 'Intern');
        allInterns.forEach(intern => {
            if (intern.id !== creator.id) {
                 FB_NOTIFICATIONS.addNotification(intern.id, {
                     text: `A new task is available for claiming: "${taskData.name}".`,
                     type: 'new_task_unclaimed',
                     taskId: newTaskRef.id,
                     taskName: taskData.name,
                     read: false
                 });
            }
        });
    } else if (taskData.assignedToId !== creator.id) {
        // If assigned to a specific person other than the creator, notify them
        FB_NOTIFICATIONS.addNotification(taskData.assignedToId, {
            text: `You have been assigned a new task: "${taskData.name}".`,
            type: 'new_task_assigned',
            taskId: newTaskRef.id,
            taskName: taskData.name,
            read: false
        });
    }

    return newTaskRef;
}

/**
 * Performs a general update on a task document.
 * @param {string} taskId - The ID of the task to update.
 * @param {object} taskData - An object containing the fields to update.
 * @returns {Promise<void>}
 */
export async function updateTask(taskId, taskData) {
    const taskDocRef = doc(db, 'tasks', taskId);
    await updateDoc(taskDocRef, {
        ...taskData,
        updatedAt: serverTimestamp()
    });

    // NEW: Trigger notifications for task edits.
    const taskSnapshot = await getDoc(taskDocRef);
    const task = taskSnapshot.data();

    // Notify the assigned user if a supervisor makes a change
    if ((task.creatorRole === 'Advisor' || task.creatorRole === 'WMA') && task.assignedToId !== task.creatorId) {
        FB_NOTIFICATIONS.addNotification(task.assignedToId, {
            text: `Task "${task.name}" has been edited by ${task.creatorName}.`,
            type: 'task_edited',
            taskId: taskId,
            taskName: task.name,
            read: false
        });
    }
}

/**
 * Updates a task's status and completion data when it's moved via drag-and-drop.
 * @param {string} taskId - The ID of the task to update.
 * @param {string} newStatus - The new status string (e.g., 'In Progress').
 * @param {object} user - The user object of the person performing the action.
 * @returns {Promise<void>}
 */
export async function updateTaskStatusOnDrop(taskId, newStatus, user) {
    const taskDocRef = doc(db, 'tasks', taskId);
    const dataToUpdate = {
        status: newStatus,
        updatedAt: serverTimestamp()
    };
    
    // Fetch the task to get original data for notifications
    const taskSnapshot = await getDoc(taskDocRef);
    const oldTaskData = taskSnapshot.data();

    // If the task is being marked as 'Completed', set the completion timestamp.
    // Otherwise, clear it.
    if (newStatus === 'Completed') {
        dataToUpdate.completedAt = serverTimestamp();
        dataToUpdate.completedById = user.id;
        dataToUpdate.completedByName = user.displayName;
    } else {
        dataToUpdate.completedAt = null;
        dataToUpdate.completedById = null;
        dataToUpdate.completedByName = null;
    }

    await updateDoc(taskDocRef, dataToUpdate);
    addActivityLog(taskId, `Status changed to "${newStatus}".`);

    // NEW: Trigger notifications for status change
    const assignedToId = oldTaskData.assignedToId;

    // Notify the assigned user (if not the one who made the change)
    if (assignedToId && assignedToId !== user.id) {
        FB_NOTIFICATIONS.addNotification(assignedToId, {
            text: `The status of task "${oldTaskData.name}" was changed to "${newStatus}" by ${user.displayName}.`,
            type: 'task_status_change',
            taskId: taskId,
            taskName: oldTaskData.name,
            read: false
        });
    }
    // Also notify the creator (if not the one who made the change or assigned)
    if (oldTaskData.creatorId && oldTaskData.creatorId !== user.id && oldTaskData.creatorId !== assignedToId) {
         FB_NOTIFICATIONS.addNotification(oldTaskData.creatorId, {
            text: `The status of your task "${oldTaskData.name}" was changed to "${newStatus}" by ${user.displayName}.`,
            type: 'task_status_change',
            taskId: taskId,
            taskName: oldTaskData.name,
            read: false
        });
    }
}

/**
 * Updates a task to be assigned to the user who claimed it.
 * @param {string} taskId - The ID of the task to claim.
 * @param {string} userId - The ID of the user claiming the task.
 * @param {string} userName - The display name of the user claiming the task.
 * @returns {Promise<void>}
 */
export async function claimTask(taskId, userId, userName) {
    const taskDocRef = doc(db, 'tasks', taskId);
    await updateDoc(taskDocRef, {
        assignedToId: userId,
        assignedToName: userName,
        updatedAt: serverTimestamp()
    });
    addActivityLog(taskId, `${userName} claimed this task.`);

    // NEW: Trigger notification to the task creator that the task has been claimed
    const taskSnapshot = await getDoc(taskDocRef);
    const taskData = taskSnapshot.data();

    if (taskData.creatorId && taskData.creatorId !== userId) { // Don't notify the claimant
        FB_NOTIFICATIONS.addNotification(taskData.creatorId, {
            text: `Task "${taskData.name}" has been claimed by ${userName}.`,
            type: 'task_claimed',
            taskId: taskId,
            taskName: taskData.name,
            read: false
        });
    }
}

/**
 * Deletes a task document and notifies the assignee.
 * @param {string} taskId - The ID of the task to delete.
 * @returns {Promise<void>}
 */
export async function deleteTask(taskId) {
    const taskDocRef = doc(db, 'tasks', taskId);

    // Step 1: Read the task data before deleting it.
    const taskSnapshot = await getDoc(taskDocRef);
    if (!taskSnapshot.exists()) {
        console.warn("Tried to delete a task that doesn't exist.");
        return;
    }
    const taskData = taskSnapshot.data();

    // Step 2: Delete the task document.
    await deleteDoc(taskDocRef);

    // Step 3: Notify the assignee that the task was deleted.
    // Note: We don't know who deleted it, so we can't exclude them from the notification.
    if (taskData.assignedToId && taskData.assignedToId !== 'any_intern') {
        FB_NOTIFICATIONS.addNotification(taskData.assignedToId, {
            text: `The task "${taskData.name}" was deleted from your task list.`,
            type: 'task_deleted',
            taskId: taskId,
            taskName: taskData.name
        });
    }
}