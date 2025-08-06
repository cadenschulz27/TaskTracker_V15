import { auth } from './firebase/init.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import * as FB_USERS from './firebase/users.js';
import * as FB_TASKS from './firebase/tasks.js';
import * as FB_COMMENTS from './firebase/comments.js';
import * as FB_SUBTASKS from './firebase/subtasks.js';
import * as FB_ACTIVITY from './firebase/activity.js';
import * as FB_ATTACHMENTS from './firebase/attachments.js';
import * as FB_STORAGE from './firebase/storage.js';
import * as FB_NOTIFICATIONS from './firebase/notifications.js';
import * as FB_CHAT from './firebase/chat.js';
import * as FB_CLIENTS from './firebase/clients.js';
import { renderTasks } from './ui/renderTasks.js';
import { renderComments } from './ui/renderComments.js';
import { renderSubtasks } from './ui/renderSubtasks.js';
import { renderActivityLog } from './ui/renderActivityLog.js';
import { renderAttachments } from './ui/renderAttachments.js';
import { renderAnalytics } from './ui/renderAnalytics.js';
import { renderNotifications } from './ui/renderNotifications.js';
import { renderChat } from './ui/renderChat.js';
import { renderClients } from './ui/renderClients.js';
import { triggerConfetti } from './ui/confetti.js';
import { displayCurrentDate } from './ui/displayCurrentDate.js';
import { populateDropdown } from './ui/populateDropdown.js';
import { populateFilter } from './ui/populateFilter.js';
import { resetTaskModal } from './ui/resetTaskModal.js';
import { renderCalendar } from './ui/renderCalendar.js';
import { openEditModal } from './ui/openEditModal.js';
import { parseSpreadsheet } from './ui/spreadsheetParser.js';
import * as HANDLERS from './handlers.js';
import { showMessageModal, showConfirmationModal } from './ui/modals.js';
import { populateClientDropdown } from './ui/populateClientDropdown.js';
import { setDynamicGreeting, displayQuoteOfTheDay } from './ui/dynamicElements.js';


