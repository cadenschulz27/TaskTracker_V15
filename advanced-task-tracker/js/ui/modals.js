export function showConfirmationModal(message, onConfirm) {
    // --- NEW: Remove any existing modal first ---
    const existingModal = document.getElementById('custom-confirm-modal');
    if (existingModal) {
        existingModal.remove();
    }

    const modalHtml = `
        <div id="custom-confirm-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div class="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full text-center">
                <p class="text-lg font-semibold mb-4">${message}</p>
                <div class="flex justify-center gap-4">
                    <button id="confirm-yes" class="bg-red-600 text-white px-5 py-2 rounded-md hover:bg-red-700 transition duration-200">Yes</button>
                    <button id="confirm-no" class="bg-slate-300 text-slate-800 px-5 py-2 rounded-md hover:bg-slate-400 transition duration-200">No</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('confirm-yes').addEventListener('click', () => {
        onConfirm();
        document.getElementById('custom-confirm-modal').remove();
    });
    document.getElementById('confirm-no').addEventListener('click', () => {
        document.getElementById('custom-confirm-modal').remove();
    });
}

/**
 * Shows a simple message modal with an OK button.
 * @param {string} message - The message to display.
 * @param {Function} [onClose] - An optional callback function to run after the modal is closed.
 */
export function showMessageModal(message, onClose) {
    // --- NEW: Remove any existing modal first ---
    const existingModal = document.getElementById('custom-message-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modalHtml = `
        <div id="custom-message-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div class="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full text-center">
                <p class="text-lg font-semibold mb-4">${message}</p>
                <button id="message-ok" class="bg-midnight text-white px-5 py-2 rounded-md hover:bg-midnight-dark transition duration-200">OK</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('message-ok').addEventListener('click', () => {
        document.getElementById('custom-message-modal').remove();
        if (onClose) {
            onClose();
        }
    });
}