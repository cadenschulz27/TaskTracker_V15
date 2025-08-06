import { openEditModal } from './openEditModal.js';

/**
 * Renders the calendar grid based on the selected view (weekly or monthly).
 * @param {Array<object>} tasks - The filtered list of tasks to display.
 * @param {Date} currentCalendarDate - The date to use as a reference for the current week or month.
 * @param {string} view - The current calendar view ('weekly' or 'monthly').
 * @param {object} handlers - An object of callback functions (used for task clicks).
 */
export function renderCalendar(tasks, currentCalendarDate, view, handlers) {
    const calendarGrid = document.getElementById('calendar-grid');
    if (!calendarGrid) {
        console.error("UI Error: Calendar grid element not found.");
        return;
    }

    // Clear previous calendar days, but keep the weekday headers
    const existingDayCells = calendarGrid.querySelectorAll('.calendar-day-cell');
    existingDayCells.forEach(cell => cell.remove());
    
    // Create an array to hold the dates to display
    let datesToDisplay = [];

    if (view === 'weekly') {
        const startOfWeek = new Date(currentCalendarDate);
        startOfWeek.setDate(currentCalendarDate.getDate() - currentCalendarDate.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            datesToDisplay.push(day);
        }
    } else { // Monthly view
        const firstDayOfMonth = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), 1);
        const lastDayOfMonth = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 0);

        const startDayOffset = firstDayOfMonth.getDay();
        const totalDaysInMonth = lastDayOfMonth.getDate();
        
        const startDisplayDate = new Date(firstDayOfMonth);
        startDisplayDate.setDate(firstDayOfMonth.getDate() - startDayOffset);

        let totalCells = startDayOffset + totalDaysInMonth;
        if (totalCells <= 35) totalCells = 35;
        else if (totalCells > 35 && totalCells <= 42) totalCells = 42;

        for (let i = 0; i < totalCells; i++) {
            const day = new Date(startDisplayDate);
            day.setDate(startDisplayDate.getDate() + i);
            datesToDisplay.push(day);
        }
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    datesToDisplay.forEach(day => {
        const dayString = day.toISOString().split('T')[0];
        const dayCell = document.createElement('div');
        let cellClasses = 'calendar-day-cell p-2 border border-slate-100 flex flex-col min-h-[120px] relative overflow-hidden ';

        // Check if the day is in the current month for monthly view
        if (view === 'monthly' && day.getMonth() !== currentCalendarDate.getMonth()) {
            cellClasses += 'bg-slate-50 text-slate-400';
        } else {
            cellClasses += 'bg-white';
        }
        dayCell.className = cellClasses;

        // Highlight today's date
        if (day.getTime() === today.getTime()) {
            dayCell.innerHTML = `<div class="text-sm md:text-md font-bold text-midnight mb-2 text-right">${day.getDate()}</div>`;
            dayCell.classList.add('bg-sky-100', 'rounded-lg');
        } else {
             dayCell.innerHTML = `<div class="text-sm md:text-md font-semibold text-slate-700 mb-2 text-right">${day.getDate()}</div>`;
        }
        
        const tasksForDayContainer = document.createElement('div');
        tasksForDayContainer.className = 'tasks-for-day flex flex-col gap-1 w-full text-left';
        
        const tasksDueToday = tasks.filter(task => task.dueDate === dayString);

        if (tasksDueToday.length > 0) {
            tasksDueToday.forEach(task => {
                const taskElement = document.createElement('div');
                const isCompleted = task.status === 'Completed';
                
                // NEW: Priority color styles
                const priorityStyles = {
                    High: 'background-color: #FFF9E9; border-left: 3px solid #FFC828;',
                    Medium: 'background-color: #F0F8FF; border-left: 3px solid #C1E0F9;',
                    Low: 'background-color: #F8FAFC; border-left: 3px solid #E2E8F0;'
                };

                taskElement.style.cssText = priorityStyles[task.priority] || priorityStyles['Low'];
                taskElement.className = `task-item text-xs p-1.5 rounded cursor-pointer truncate ${isCompleted ? 'line-through opacity-60' : ''}`;
                
                taskElement.innerHTML = `<div class="font-semibold text-ink truncate">${task.name}</div>`;

                taskElement.addEventListener('click', () => openEditModal(task));

                tasksForDayContainer.appendChild(taskElement);
            });
        }
        
        dayCell.appendChild(tasksForDayContainer);
        calendarGrid.appendChild(dayCell);
    });
}