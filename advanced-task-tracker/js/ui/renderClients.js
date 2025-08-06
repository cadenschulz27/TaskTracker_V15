import { openEditModal } from './openEditModal.js';

/**
 * Renders a list of clients as a series of collapsible accordions.
 * @param {Array<object>} clients - An array of client objects to display.
 * @param {object} state - The global application state, used to access allTasks.
 * @param {object} handlers - An object containing onEditClick and onDeleteClick callbacks.
 */
export function renderClients(clients, state, handlers) {
    const container = document.getElementById('clients-list-container');
    if (!container) {
        console.error("UI Error: Client list container not found.");
        return;
    }

    container.innerHTML = '';

    if (clients.length === 0) {
        container.innerHTML = `<p class="text-center text-slate-500 py-8">No clients have been added yet.</p>`;
        return;
    }
    
    const accordionContainer = document.createElement('div');
    accordionContainer.className = 'space-y-2';

    clients.forEach(client => {
        const clientWrapper = document.createElement('div');
        clientWrapper.className = 'bg-white rounded-lg shadow-md';

        const statusColors = {
            'Active': 'bg-green-100 text-green-800',
            'Prospect': 'bg-blue-100 text-blue-800',
            'Inactive': 'bg-slate-100 text-slate-800',
        };
        const statusStyle = statusColors[client.status] || statusColors['Inactive'];

        const formatField = (label, value) => {
            if (!value) return `<p class="text-sm"><strong class="font-medium text-slate-500">${label}:</strong> <span class="text-slate-400 italic">N/A</span></p>`;
            return `<p class="text-sm"><strong class="font-medium text-slate-500">${label}:</strong> <span class="text-ink">${value}</span></p>`;
        };
        
        const formatTextarea = (label, value) => {
            if (!value) return '';
            return `<div class="text-sm mt-2"><strong class="font-medium text-slate-500">${label}:</strong><div class="text-ink whitespace-pre-wrap pl-2">${value}</div></div>`;
        };

        // Find and prepare associated tasks
        const associatedTasks = state.allTasks.filter(task => task.clientId === client.id);
        let tasksHtml = '<p class="text-xs text-slate-400 italic">No tasks are linked to this client.</p>';

        if (associatedTasks.length > 0) {
            tasksHtml = associatedTasks.map(task => {
                const statusColors = {
                    'Completed': 'bg-green-100 text-green-800',
                    'In Progress': 'bg-yellow-100 text-yellow-800',
                    'Not Started': 'bg-slate-100 text-slate-800',
                };
                const taskStatusStyle = statusColors[task.status] || statusColors['Not Started'];
                return `
                    <div class="associated-task-item flex justify-between items-center text-sm p-1">
                        <a href="#" data-task-id="${task.id}" class="font-medium text-blue-600 hover:underline">${task.name}</a>
                        <div>
                            <span class="text-xs font-semibold px-2 py-0.5 rounded-full ${taskStatusStyle}">${task.status}</span>
                            <span class="text-xs text-slate-500 ml-2">Due: ${task.dueDate}</span>
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        clientWrapper.innerHTML = `
            <button class="accordion-toggle-btn flex items-center justify-between w-full p-4 text-left">
                <div class="flex items-center gap-4">
                    <span class="text-lg font-bold text-midnight">${client.name}</span>
                    <span class="text-xs font-semibold px-2 py-1 rounded-full ${statusStyle}">${client.status || 'N/A'}</span>
                </div>
                <svg class="w-5 h-5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
            </button>
            <div class="accordion-content main-accordion-content p-5 border-t border-slate-200">
                
                <div class="mt-2 pt-3 border-t border-slate-100">
                    <button class="accordion-toggle-btn flex items-center justify-between w-full text-sm font-semibold text-midnight">
                        <span>Details</span>
                        <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                    </button>
                    <div class="accordion-content mt-2 pl-2 space-y-1 border-l-2 ml-1">
                        ${formatField('Birthday', client.personal?.birthday)}
                        ${formatField('Age', client.personal?.age)}
                        ${formatField('Risk Profile', client.financials?.riskProfile)}
                        ${formatField('Household', client.financials?.assignedHousehold)}
                        ${formatField('Fee Schedule', client.financials?.feeSchedule)}
                    </div>
                </div>

                <div class="mt-3 pt-3 border-t border-slate-100">
                    <button class="accordion-toggle-btn flex items-center justify-between w-full text-sm font-semibold text-midnight">
                        <span>Contact & Notes</span>
                        <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                    </button>
                    <div class="accordion-content mt-2 pl-2 space-y-1 border-l-2 ml-1">
                        ${formatField('Email', client.contact?.email)}
                        ${formatField('Phone', client.contact?.phone)}
                        ${formatTextarea('Address', client.contact?.address)}
                        ${formatTextarea('Accounts', client.accounts)}
                        ${formatTextarea('Beneficiaries', client.beneficiaries)}
                        ${formatTextarea('Notes', client.notes)}
                    </div>
                </div>

                <div class="mt-3 pt-3 border-t border-slate-100">
                    <button class="accordion-toggle-btn flex items-center justify-between w-full text-sm font-semibold text-midnight">
                        <span>Associated Tasks</span>
                        <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                    </button>
                    <div class="accordion-content mt-2 pl-2 space-y-1 border-l-2 ml-1">
                        ${tasksHtml}
                    </div>
                </div>

                <div class="mt-4 pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                </div>
            </div>
        `;
        
        clientWrapper.querySelectorAll('.accordion-toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const content = btn.nextElementSibling;
                btn.classList.toggle('is-open');
                content.classList.toggle('is-open');
            });
        });

        // Add event listeners for clickable task links
        clientWrapper.querySelectorAll('.associated-task-item a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const taskId = e.currentTarget.dataset.taskId;
                const taskToEdit = state.allTasks.find(t => t.id === taskId);
                if (taskToEdit) {
                    openEditModal(taskToEdit);
                } else {
                    alert('Task details could not be found.');
                }
            });
        });

        const actionButtonContainer = clientWrapper.querySelector('.mt-4.pt-4.border-t');
        const editBtn = document.createElement('button');
        editBtn.className = 'text-sm font-semibold text-slate-500 hover:text-midnight transition-colors';
        editBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
        editBtn.addEventListener('click', () => handlers.onEditClick(client));

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'text-sm font-semibold text-slate-500 hover:text-red-600 transition-colors';
        deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;
        deleteBtn.addEventListener('click', () => handlers.onDeleteClick(client.id, client.name));
        
        actionButtonContainer.appendChild(editBtn);
        actionButtonContainer.appendChild(deleteBtn);

        accordionContainer.appendChild(clientWrapper);
    });

    container.appendChild(accordionContainer);
}