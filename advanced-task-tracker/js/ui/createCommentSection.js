/**
 * Creates the comment section as a clickable, expandable accordion.
 * @param {string} taskId - The ID of the parent task.
 * @param {Function} addHandler - The callback function for the 'post' form.
 * @returns {HTMLElement} The fully constructed comment section element.
 */
export function createCommentSection(taskId, addHandler) {
    const container = document.createElement('div');
    container.className = 'mt-4 border-t border-slate-200 pt-4';

    container.innerHTML = `
        <button class="accordion-toggle-btn flex items-center justify-between w-full text-sm font-semibold text-midnight">
            <span>Comments</span>
            <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
        </button>
        <div class="accordion-content mt-2">
            <div id="comment-list-${taskId}" class="pl-4 space-y-2 mb-3"></div>
            <form class="comment-form flex gap-2 pl-4">
                <input type="text" placeholder="Add a comment..." required class="flex-grow p-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-sun">
                <button type="submit" class="bg-midnight text-white font-semibold text-sm px-3 rounded-md hover:bg-midnight-dark">Post</button>
            </form>
        </div>
    `;

    const toggleBtn = container.querySelector('.accordion-toggle-btn');
    const content = container.querySelector('.accordion-content');

    toggleBtn.addEventListener('click', () => {
        toggleBtn.classList.toggle('is-open');
        content.classList.toggle('is-open');
    });

    container.querySelector('.comment-form').addEventListener('submit', (e) => addHandler(e, taskId));
    
    return container;
}