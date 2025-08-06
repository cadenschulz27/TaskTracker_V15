import { formatTimestamp } from './formatTimestamp.js';

/**
 * Renders a list of comments into the appropriate container within a task card.
 * @param {string} taskId - The ID of the task to which the comments belong.
 * @param {Array<object>} comments - An array of comment objects to display.
 */
export function renderComments(taskId, comments) {
    const container = document.getElementById(`comment-list-${taskId}`);
    if (!container) return;

    container.innerHTML = '';

    comments.forEach(comment => {
        const commentDiv = document.createElement('div');
        commentDiv.className = 'py-2 border-b border-slate-100 last:border-b-0';
        
        // Add the timestamp below the comment text
        commentDiv.innerHTML = `
            <p class="text-sm"><strong>${comment.authorName}:</strong> ${comment.text}</p>
            <p class="text-xs text-slate-400 mt-1">${formatTimestamp(comment.createdAt)}</p>
        `;
        
        container.appendChild(commentDiv);
    });
}