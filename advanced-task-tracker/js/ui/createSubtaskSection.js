/**
 * Creates the sub-task section as a clickable, expandable accordion.
 * @param {string} taskId - The ID of the parent task.
 * @param {Function} addHandler - The callback function for the 'add' form.
 * @returns {HTMLElement} The fully constructed sub-task section element.
 */
export function createSubtaskSection(taskId, addHandler) {
    const container = document.createElement('div');
    container.className = 'border-t border-slate-200 pt-4';

    container.innerHTML = `
        <button class="accordion-toggle-btn flex items-center justify-between w-full text-sm font-semibold text-midnight">
            <span>Sub-Tasks</span>
            <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
        </button>
        <div class="accordion-content mt-2">
            <div id="subtask-list-${taskId}" class="pl-4 space-y-1 mb-3"></div>
            <form class="subtask-form flex gap-2 pl-4">
                <input type="text" placeholder="Add a sub-task..." required class="flex-grow p-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-sun">
                <button type="submit" class="bg-slate-200 text-ink font-semibold text-sm px-3 rounded-md hover:bg-slate-300">Add</button>
            </form>
        </div>
    `;
    
    const toggleBtn = container.querySelector('.accordion-toggle-btn');
    const content = container.querySelector('.accordion-content');

    toggleBtn.addEventListener('click', () => {
        toggleBtn.classList.toggle('is-open');
        content.classList.toggle('is-open');
    });
    
    container.querySelector('.subtask-form').addEventListener('submit', (e) => addHandler(e, taskId));

    return container;
}