document.addEventListener('DOMContentLoaded', () => {

    const state = {
        loggedInUser: {},
        allTasks: [],
        allUsers: [],
        chatMessages: [],
        clients: [],
        taskFilters: { searchTerm: '', priority: 'all', assignee: 'all' },
        clientFilters: { searchTerm: '', status: 'all', riskProfile: 'all' },
        globalListeners: [],
        taskDetailListeners: [],
        currentView: 'board',
        currentCalendarView: 'weekly',
        currentCalendarDate: new Date(),
        currentAnalyticsIntern: 'all',
        isLayoutEditing: false,
        notifications: [],
    };

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userDoc = await FB_USERS.getUserData(user.uid);
            if (userDoc.exists()) {
                state.loggedInUser = { id: user.uid, ...userDoc.data() };
                initializeApp();
            } else {
                window.location.href = './index.html';
            }
        } else {
            window.location.href = './index.html';
        }
    });

    async function initializeApp() {
        displayCurrentDate();
        setDynamicGreeting(state.loggedInUser.firstName);
        displayQuoteOfTheDay();

        document.getElementById('welcome-message').textContent = `Logged in as: ${state.loggedInUser.displayName} (${state.loggedInUser.role})`;

        const userAvatar = document.getElementById('user-avatar');
        if (userAvatar) {
            userAvatar.src = state.loggedInUser.photoURL || './images/anonymous_image.png';
        }

        const allUsersSnapshot = await FB_USERS.getAllUsers();
        state.allUsers = allUsersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        populateDropdown(document.getElementById('task-assignee'), state.allUsers, state.loggedInUser);
        populateFilter(document.getElementById('filter-assignee'), state.allUsers);

        HANDLERS.initializeHandlers(state, closeModal);
        setupEventListeners();

        const unsubTasks = FB_TASKS.listenForTasks(state.loggedInUser, tasks => {
            state.allTasks = tasks;
            if (['board', 'calendar', 'dashboard'].includes(state.currentView)) {
                applyTaskFiltersAndRender();
            }
        });
        state.globalListeners.push(unsubTasks);

        const notificationHandlers = {
            onNotificationClick: handleNotificationClick,
            onClearAllClick: () => FB_NOTIFICATIONS.markAllNotificationsAsRead(state.loggedInUser.id),
            onDeleteAllClick: () => {
                showConfirmationModal(
                    "Are you sure you want to permanently delete all notifications? This cannot be undone.",
                    () => FB_NOTIFICATIONS.deleteAllNotifications(state.loggedInUser.id)
                );
            },
        };
        const unsubNotifications = FB_NOTIFICATIONS.listenForNotifications(state.loggedInUser.id, notifications => {
            state.notifications = notifications;
            renderNotifications(notifications, notificationHandlers);
        });
        state.globalListeners.push(unsubNotifications);

        const unsubChat = FB_CHAT.listenForMessages(newMessages => {
            const isInitialLoad = state.chatMessages.length === 0;
            if (!isInitialLoad && newMessages.length > state.chatMessages.length) {
                const latestMessage = newMessages[newMessages.length - 1];
                const messageText = latestMessage.text.toLowerCase();
                if (messageText.includes('happy birthday') || messageText.includes('hbd')) {
                    for (let i = 0; i < 10; i++) {
                        setTimeout(() => triggerConfetti(), i * 200);
                    }
                }
            }
            state.chatMessages = newMessages;
            if (state.currentView === 'chat') {
                renderChat(state.chatMessages, state.loggedInUser, state.allUsers);
            }
        });
        state.globalListeners.push(unsubChat);
        
        const unsubClients = FB_CLIENTS.listenForClients(clients => {
            state.clients = clients;
            populateClientDropdown(document.getElementById('task-client'), state.clients);
            
            if (state.currentView === 'clients') {
                applyClientFiltersAndRender();
            }
        });
        state.globalListeners.push(unsubClients);

        switchView(state.currentView);
    }
    
    function handleNotificationClick(notification) {
        if (!notification.read) FB_NOTIFICATIONS.markNotificationAsRead(state.loggedInUser.id, notification.id);
        document.getElementById('notifications-dropdown').classList.add('hidden');
        if (notification.type === 'task_deleted') {
            showMessageModal(`This notification is for a task ("${notification.taskName}") that has been deleted.`);
            return;
        }
        const taskElement = document.querySelector(`.task-card[data-id="${notification.taskId}"]`);
        if (taskElement) {
            taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            taskElement.style.transition = 'box-shadow 0.3s ease-in-out';
            taskElement.style.boxShadow = '0 0 15px 5px rgba(59, 130, 246, 0.4)';
            const detailsView = taskElement.querySelector('.details-view');
            if (detailsView.classList.contains('hidden')) {
                taskElement.querySelector('.expand-btn').click();
            }
            setTimeout(() => { taskElement.style.boxShadow = ''; }, 2000);
        } else {
            showMessageModal(`Task "${notification.taskName}" was not found on the current board. It may be filtered out or on another view.`);
        }
    }

    const taskModal = document.getElementById('task-modal');
    const modalPanel = taskModal.querySelector('.modal-panel');
    const clientModal = document.getElementById('client-modal');
    const clientModalPanel = clientModal.querySelector('.modal-panel');

    function openModal() {
        resetTaskModal();
        taskModal.classList.remove('modal-hidden');
        taskModal.classList.add('modal-visible');
        requestAnimationFrame(() => {
            taskModal.classList.remove('opacity-0');
            modalPanel.classList.remove('opacity-0');
        });
    }

    function closeModal() {
        taskModal.classList.add('opacity-0');
        modalPanel.classList.add('opacity-0');
        setTimeout(() => {
            taskModal.classList.add('modal-hidden');
            taskModal.classList.remove('modal-visible');
            resetTaskModal();
        }, 200);
    }

    function openClientModal(client = null) {
        const form = document.getElementById('client-form');
        const title = document.getElementById('client-modal-title');
        const submitBtn = document.getElementById('client-modal-submit-btn');
        form.reset();
        
        const phoneInput = document.getElementById('client-phone');
        let errorContainer = document.getElementById('phone-error-message');
        if (!errorContainer) {
            errorContainer = document.createElement('p');
            errorContainer.id = 'phone-error-message';
            errorContainer.className = 'text-red-600 text-xs mt-1';
            phoneInput.parentNode.appendChild(errorContainer);
        }
        errorContainer.textContent = '';

        if (client) {
            form.dataset.mode = 'edit';
            form.dataset.clientId = client.id;
            title.textContent = 'Edit Client';
            submitBtn.textContent = 'Save Changes';
            form.elements['name'].value = client.name || '';
            form.elements['status'].value = client.status || 'Prospect';
            form.elements['clientSince'].value = client.clientSince || '';
            form.elements['birthday'].value = client.personal?.birthday || '';
            form.elements['age'].value = client.personal?.age || '';
            form.elements['email'].value = client.contact?.email || '';
            form.elements['phone'].value = client.contact?.phone || '';
            form.elements['address'].value = client.contact?.address || '';
            form.elements['assignedHousehold'].value = client.financials?.assignedHousehold || '';
            form.elements['feeSchedule'].value = client.financials?.feeSchedule || '';
            form.elements['riskProfile'].value = client.financials?.riskProfile || 'Moderate';
            form.elements['accounts'].value = client.accounts || '';
            form.elements['beneficiaries'].value = client.beneficiaries || '';
            form.elements['notes'].value = client.notes || '';
        } else {
            form.dataset.mode = 'create';
            delete form.dataset.clientId;
            title.textContent = 'Add New Client';
            submitBtn.textContent = 'Add Client';
        }
        
        clientModal.classList.remove('modal-hidden');
        clientModal.classList.add('modal-visible');
        requestAnimationFrame(() => {
            clientModal.classList.remove('opacity-0');
            clientModalPanel.classList.remove('opacity-0');
        });
    }

    function closeClientModal() {
        clientModal.classList.add('opacity-0');
        clientModalPanel.classList.add('opacity-0');
        setTimeout(() => {
            clientModal.classList.add('modal-hidden');
            clientModal.classList.remove('modal-visible');
        }, 200);
    }

    function handleLogout() {
        state.globalListeners.forEach(unsub => unsub());
        state.taskDetailListeners.forEach(unsub => unsub());
        signOut(auth);
    }
    
    function handleChatFormSubmit(e) {
        e.preventDefault();
        const chatInput = document.getElementById('chat-input');
        const messageText = chatInput.value.trim();
        if (messageText) {
            FB_CHAT.sendMessage({
                text: messageText,
                authorId: state.loggedInUser.id,
                authorName: state.loggedInUser.displayName,
                authorPhotoURL: state.loggedInUser.photoURL || null
            });
            chatInput.value = '';
        }
    }
    
    async function handleClientFormSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const phoneInput = form.elements['phone'];
        const phoneError = document.getElementById('phone-error-message');
        
        const rawPhone = phoneInput.value.replace(/\D/g, '');
        if (phoneInput.value && rawPhone.length > 0 && rawPhone.length !== 11) {
            phoneError.textContent = 'Phone number must contain exactly 10 digits.';
            return;
        }

        const clientData = {
            name: form.elements['name'].value,
            status: form.elements['status'].value,
            clientSince: form.elements['clientSince'].value,
            personal: {
                birthday: form.elements['birthday'].value,
                age: form.elements['age'].value,
            },
            contact: {
                email: form.elements['email'].value,
                phone: phoneInput.value,
                address: form.elements['address'].value,
            },
            financials: {
                assignedHousehold: form.elements['assignedHousehold'].value,
                feeSchedule: form.elements['feeSchedule'].value,
                riskProfile: form.elements['riskProfile'].value,
            },
            accounts: form.elements['accounts'].value,
            beneficiaries: form.elements['beneficiaries'].value,
            notes: form.elements['notes'].value,
        };

        try {
            if (form.dataset.mode === 'edit') {
                await FB_CLIENTS.updateClient(form.dataset.clientId, clientData);
            } else {
                await FB_CLIENTS.addClient(clientData);
            }
            closeClientModal();
        } catch (error) {
            console.error("Error saving client:", error);
            showMessageModal("Failed to save client details.");
        }
    }

    function handleDeleteClient(clientId, clientName) {
        showConfirmationModal(`Are you sure you want to delete the client "${clientName}"? This action cannot be undone.`, async () => {
            try {
                await FB_CLIENTS.deleteClient(clientId);
            } catch (error) {
                console.error("Error deleting client:", error);
                showMessageModal("Failed to delete client.");
            }
        });
    }
    
    async function handleSpreadsheetUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        showMessageModal("Parsing spreadsheet... Please wait.");
        try {
            const clients = await parseSpreadsheet(file);
            if (clients.length === 0) {
                showMessageModal("No clients with a 'Name' found in the spreadsheet.");
                return;
            }
            showConfirmationModal(`Found ${clients.length} clients in the file. Do you want to import them?`, async () => {
                try {
                    await FB_CLIENTS.addMultipleClients(clients);
                    showMessageModal("Successfully imported all new clients!");
                } catch (dbError) {
                    console.error("Database error during batch import:", dbError);
                    showMessageModal(`Error: Could not save clients to the database. ${dbError.message}`);
                }
            });
        } catch (parseError) {
            console.error("Parsing error:", parseError);
            showMessageModal(`Error reading spreadsheet: ${parseError.message}`);
        } finally {
            event.target.value = '';
        }
    }

    function setupEventListeners() {
        document.getElementById('new-task-btn')?.addEventListener('click', openModal);
        document.getElementById('close-modal-btn')?.addEventListener('click', closeModal);
        document.getElementById('task-form')?.addEventListener('submit', HANDLERS.handleTaskFormSubmit);

        document.getElementById('new-client-btn')?.addEventListener('click', () => openClientModal());
        document.getElementById('close-client-modal-btn')?.addEventListener('click', closeClientModal);
        document.getElementById('client-form')?.addEventListener('submit', handleClientFormSubmit);
        
        document.getElementById('import-clients-btn')?.addEventListener('click', () => {
            document.getElementById('client-spreadsheet-input').click();
        });
        document.getElementById('client-spreadsheet-input')?.addEventListener('change', handleSpreadsheetUpload);

        const phoneInput = document.getElementById('client-phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                const input = e.target;
                const errorContainer = document.getElementById('phone-error-message');
                errorContainer.textContent = '';
                if (/[^0-9-()+ ]/.test(input.value)) {
                    errorContainer.textContent = 'Phone number cannot contain letters or symbols.';
                }
                const rawValue = input.value;
                let userDigits = rawValue.replace(/\D/g, '');
                if (rawValue.startsWith('+1') && userDigits.startsWith('1')) {
                    userDigits = userDigits.substring(1);
                }
                userDigits = userDigits.substring(0, 10);
                const areaCode = userDigits.substring(0, 3);
                const middle = userDigits.substring(3, 6);
                const last = userDigits.substring(6, 10);
                if (userDigits.length > 6) {
                    input.value = `+1 (${areaCode}) ${middle}-${last}`;
                } else if (userDigits.length > 3) {
                    input.value = `+1 (${areaCode}) ${middle}`;
                } else if (userDigits.length > 0) {
                    input.value = `+1 (${areaCode})`;
                } else {
                    input.value = '';
                }
            });
        }

        document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
        
        document.getElementById('global-search-input')?.addEventListener('input', (e) => {
            state.taskFilters.searchTerm = e.target.value;
            applyTaskFiltersAndRender();
        });
        document.getElementById('filter-priority')?.addEventListener('change', (e) => { 
            state.taskFilters.priority = e.target.value; 
            applyTaskFiltersAndRender(); 
        });
        document.getElementById('filter-assignee')?.addEventListener('change', (e) => { 
            state.taskFilters.assignee = e.target.value; 
            applyTaskFiltersAndRender(); 
        });

        document.getElementById('client-search-input')?.addEventListener('input', (e) => {
            state.clientFilters.searchTerm = e.target.value;
            applyClientFiltersAndRender();
        });
        document.getElementById('filter-client-status')?.addEventListener('change', (e) => {
            state.clientFilters.status = e.target.value;
            applyClientFiltersAndRender();
        });
        document.getElementById('filter-client-risk')?.addEventListener('change', (e) => {
            state.clientFilters.riskProfile = e.target.value;
            applyClientFiltersAndRender();
        });

        document.getElementById('tab-board-btn')?.addEventListener('click', () => switchView('board'));
        document.getElementById('tab-calendar-btn')?.addEventListener('click', () => switchView('calendar'));
        document.getElementById('tab-dashboard-btn')?.addEventListener('click', () => switchView('dashboard'));
        document.getElementById('tab-chat-btn')?.addEventListener('click', () => switchView('chat'));
        document.getElementById('tab-clients-btn')?.addEventListener('click', () => switchView('clients'));
        
        document.getElementById('chat-form')?.addEventListener('submit', handleChatFormSubmit);
        document.getElementById('weekly-view-btn')?.addEventListener('click', () => switchCalendarView('weekly'));
        document.getElementById('monthly-view-btn')?.addEventListener('click', () => switchCalendarView('monthly'));
        document.getElementById('prev-btn')?.addEventListener('click', () => navigateCalendar('prev'));
        document.getElementById('next-btn')?.addEventListener('click', () => navigateCalendar('next'));
        document.getElementById('analytics-intern-filter')?.addEventListener('change', (e) => {
            state.currentAnalyticsIntern = e.target.value;
            renderRoleBasedAnalytics();
        });
        document.getElementById('edit-layout-btn')?.addEventListener('click', toggleLayoutEditing);
        
        document.getElementById('client-filter-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            document.getElementById('client-filter-dropdown').classList.toggle('hidden');
        });

        document.getElementById('notifications-btn')?.addEventListener('click', (e) => {
            e.stopPropagation(); 
            const dropdown = document.getElementById('notifications-dropdown');
            dropdown.classList.toggle('hidden');
        });

        window.addEventListener('click', (e) => {
            const notificationsDropdown = document.getElementById('notifications-dropdown');
            const notificationsBtn = document.getElementById('notifications-btn');
            if (notificationsDropdown && notificationsBtn && !notificationsDropdown.classList.contains('hidden') && !notificationsBtn.contains(e.target) && !notificationsDropdown.contains(e.target)) {
                notificationsDropdown.classList.add('hidden');
            }
            
            const clientFilterDropdown = document.getElementById('client-filter-dropdown');
            const clientFilterBtn = document.getElementById('client-filter-btn');
            if (clientFilterDropdown && clientFilterBtn && !clientFilterDropdown.classList.contains('hidden') && !clientFilterBtn.contains(e.target) && !clientFilterDropdown.contains(e.target)) {
                clientFilterDropdown.classList.add('hidden');
            }
        });

        const columns = ['tasks-not-started', 'tasks-in-progress', 'tasks-completed'];
        columns.forEach(id => {
            const column = document.getElementById(id);
            if (column) {
                column.addEventListener('dragover', e => { e.preventDefault(); column.classList.add('bg-slate-200'); });
                column.addEventListener('dragleave', () => column.classList.remove('bg-slate-200'));
                column.addEventListener('drop', e => {
                    e.preventDefault();
                    column.classList.remove('bg-slate-200');
                    const taskId = e.dataTransfer.getData('text/plain');
                    const newStatus = id.split('-').slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                    if (newStatus === 'Completed') triggerConfetti();
                    FB_TASKS.updateTaskStatusOnDrop(taskId, newStatus, state.loggedInUser);
                });
            }
        });
        
        const personalTaskToggle = document.getElementById('task-personal');
        if (personalTaskToggle) {
            const assigneeWrapper = document.getElementById('assignee-wrapper');
            const taskAssigneeSelect = document.getElementById('task-assignee');
            personalTaskToggle.addEventListener('change', (e) => {
                const isPersonal = e.target.checked;
                if (assigneeWrapper && taskAssigneeSelect) {
                    assigneeWrapper.classList.toggle('hidden', isPersonal);
                    taskAssigneeSelect.required = !isPersonal;
                }
            });
        }
        
        const gridContainer = document.getElementById('dashboard-grid');
        if (gridContainer) {
            const panels = gridContainer.querySelectorAll('.dashboard-panel');
            panels.forEach(panel => {
                panel.addEventListener('dragstart', () => panel.classList.add('dragging'));
                panel.addEventListener('dragend', () => panel.classList.remove('dragging'));
            });
            gridContainer.addEventListener('dragover', e => {
                if (state.isLayoutEditing) {
                    e.preventDefault();
                    const afterElement = getDragAfterElement(gridContainer, e.clientY);
                    const dragging = document.querySelector('.dragging');
                    if (dragging) {
                        if (afterElement == null) {
                            gridContainer.appendChild(dragging);
                        } else {
                            gridContainer.insertBefore(dragging, afterElement);
                        }
                    }
                }
            });
        }
    }
    function toggleLayoutEditing() {
        state.isLayoutEditing = !state.isLayoutEditing;
        const dashboardGrid = document.getElementById('dashboard-grid');
        const editLayoutBtn = document.getElementById('edit-layout-btn');
        const dashboardPanels = dashboardGrid.querySelectorAll('.dashboard-panel');
        if (state.isLayoutEditing) {
            dashboardGrid.classList.add('layout-editing-mode');
            editLayoutBtn.textContent = 'Done Editing';
            editLayoutBtn.classList.remove('bg-slate-200', 'hover:bg-slate-300');
            editLayoutBtn.classList.add('bg-midnight', 'text-white', 'hover:bg-midnight-dark');
            dashboardPanels.forEach(panel => {
                panel.draggable = true;
                panel.addEventListener('dragstart', () => panel.classList.add('dragging'));
                panel.addEventListener('dragend', () => panel.classList.remove('dragging'));
            });
        } else {
            dashboardGrid.classList.remove('layout-editing-mode');
            editLayoutBtn.textContent = 'Edit Layout';
            editLayoutBtn.classList.remove('bg-midnight', 'text-white', 'hover:bg-midnight-dark');
            editLayoutBtn.classList.add('bg-slate-200', 'hover:bg-slate-300');
            dashboardPanels.forEach(panel => {
                panel.draggable = false;
                panel.classList.remove('dragging');
            });
        }
    }

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.dashboard-panel:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    function switchView(viewName) {
        state.currentView = viewName;
        const taskFilters = document.getElementById('task-filters');
        const clientFilters = document.getElementById('client-filters');

        document.getElementById('task-board-view').classList.toggle('hidden', viewName !== 'board');
        document.getElementById('calendar-view').classList.toggle('hidden', viewName !== 'calendar');
        document.getElementById('analytics-view').classList.toggle('hidden', viewName !== 'dashboard');
        document.getElementById('chat-view').classList.toggle('hidden', viewName !== 'chat');
        document.getElementById('clients-view').classList.toggle('hidden', viewName !== 'clients');
        
        document.getElementById('tab-board-btn').classList.toggle('active', viewName === 'board');
        document.getElementById('tab-calendar-btn').classList.toggle('active', viewName === 'calendar');
        document.getElementById('tab-dashboard-btn').classList.toggle('active', viewName === 'dashboard');
        document.getElementById('tab-chat-btn').classList.toggle('active', viewName === 'chat');
        document.getElementById('tab-clients-btn').classList.toggle('active', viewName === 'clients');
        
        const isTaskView = ['board', 'calendar'].includes(viewName);
        taskFilters.classList.toggle('hidden', !isTaskView);
        clientFilters.classList.toggle('hidden', viewName !== 'clients');

        if (viewName === 'chat') {
            renderChat(state.chatMessages, state.loggedInUser, state.allUsers);
        } else if (viewName === 'clients') {
            applyClientFiltersAndRender();
        } else {
            applyTaskFiltersAndRender();
        }
    }
    
    function renderRoleBasedAnalytics() {
        const analyticsTitle = document.getElementById('analytics-title');
        const internFilterWrapper = document.getElementById('analytics-filter-wrapper');
        if (!analyticsTitle || !internFilterWrapper) return;
        const userRole = state.loggedInUser.role;
        let tasksToAnalyze = [];
        if (userRole === 'Intern') {
            analyticsTitle.textContent = 'My Personal Dashboard';
            internFilterWrapper.classList.add('hidden');
            tasksToAnalyze = state.allTasks.filter(t => t.assignedToId === state.loggedInUser.id);
        } else if (userRole === 'Advisor' || userRole === 'WMA') {
            internFilterWrapper.classList.remove('hidden');
            const internFilter = document.getElementById('analytics-intern-filter');
            if (internFilter && internFilter.options.length <= 1) {
                internFilter.innerHTML = '<option value="all">All Interns</option>';
                const interns = state.allUsers.filter(u => u.role === 'Intern');
                interns.forEach(intern => {
                    const option = document.createElement('option');
                    option.value = intern.id;
                    option.textContent = intern.displayName;
                    internFilter.appendChild(option);
                });
            }
            const internIds = state.allUsers.filter(u => u.role === 'Intern').map(u => u.id);
            let relevantTasks = state.allTasks.filter(t => internIds.includes(t.assignedToId));
            if (state.currentAnalyticsIntern === 'all') {
                analyticsTitle.textContent = 'Collaborative Dashboard - All Interns';
                tasksToAnalyze = relevantTasks;
            } else {
                const selectedIntern = state.allUsers.find(u => u.id === state.currentAnalyticsIntern);
                analyticsTitle.textContent = `Collaborative Dashboard - ${selectedIntern?.displayName || '...'}`;
                tasksToAnalyze = relevantTasks.filter(t => t.assignedToId === state.currentAnalyticsIntern);
            }
        }
        renderAnalytics(tasksToAnalyze, state.allUsers);
    }

    function switchCalendarView(viewName) {
        state.currentCalendarView = viewName;
        document.getElementById('weekly-view-btn').classList.toggle('active', viewName === 'weekly');
        document.getElementById('monthly-view-btn').classList.toggle('active', viewName === 'monthly');
        applyTaskFiltersAndRender();
    }
    
    function navigateCalendar(direction) {
        const current = state.currentCalendarDate;
        const newDate = new Date(current);
        if (state.currentCalendarView === 'weekly') {
            newDate.setDate(direction === 'prev' ? current.getDate() - 7 : current.getDate() + 7);
        } else {
            newDate.setMonth(direction === 'prev' ? current.getMonth() - 1 : current.getMonth() + 1);
        }
        state.currentCalendarDate = newDate;
        applyTaskFiltersAndRender();
    }

    function setCalendarHeaderTitle(date, view) {
        const titleElement = document.getElementById('calendar-header-title');
        if (!titleElement) return;
        if (view === 'monthly') {
            titleElement.textContent = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        } else {
            const startOfWeek = new Date(date);
            startOfWeek.setDate(date.getDate() - startOfWeek.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            const startMonth = startOfWeek.toLocaleDateString('en-US', { month: 'short' });
            const startDay = startOfWeek.getDate();
            const endMonth = endOfWeek.toLocaleDateString('en-US', { month: 'short' });
            const endDay = endOfWeek.getDate();
            const year = startOfWeek.getFullYear();
            if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
                titleElement.textContent = `${startMonth} ${startDay} - ${endDay}, ${year}`;
            } else {
                titleElement.textContent = `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
            }
        }
    }
    
    function applyTaskFiltersAndRender() {
        let filteredTasks = [...state.allTasks];
        if (state.taskFilters.searchTerm) {
            const searchTerm = state.taskFilters.searchTerm.toLowerCase().trim();
            filteredTasks = filteredTasks.filter(task =>
                task.name.toLowerCase().includes(searchTerm) ||
                (task.description && task.description.toLowerCase().includes(searchTerm))
            );
        }
        if (state.taskFilters.priority !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.priority === state.taskFilters.priority);
        }
        if (state.taskFilters.assignee !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.assignedToId === state.taskFilters.assignee);
        }
        filteredTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        
        const taskActionHandlers = {
            claimTask: (taskId) => FB_TASKS.claimTask(taskId, state.loggedInUser.id, state.loggedInUser.displayName),
            deleteTask: HANDLERS.handleDeleteTask,
            openEditModal: openEditModal,
            addSubtask: HANDLERS.handleAddSubtask,
            addComment: HANDLERS.handleAddComment,
            uploadAttachment: HANDLERS.handleUploadAttachment,
            listenForAttachments: (taskId) => {
                const unsub = FB_ATTACHMENTS.listenForAttachments(taskId, renderAttachments);
                state.taskDetailListeners.push(unsub);
            },
            listenForComments: (taskId) => {
                const unsub = FB_COMMENTS.listenForComments(taskId, renderComments);
                state.taskDetailListeners.push(unsub);
            },
            listenForSubtasks: (taskId) => {
                const unsub = FB_SUBTASKS.listenForSubtasks(taskId, (id, subtasks) => {
                    renderSubtasks(id, subtasks, FB_SUBTASKS.updateSubtaskStatus, HANDLERS.handleDeleteSubtask);
                });
                state.taskDetailListeners.push(unsub);
            },
            listenForActivity: (taskId) => {
                const unsub = FB_ACTIVITY.listenForActivity(taskId, renderActivityLog);
                state.taskDetailListeners.push(unsub);
            },
            clearTaskDetailListeners: () => {
                state.taskDetailListeners.forEach(unsub => unsub());
                state.taskDetailListeners = [];
            }
        };

        if (state.currentView === 'board') {
            renderTasks(filteredTasks, state, taskActionHandlers);
        } else if (state.currentView === 'calendar') {
            renderCalendar(filteredTasks, state.currentCalendarDate, state.currentCalendarView, taskActionHandlers);
            setCalendarHeaderTitle(state.currentCalendarDate, state.currentCalendarView);
        } else if (state.currentView === 'dashboard') {
            renderRoleBasedAnalytics();
        }
    }

    function applyClientFiltersAndRender() {
        let filteredClients = [...state.clients];

        if (state.clientFilters.searchTerm) {
            const searchTerm = state.clientFilters.searchTerm.toLowerCase().trim();
            filteredClients = filteredClients.filter(client => 
                client.name.toLowerCase().includes(searchTerm) ||
                (client.contact?.email && client.contact.email.toLowerCase().includes(searchTerm)) ||
                (client.contact?.phone && client.contact.phone.includes(searchTerm))
            );
        }

        if (state.clientFilters.status !== 'all') {
            filteredClients = filteredClients.filter(client => client.status === state.clientFilters.status);
        }

        if (state.clientFilters.riskProfile !== 'all') {
            filteredClients = filteredClients.filter(client => client.financials?.riskProfile === state.clientFilters.riskProfile);
        }

        const clientActionHandlers = {
            onEditClick: openClientModal,
            onDeleteClick: handleDeleteClient,
        };
        
        renderClients(filteredClients, state, clientActionHandlers);
    }
});
