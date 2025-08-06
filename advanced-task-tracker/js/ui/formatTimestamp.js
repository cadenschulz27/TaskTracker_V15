/**
 * Converts a Firebase timestamp object into a human-readable string.
 * It gracefully handles cases where the timestamp is missing or invalid.
 * @param {object} timestamp - The Firebase server timestamp object.
 * @returns {string} A formatted date string like "Jul 22, 2025, 9:58 AM" or 'N/A'.
 */
export function formatTimestamp(timestamp) {
    // First, check if the timestamp is valid and has the necessary 'toDate' method.
    if (!timestamp || typeof timestamp.toDate !== 'function') {
        // If not, return a default string to avoid errors.
        return 'N/A';
    }

    // Convert the Firebase timestamp to a standard JavaScript Date object.
    const date = timestamp.toDate();

    // Format the date into a locale-specific, readable string.
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}