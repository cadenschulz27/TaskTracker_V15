import { formatTimestamp } from './formatTimestamp.js';

/**
 * Renders a list of activity log entries into the appropriate container.
 * @param {string} taskId - The ID of the task to which the logs belong.
 * @param {Array<object>} logs - An array of log objects to display.
 */
export function renderActivityLog(taskId, logs) {
    const container = document.getElementById(`activity-list-${taskId}`);
    if (!container) {
        return;
    }

    container.innerHTML = '';

    const reversedLogs = [...logs].reverse();

    reversedLogs.forEach(log => {
        const logElement = document.createElement('div');
        // Decreased vertical padding from py-2 to py-1.5
        logElement.className = 'py-1.5 border-b border-slate-100 last:border-b-0';
        
        // Flipped the order and removed text-right from the timestamp
        logElement.innerHTML = `
            <p class="text-xs text-slate-400">${formatTimestamp(log.timestamp)}</p>
            <p class="text-sm text-slate-700">${log.text}</p>
        `;
        
        container.appendChild(logElement);
    });
}