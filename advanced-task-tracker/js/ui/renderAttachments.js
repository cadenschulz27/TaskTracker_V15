/**
 * Renders a list of file attachments into the appropriate container.
 * @param {string} taskId - The ID of the task to which the attachments belong.
 * @param {Array<object>} attachments - An array of attachment metadata objects.
 */
export function renderAttachments(taskId, attachments) {
    const container = document.getElementById(`attachment-list-${taskId}`);
    if (!container) return;

    container.innerHTML = ''; // Clear existing attachments

    if (attachments.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-400 italic">No files attached.</p>`;
        return;
    }

    attachments.forEach(file => {
        const fileElement = document.createElement('div');
        fileElement.className = 'flex items-center justify-between text-sm group';
        
        fileElement.innerHTML = `
            <a href="${file.url}" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 text-blue-600 hover:underline truncate">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                <span class="truncate">${file.name}</span>
            </a>
            <span class="text-xs text-slate-400">by ${file.uploaderName}</span>
        `;
        
        container.appendChild(fileElement);
    });
}