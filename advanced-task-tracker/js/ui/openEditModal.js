/**
 * Opens the task modal in 'edit' mode, populating the form fields
 * with the data from the provided task object. It also correctly
 * sets the state of the "Personal Task" toggle and makes the modal visible.
 * @param {object} task - The task object containing data to edit.
 */
export function openEditModal(task) {
    const taskModal = document.getElementById('task-modal');
    const modalPanel = taskModal.querySelector('.modal-panel');
    const taskForm = document.getElementById('task-form');

    if (!taskModal || !taskForm || !task) {
        console.error("UI Error: Could not open edit modal due to missing elements or task data.");
        return;
    }

    // Set form mode and task ID for editing
    taskForm.dataset.mode = 'edit';
    taskForm.dataset.taskId = task.id;

    // Update modal title and button text
    taskModal.querySelector('#modal-title').textContent = 'Edit Task';
    taskModal.querySelector('#modal-submit-btn').textContent = 'Save Changes';

    // Populate standard form fields
    document.getElementById('task-name').value = task.name;
    document.getElementById('task-description').value = task.description;
    document.getElementById('task-due-date').value = task.dueDate;
    document.getElementById('task-priority').value = task.priority;
    
    // Handle the Personal Task toggle state
    const personalTaskToggle = document.getElementById('task-personal');
    const assigneeWrapper = document.getElementById('assignee-wrapper');
    const taskAssigneeSelect = document.getElementById('task-assignee');

    personalTaskToggle.checked = task.isPersonal || false;

    const isPersonal = personalTaskToggle.checked;
    assigneeWrapper.classList.toggle('hidden', isPersonal);
    taskAssigneeSelect.required = !isPersonal;

    if (!isPersonal) {
        document.getElementById('task-assignee').value = task.assignedToId;
    }

    // --- NEW: Pre-select the linked client ---
    document.getElementById('task-client').value = task.clientId || '';


    // Make the modal visible using the new animation logic
    taskModal.classList.remove('modal-hidden');
    taskModal.classList.add('modal-visible');
    requestAnimationFrame(() => {
        taskModal.classList.remove('opacity-0');
        modalPanel.classList.remove('opacity-0');
    });
}