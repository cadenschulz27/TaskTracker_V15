/**
 * Resets the task modal to its default 'create' state. It clears any
 * previous data, resets form attributes, and updates the button and title text.
 */
export function resetTaskModal() {
    const taskModal = document.getElementById('task-modal');
    const taskForm = document.getElementById('task-form');
    const modalTitle = document.getElementById('modal-title');
    const modalSubmitBtn = document.getElementById('modal-submit-btn');

    if (taskModal && taskForm && modalTitle && modalSubmitBtn) {
        // Reset form data and mode
        taskForm.reset();
        taskForm.dataset.mode = 'create';
        delete taskForm.dataset.taskId;

        // Update titles and buttons
        modalTitle.textContent = 'Create a New Task';
        modalSubmitBtn.textContent = 'Create Task';
    } else {
        console.error("UI Error: Could not find all necessary modal elements for reset.");
    }
}
