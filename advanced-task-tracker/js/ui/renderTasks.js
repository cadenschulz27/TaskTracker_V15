import { createTaskElement } from './createTaskElement.js';
import { updateProgressBar } from './updateProgressBar.js';

/**
 * Renders a list of tasks onto the Kanban board, placing them in the correct columns.
 * This function orchestrates the entire board redraw.
 * @param {Array<object>} tasksToRender - The filtered list of tasks to display.
 * @param {object} state - The global application state.
 * @param {object} handlers - An object of callback functions for interactions.
 */
export function renderTasks(tasksToRender, state, handlers) {
    // Get the three columns from the DOM.
    const notStartedCol = document.getElementById('tasks-not-started');
    const inProgressCol = document.getElementById('tasks-in-progress');
    const completedCol = document.getElementById('tasks-completed');
    
    // Clear the columns and remove old data listeners to prevent memory leaks.
    notStartedCol.innerHTML = '';
    inProgressCol.innerHTML = '';
    completedCol.innerHTML = '';
    if (handlers.clearListeners) {
        handlers.clearListeners();
    }

    // Loop through tasks, create an element for each, and append to the correct column.
    tasksToRender.forEach(task => {
        const taskElement = createTaskElement(task, state, handlers);
        if (task.status === 'Not Started') {
            notStartedCol.appendChild(taskElement);
        } else if (task.status === 'In Progress') {
            inProgressCol.appendChild(taskElement);
        } else if (task.status === 'Completed') {
            completedCol.appendChild(taskElement);
        }
    });

    // After cards are rendered, attach the real-time listeners for their details.
    tasksToRender.forEach(task => {
        if (handlers.listenForAttachments) handlers.listenForAttachments(task.id); // Add new listener
        if (handlers.listenForComments) handlers.listenForComments(task.id);
        if (handlers.listenForSubtasks) handlers.listenForSubtasks(task.id);
        if (handlers.listenForActivity) handlers.listenForActivity(task.id)
    });

    // Update UI states like the "empty" message and loading spinner.
    document.getElementById('empty-state').classList.toggle('hidden', tasksToRender.length > 0);
    document.getElementById('loading-spinner').innerHTML = '';

    // Finally, update the progress bar with the new counts.
    const completedCount = tasksToRender.filter(t => t.status === 'Completed').length;
    updateProgressBar(completedCount, tasksToRender.length);
}