import { formatTimestamp } from './formatTimestamp.js';

/**
 * Maps a notification type to a styled HTML tag.
 * @param {string} type - The notification type (e.g., 'new_comment').
 * @returns {string} The HTML string for the tag.
 */
function getNotificationTag(type) {
    const tagMap = {
        'new_task_assigned': { text: 'New Task', class: 'tag-new' },
        'new_task_unclaimed': { text: 'New Task', class: 'tag-new' },
        'task_claimed': { text: 'Claimed', class: 'tag-new' },
        'new_comment': { text: 'Comment', class: 'tag-comment' },
        'new_attachment': { text: 'File', class: 'tag-attachment' },
        'subtask_added': { text: 'Subtask', class: 'tag-subtask' },
        'subtask_completed': { text: 'Subtask', class: 'tag-subtask' },
        'task_status_change': { text: 'Status', class: 'tag-status' },
        'task_edited': { text: 'Edited', class: 'tag-status' },
        'task_deleted': { text: 'Deleted', class: 'tag-delete' },
    };
    const tag = tagMap[type] || { text: 'Update', class: 'tag-delete' };
    return `<span class="notification-tag ${tag.class}">${tag.text}</span>`;
}

/**
 * Renders the notification list in the dropdown.
 * @param {Array<object>} notifications - The array of notification objects.
 * @param {object} handlers - An object containing onNotificationClick, onClearAllClick, and onDeleteAllClick callbacks.
 */
export function renderNotifications(notifications, handlers) {
    const dropdown = document.getElementById('notifications-dropdown');
    const listContainer = document.getElementById('notifications-list');
    const countBadge = document.getElementById('notification-count');
    const dropdownHeader = dropdown.querySelector('.p-4.border-b');

    if (!listContainer || !countBadge || !dropdownHeader) {
        console.error("UI Error: Notification elements not found in the DOM.");
        return;
    }
    
    // --- Add "Clear All" button (Mark as Read) ---
    if (!dropdownHeader.querySelector('#clear-notifications-btn')) {
        const clearBtn = document.createElement('button');
        clearBtn.id = 'clear-notifications-btn';
        clearBtn.className = 'text-xs font-semibold text-midnight hover:underline';
        clearBtn.textContent = 'Mark all as read';
        clearBtn.style.float = 'right';
        clearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            handlers.onClearAllClick();
        });
        dropdownHeader.appendChild(clearBtn);
    }
    
    const unreadCount = notifications.filter(n => !n.read).length;
    countBadge.textContent = unreadCount > 0 ? unreadCount : '';
    countBadge.classList.toggle('hidden', unreadCount === 0);

    listContainer.innerHTML = ''; // Clear previous items

    if (notifications.length === 0) {
        listContainer.innerHTML = '<div class="p-4 text-sm text-slate-500">No new notifications.</div>';
    } else {
        notifications.forEach(notification => {
            const item = document.createElement('a');
            item.href = "#";
            item.className = 'block p-3 hover:bg-slate-50 transition duration-150 border-l-4';
            item.style.borderColor = notification.read ? 'transparent' : '#3B82F6';

            const tagHtml = getNotificationTag(notification.type);
            item.innerHTML = `
                <div class="flex items-center justify-between mb-1">
                    ${tagHtml}
                    <p class="text-xs text-slate-400">${formatTimestamp(notification.timestamp)}</p>
                </div>
                <p class="text-sm text-ink">${notification.text}</p>
            `;
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                handlers.onNotificationClick(notification);
            });
            listContainer.appendChild(item);
        });
    }

    // --- Add "Delete All" button container and logic ---
    let deleteBtnContainer = dropdown.querySelector('#delete-all-container');
    if (!deleteBtnContainer) {
        deleteBtnContainer = document.createElement('div');
        deleteBtnContainer.id = 'delete-all-container';
        deleteBtnContainer.className = 'p-2 text-center border-t border-slate-200';
        deleteBtnContainer.innerHTML = `<button id="delete-all-notifications-btn" class="text-xs font-semibold text-red-600 hover:underline">Delete All Notifications</button>`;
        dropdown.appendChild(deleteBtnContainer);

        deleteBtnContainer.querySelector('#delete-all-notifications-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            handlers.onDeleteAllClick();
        });
    }
    
    deleteBtnContainer.style.display = 'none'; // Always hide initially
    deleteBtnContainer.classList.toggle('hidden', notifications.length === 0);
    
    // --- CORRECTED LOGIC for showing the delete button ---
    // We need a slight delay for the browser to render the new list and calculate the correct scrollHeight.
    setTimeout(() => {
        const isScrollable = dropdown.scrollHeight > dropdown.clientHeight;

        if (!isScrollable && notifications.length > 0) {
            // If the list is not scrollable (and not empty), show the button immediately.
            deleteBtnContainer.style.display = 'block';
        } else {
            // Otherwise, hide it and let the scroll listener handle it.
            deleteBtnContainer.style.display = 'none';
        }

        dropdown.onscroll = () => {
            if (dropdown.scrollHeight - dropdown.scrollTop <= dropdown.clientHeight + 1) {
                deleteBtnContainer.style.display = 'block';
            } else {
                deleteBtnContainer.style.display = 'none';
            }
        };
    }, 100); // A 100ms delay is usually sufficient.
}