import * as FB_TASKS from './firebase/tasks.js';
import * as FB_COMMENTS from './firebase/comments.js';
import * as FB_SUBTASKS from './firebase/subtasks.js';
import * as FB_ATTACHMENTS from './firebase/attachments.js';
import * as FB_STORAGE from './firebase/storage.js';
import { showConfirmationModal, showMessageModal } from './ui/modals.js';

let state, closeModal;

export function initializeHandlers(_state, _closeModal) {
    state = _state;
    closeModal = _closeModal;
}

export async function handleTaskFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const assigneeSelect = document.getElementById('task-assignee');
    const clientSelect = document.getElementById('task-client');
    const isPersonal = document.getElementById('task-personal').checked;
    
    const taskData = {
        name: form.elements['task-name'].value,
        description: form.elements['task-description'].value,
        dueDate: form.elements['task-due-date'].value,
        priority: form.elements['task-priority'].value,
        isPersonal: isPersonal,
        clientId: clientSelect.value,
        clientName: clientSelect.value ? clientSelect.options[clientSelect.selectedIndex].text : ''
    };

    if (isPersonal) {
        taskData.assignedToId = state.loggedInUser.id;
        taskData.assignedToName = state.loggedInUser.displayName;
    } else {
        taskData.assignedToId = assigneeSelect.value;
        taskData.assignedToName = assigneeSelect.options[assigneeSelect.selectedIndex].text;
    }

    try {
        if (form.dataset.mode === 'edit') {
            await FB_TASKS.updateTask(form.dataset.taskId, taskData);
        } else {
            taskData.status = 'Not Started';
            await FB_TASKS.addTask(taskData, state.loggedInUser);
        }
        closeModal();
    } catch (error) {
        console.error("Error saving task:", error);
    }
}

export async function handleDeleteTask(taskId, taskName) {
    showConfirmationModal(`Are you sure you want to delete the task "${taskName}"?`, async () => {
        try {
            await FB_TASKS.deleteTask(taskId);
        } catch (error) {
            console.error("Error deleting task:", error);
            showMessageModal("Failed to delete task. You may not have permission.");
        }
    });
}

export async function handleUploadAttachment(event, taskId) {
    event.preventDefault();
    const form = event.target;
    const fileInput = form.querySelector('.attachment-file-input');
    const file = fileInput.files[0];
    if (!file) {
        alert("Please select a file to upload.");
        return;
    }
    const progressBar = form.querySelector('.upload-progress-bar');
    const statusText = form.querySelector('.upload-status-text');
    try {
        progressBar.classList.remove('hidden');
        statusText.classList.remove('hidden');
        statusText.textContent = `Uploading ${file.name}...`;
        form.querySelector('button').disabled = true;
        const filePath = `tasks/${taskId}/${Date.now()}_${file.name}`;
        const downloadURL = await FB_STORAGE.uploadFile(filePath, file);
        const attachmentData = {
            name: file.name,
            url: downloadURL,
            uploaderId: state.loggedInUser.id,
            uploaderName: state.loggedInUser.displayName,
            type: file.type,
            size: file.size,
        };
        await FB_ATTACHMENTS.addAttachment(taskId, attachmentData);
        statusText.textContent = 'Upload complete!';
        form.reset();
        setTimeout(() => {
            progressBar.classList.add('hidden');
            statusText.classList.add('hidden');
        }, 2000);
    } catch (error) {
        console.error("Error uploading file:", error);
        statusText.textContent = `Upload failed: ${error.message}`;
    } finally {
        form.querySelector('button').disabled = false;
    }
}

export async function handleAddComment(event, taskId) {
    event.preventDefault();
    const input = event.target.querySelector('input');
    if (!input.value.trim()) return;
    try {
        await FB_COMMENTS.addComment(taskId, { text: input.value.trim(), authorId: state.loggedInUser.id, authorName: state.loggedInUser.displayName });
        input.value = '';
    } catch (error) {
        console.error("Error adding comment:", error);
    }
}

export async function handleAddSubtask(event, taskId) {
    event.preventDefault();
    const input = event.target.querySelector('input');
    if (!input.value.trim()) return;
    try {
        await FB_SUBTASKS.addSubtask(taskId, { text: input.value.trim(), status: 'Incomplete' });
        input.value = '';
    } catch (error) {
        console.error("Error adding subtask:", error);
    }
}

export async function handleDeleteSubtask(taskId, subtaskId) {
    try {
        await FB_SUBTASKS.deleteSubtask(taskId, subtaskId);
    } catch (error) {
        console.error("Error deleting subtask:", error);
        showMessageModal("Failed to delete subtask.");
    }
}