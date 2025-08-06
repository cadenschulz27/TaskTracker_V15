/**
 * Creates the entire activity log section, now as a clickable, expandable accordion.
 * @param {string} taskId - The ID of the parent task.
 * @returns {HTMLElement} The fully constructed activity log section element.
 */
export function createActivityLogSection(taskId) {
    const container = document.createElement('div');
    container.className = 'mt-4 border-t border-slate-200 pt-4';

    container.innerHTML = `
        <button class="accordion-toggle-btn flex items-center justify-between w-full text-sm font-semibold text-midnight">
            <span>Activity</span>
            <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
        </button>
        <div id="activity-list-${taskId}" class="accordion-content mt-2 space-y-1 pl-4 border-l-2 border-slate-200"></div>
    `;

    const toggleBtn = container.querySelector('.accordion-toggle-btn');
    const listContainer = container.querySelector(`#activity-list-${taskId}`);

    toggleBtn.addEventListener('click', () => {
        toggleBtn.classList.toggle('is-open');
        listContainer.classList.toggle('is-open');
    });

    return container;
}