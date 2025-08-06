import { formatTimestamp } from './formatTimestamp.js';
import { createSubtaskSection } from './createSubtaskSection.js';
import { createCommentSection } from './createCommentSection.js';
import { createActivityLogSection } from './createActivityLogSection.js';
import { openEditModal } from './openEditModal.js';

const deleteIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-trash-2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;
const editIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;

export function createTaskElement(task, state, handlers) {
    const card = document.createElement('div');
    card.draggable = true;
    card.dataset.id = task.id;

    // --- Card Styles ---
    const isCompleted = task.status === 'Completed';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.dueDate + 'T00:00:00');
    const isOverdue = dueDate < today && !isCompleted;
    
    card.className = 'task-card p-4 rounded-lg shadow-md cursor-grab border-l-4 transition-shadow duration-200 hover:shadow-lg';

    if (isCompleted) {
        card.style.backgroundColor = '#F1F5F9'; 
        card.style.borderColor = '#CBD5E1';
    } else if (isOverdue) {
        card.style.backgroundColor = '#FFFBEB';
        card.style.borderColor = '#FFC828';
    } else {
        card.style.backgroundColor = '#FFFFFF';
        switch (task.priority) {
            case 'High': card.style.borderColor = '#FFC828'; break;
            case 'Medium': card.style.borderColor = '#C1E0F9'; break;
            case 'Low': card.style.borderColor = '#E2E8F0'; break;
            default: card.style.borderColor = '#CBD5E1';
        }
    }

    // --- Card Structure ---
    const clientInfoHtml = task.clientName 
        ? `<span>|</span><span>For: <strong>${task.clientName}</strong></span>` 
        : '';

    card.innerHTML = `
        <div class="summary-view flex items-start gap-4">
            <div class="flex-grow">
                <p class="font-bold text-lg text-ink ${isCompleted ? 'line-through text-slate-500' : ''}">${task.name}</p>
                <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-2">
                    <span class="font-semibold ${isOverdue ? 'text-red-600' : ''}">Due: ${task.dueDate}</span>
                    <span>|</span>
                    <span>To: <strong>${task.assignedToName}</strong></span>
                    ${clientInfoHtml}
                </div>
            </div>
            <div class="action-buttons flex flex-col gap-2 items-center">
                <button class="expand-btn text-slate-400 hover:text-midnight" aria-label="Expand task details">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                </button>
            </div>
        </div>
        <div class="details-view hidden mt-4 pt-4 border-t border-slate-200"></div>`;

    // --- Assemble Sub-Sections ---
    const detailsView = card.querySelector('.details-view');
    
    const descriptionBubble = document.createElement('div');
    descriptionBubble.className = 'bg-slate-50 p-3 rounded-lg mb-4';
    descriptionBubble.innerHTML = `<h4 class="text-sm font-semibold text-midnight mb-1">Description</h4><p class="text-ink break-words">${task.description || 'No description provided.'}</p>`;
    
    const attachmentSection = (() => {
        const container = document.createElement('div');
        container.className = 'mt-4 border-t border-slate-200 pt-4';

        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'accordion-toggle-btn flex items-center justify-between w-full text-sm font-semibold text-midnight';
        toggleBtn.innerHTML = `<span>Attachments</span><svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>`;

        const content = document.createElement('div');
        content.className = 'accordion-content mt-2';

        const list = document.createElement('div');
        list.id = `attachment-list-${task.id}`;
        list.className = 'pl-4 space-y-2 mb-3';

        const form = document.createElement('form');
        form.className = 'attachment-form flex flex-col gap-2 pl-4';

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.required = true;
        fileInput.className = 'attachment-file-input w-full text-sm border border-slate-300 rounded-md file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200';

        const uploadButton = document.createElement('button');
        uploadButton.type = 'submit';
        uploadButton.className = 'bg-midnight text-white font-semibold text-sm p-2 rounded-md hover:bg-midnight-dark mt-2';
        uploadButton.textContent = 'Upload Selected File';

        const progressBar = document.createElement('div');
        progressBar.className = 'upload-progress-bar bg-slate-200 rounded-full h-1.5 hidden';
        progressBar.innerHTML = `<div class="bg-blue-500 h-1.5 rounded-full" style="width: 0%"></div>`;

        const statusText = document.createElement('p');
        statusText.className = 'upload-status-text text-xs text-slate-500 hidden';

        form.append(fileInput, uploadButton, progressBar, statusText);
        content.append(list, form);
        container.append(toggleBtn, content);
        
        toggleBtn.addEventListener('click', () => {
            toggleBtn.classList.toggle('is-open');
            content.classList.toggle('is-open');
        });
        
        form.addEventListener('submit', (e) => handlers.uploadAttachment(e, task.id));

        return container;
    })();

    detailsView.appendChild(descriptionBubble);
    detailsView.appendChild(attachmentSection);
    detailsView.appendChild(createSubtaskSection(task.id, handlers.addSubtask));
    detailsView.appendChild(createCommentSection(task.id, handlers.addComment));
    detailsView.appendChild(createActivityLogSection(task.id));
    
    // --- Role-based Buttons & Event Listeners (CORRECTED) ---
    const userRole = state.loggedInUser.role;
    const userId = state.loggedInUser.id;
    const creatorId = task.creatorId;

    // Simplified logic for supervisors
    const isSupervisor = userRole === 'Advisor' || userRole === 'WMA';

    const canDelete = isSupervisor || (userRole === 'Intern' && creatorId === userId);
    const canEdit = isSupervisor || (userRole === 'Intern' && creatorId === userId);

    const actionButtonsContainer = card.querySelector('.action-buttons');

    if (canEdit) {
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-task-btn text-slate-400 hover:text-midnight';
        editBtn.setAttribute('aria-label', 'Edit task');
        editBtn.innerHTML = editIconSVG;
        editBtn.addEventListener('click', () => openEditModal(task));
        actionButtonsContainer.appendChild(editBtn);
    }

    if (canDelete) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-task-btn text-slate-400 hover:text-red-600';
        deleteBtn.setAttribute('aria-label', 'Delete task');
        deleteBtn.innerHTML = deleteIconSVG;
        deleteBtn.addEventListener('click', () => handlers.deleteTask(task.id, task.name));
        actionButtonsContainer.appendChild(deleteBtn);
    }
    
    if (task.assignedToId === 'any_intern' && userRole === 'Intern') {
        const claimButton = document.createElement('button');
        claimButton.className = 'claim-task-btn bg-green-600 text-white font-bold text-sm py-1 px-3 rounded-full hover:bg-green-700 mt-2';
        claimButton.textContent = 'Claim Task';
        claimButton.addEventListener('click', () => handlers.claimTask(task.id));
        card.querySelector('.summary-view .flex-grow').appendChild(claimButton);
    }

    card.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', task.id); setTimeout(() => card.classList.add('opacity-40'), 0); });
    card.addEventListener('dragend', () => card.classList.remove('opacity-40'));

    card.querySelector('.expand-btn').addEventListener('click', (e) => {
        const isHidden = card.querySelector('.details-view').classList.toggle('hidden');
        e.currentTarget.innerHTML = isHidden ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>` : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`;
    });

    return card;
}