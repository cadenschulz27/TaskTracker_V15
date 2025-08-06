import { db } from './init.js';
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    doc,
    updateDoc,
    writeBatch,
    getDocs,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

/**
 * Adds a new notification document to a user's 'notifications' sub-collection.
 * @param {string} recipientId - The ID of the user who should receive the notification.
 * @param {object} notificationData - The data for the new notification.
 * @returns {Promise<DocumentReference>} A promise that resolves with the new document's reference.
 */
export function addNotification(recipientId, notificationData) {
    const notificationsCollectionRef = collection(db, `users/${recipientId}/notifications`);
    return addDoc(notificationsCollectionRef, {
        ...notificationData,
        read: false,
        timestamp: serverTimestamp()
    });
}

/**
 * Listens for real-time updates to a user's 'notifications' sub-collection.
 * @param {string} userId - The ID of the user whose notifications to listen for.
 * @param {Function} callback - The function to call with the new array of sorted notifications.
 * @returns {Function} An unsubscribe function to stop the listener.
 */
export function listenForNotifications(userId, callback) {
    const notificationsPath = `users/${userId}/notifications`;
    const notificationsQuery = query(collection(db, notificationsPath));

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
        const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort notifications by timestamp in descending order (newest first)
        notifications.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
        callback(notifications);
    }, (error) => {
        console.error("[Notifications] Listener failed with an error:", error);
    });

    return unsubscribe;
}

/**
 * Marks a single notification as read in the database.
 * @param {string} userId - The ID of the user who owns the notification.
 * @param {string} notificationId - The ID of the notification to update.
 * @returns {Promise<void>}
 */
export function markNotificationAsRead(userId, notificationId) {
    const notificationRef = doc(db, `users/${userId}/notifications`, notificationId);
    return updateDoc(notificationRef, { read: true });
}

/**
 * Marks all of a user's notifications as read using a batch write.
 * @param {string} userId - The ID of the user whose notifications will be updated.
 * @returns {Promise<void>}
 */
export async function markAllNotificationsAsRead(userId) {
    const notificationsPath = `users/${userId}/notifications`;
    const notificationsQuery = query(collection(db, notificationsPath), where("read", "==", false));
    
    const snapshot = await getDocs(notificationsQuery);
    if (snapshot.empty) {
        return; // No unread notifications to update
    }

    const batch = writeBatch(db);
    snapshot.docs.forEach(document => {
        batch.update(document.ref, { read: true });
    });

    await batch.commit();
}

/**
 * Deletes all notifications for a specific user.
 * @param {string} userId - The ID of the user whose notifications will be deleted.
 * @returns {Promise<void>}
 */
export async function deleteAllNotifications(userId) {
    const notificationsPath = `users/${userId}/notifications`;
    const notificationsQuery = query(collection(db, notificationsPath));

    const snapshot = await getDocs(notificationsQuery);
    if (snapshot.empty) {
        return; // No notifications to delete
    }

    const batch = writeBatch(db);
    snapshot.docs.forEach(document => {
        batch.delete(document.ref);
    });

    await batch.commit();
}