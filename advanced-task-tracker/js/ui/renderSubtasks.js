/**
 * Renders a list of sub-tasks with interactive checkboxes and delete buttons.
 * @param {string} taskId - The ID of the parent task.
 * @param {Array<object>} subtasks - An array of sub-task objects to display.
 * @param {Function} updateHandler - A callback function to execute when a checkbox is changed.
 * @param {Function} deleteHandler - A callback function to execute when the delete button is clicked.
 */
export function renderSubtasks(taskId, subtasks, updateHandler, deleteHandler) {
    const container = document.getElementById(`subtask-list-${taskId}`);
    if (!container) return;

    container.innerHTML = '';

    subtasks.forEach(subtask => {
        const isCompleted = subtask.status === 'Completed';
        const element = document.createElement('div');
        element.className = 'flex items-center justify-between gap-2 p-1 group';

        element.innerHTML = `
            <div class="flex items-center gap-2">
                <input type="checkbox" 
                       class="subtask-checkbox h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                       ${isCompleted ? 'checked' : ''}>
                <label class="text-sm ${isCompleted ? 'line-through text-slate-500' : ''}">
                    ${subtask.text}
                </label>
            </div>
            <button class="subtask-delete-btn text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        `;

        element.querySelector('.subtask-checkbox').addEventListener('change', (e) => {
            updateHandler(taskId, subtask.id, e.target.checked);
        });
        element.querySelector('.subtask-delete-btn').addEventListener('click', () => {
            deleteHandler(taskId, subtask.id);
        });

        container.appendChild(element);
    });
}