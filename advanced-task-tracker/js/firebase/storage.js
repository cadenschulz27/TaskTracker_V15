import { storage } from './init.js';
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

/**
 * Uploads a file to a specific path in Firebase Storage.
 * @param {string} path - The full path where the file should be stored (e.g., `tasks/taskId/fileName`).
 * @param {File} file - The file object to upload.
 * @returns {Promise<string>} A promise that resolves with the public download URL of the uploaded file.
 */
export async function uploadFile(path, file) {
    const storageRef = ref(storage, path);
    
    // 'uploadBytes' returns an object with metadata about the upload
    const snapshot = await uploadBytes(storageRef, file);
    
    // Use the snapshot to get the public download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
}