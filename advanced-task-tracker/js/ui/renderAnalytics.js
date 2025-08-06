const charts = {};

function destroyChart(chartId) {
    if (charts[chartId]) {
        charts[chartId].destroy();
        delete charts[chartId];
    }
}

/**
 * Converts milliseconds into a formatted string: "Xd Yh Zm Ws"
 * @param {number} milliseconds - The duration in milliseconds.
 * @returns {string} The formatted duration string.
 */
function formatMillisToDHMS(milliseconds) {
    if (isNaN(milliseconds) || milliseconds < 0) return 'N/A';
    if (milliseconds === 0) return '0s';

    let seconds = Math.floor(milliseconds / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
    let days = Math.floor(hours / 24);

    seconds %= 60;
    minutes %= 60;
    hours %= 24;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);

    return parts.join(' ') || '< 1s';
}


export function renderAnalytics(tasks, users) {
    destroyChart('progress-chart'); // Note: This ID does not exist in app.html
    destroyChart('status-chart');
    destroyChart('assignee-chart');
    destroyChart('velocity-chart');

    // Destroy specific charts that are now being added/re-rendered
    destroyChart('overdue-chart');
    destroyChart('workload-chart');
    destroyChart('on-time-chart');
    destroyChart('busiest-day-chart'); // ADDED: Destroy this chart too


    const completedTasks = tasks.filter(t => t.status === 'Completed');
    const inProgressTasks = tasks.filter(t => t.status === 'In Progress');
    const notStartedTasks = tasks.filter(t => t.status === 'Not Started');

    const completedCount = completedTasks.length;
    const inProgressCount = inProgressTasks.length;
    const notStartedCount = notStartedTasks.length;

    // --- Chart 1: Tasks by Status (Bar Chart) ---
    const statusCtx = document.getElementById('status-chart')?.getContext('2d');
    if (statusCtx) {
        charts['status-chart'] = new Chart(statusCtx, {
            type: 'bar',
            data: {
                labels: ['Not Started', 'In Progress', 'Completed'],
                datasets: [{
                    label: 'Task Count',
                    data: [notStartedCount, inProgressCount, completedCount],
                    backgroundColor: ['#64748B', '#FBBF24', '#22C55E']
                }]
            },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
        });
    }

    // --- CHART: Overdue Tasks by Assignee ---
    const overdueTasks = tasks.filter(task => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(task.dueDate + 'T00:00:00');
        return dueDate < today && task.status !== 'Completed';
    });

    const overdueByAssignee = overdueTasks.reduce((acc, task) => {
        const assigneeName = task.assignedToName || 'Unassigned';
        acc[assigneeName] = (acc[assigneeName] || 0) + 1;
        return acc;
    }, {});

    const overdueCtx = document.getElementById('overdue-chart')?.getContext('2d');
    if (overdueCtx) {
        charts['overdue-chart'] = new Chart(overdueCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(overdueByAssignee),
                datasets: [{
                    label: 'Overdue Tasks',
                    data: Object.values(overdueByAssignee),
                    backgroundColor: '#EF4444' // Red color for overdue
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { x: { beginAtZero: true, ticks: { precision: 0 } } }
            }
        });
    }

    // --- CHART: Task Creation vs. Completion ---
    const weeklyData = {}; // { 'YYYY-MM-DD': { created: X, completed: Y } }

    const getWeekStart = (date) => {
        const d = new Date(date);
        const day = d.getDay(); // 0 for Sunday, 6 for Saturday
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Go back to Monday
        return new Date(d.setDate(diff)).setHours(0, 0, 0, 0);
    };

    tasks.forEach(task => {
        if (task.createdAt) {
            const createdAtDate = task.createdAt.toDate();
            const weekStart = getWeekStart(createdAtDate);
            const weekKey = new Date(weekStart).toISOString().split('T')[0];
            if (!weeklyData[weekKey]) weeklyData[weekKey] = { created: 0, completed: 0 };
            weeklyData[weekKey].created++;
        }
        if (task.completedAt) {
            const completedAtDate = task.completedAt.toDate();
            const weekStart = getWeekStart(completedAtDate);
            const weekKey = new Date(weekStart).toISOString().split('T')[0];
            if (!weeklyData[weekKey]) weeklyData[weekKey] = { created: 0, completed: 0 };
            weeklyData[weekKey].completed++;
        }
    });

    const sortedWeeks = Object.keys(weeklyData).sort();
    const displayWeeks = sortedWeeks.slice(Math.max(0, sortedWeeks.length - 10));

    const creationData = displayWeeks.map(week => weeklyData[week]?.created || 0);
    const completionData = displayWeeks.map(week => weeklyData[week]?.completed || 0);
    const chartLabels = displayWeeks.map(week => new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

    const workloadCtx = document.getElementById('workload-chart')?.getContext('2d');
    if (workloadCtx) {
        charts['workload-chart'] = new Chart(workloadCtx, {
            type: 'line',
            data: {
                labels: chartLabels,
                datasets: [
                    { label: 'Tasks Created', data: creationData, borderColor: '#2C4465', backgroundColor: 'rgba(44, 68, 101, 0.1)', fill: true, tension: 0.2 },
                    { label: 'Tasks Completed', data: completionData, borderColor: '#22C55E', backgroundColor: 'rgba(34, 197, 94, 0.1)', fill: true, tension: 0.2 }
                ]
            },
            options: { responsive: true, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } } }
        });
    }

    // --- CHART: On-Time Completion Rate ---
    const totalCompleted = completedTasks.length;
    const onTimeCompleted = completedTasks.filter(task => {
        const dueDate = new Date(task.dueDate + 'T00:00:00');
        if (!task.completedAt || typeof task.completedAt.toDate !== 'function') return false;
        const completedAtDate = task.completedAt.toDate();
        return completedAtDate <= dueDate;
    }).length;

    const onTimeRate = totalCompleted > 0 ? (onTimeCompleted / totalCompleted) * 100 : 0;

    const onTimeCtx = document.getElementById('on-time-chart')?.getContext('2d');
    if (onTimeCtx) {
        charts['on-time-chart'] = new Chart(onTimeCtx, {
            type: 'doughnut',
            data: {
                labels: ['On-Time', 'Late'],
                datasets: [{
                    data: [onTimeCompleted, totalCompleted - onTimeCompleted],
                    backgroundColor: ['#22C55E', '#EF4444'], // Green for on-time, Red for late
                    borderColor: '#F8FAFC',
                    borderWidth: 4,
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed) {
                                    label += context.parsed + ' tasks (' + (context.parsed / totalCompleted * 100).toFixed(1) + '%)';
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    // --- NEW CHART: Busiest Day of the Week ---
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const tasksPerDay = new Array(7).fill(0); // Initialize counts for each day

    tasks.forEach(task => {
        // Option 1: Busiest day by Due Date
        if (task.dueDate) {
            const dueDate = new Date(task.dueDate + 'T00:00:00');
            tasksPerDay[dueDate.getDay()]++;
        }
        // Option 2: Busiest day by Creation Date (Uncomment if desired)
        // if (task.createdAt && typeof task.createdAt.toDate === 'function') {
        //     const createdAtDate = task.createdAt.toDate();
        //     tasksPerDay[createdAtDate.getDay()]++;
        // }
    });

    const busiestDayCtx = document.getElementById('busiest-day-chart')?.getContext('2d');
    if (busiestDayCtx) {
        charts['busiest-day-chart'] = new Chart(busiestDayCtx, {
            type: 'bar',
            data: {
                labels: daysOfWeek,
                datasets: [{
                    label: 'Tasks Due', // Or 'Tasks Created', depending on which option you choose
                    data: tasksPerDay,
                    backgroundColor: '#4A5568', // A suitable color
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { precision: 0 }
                    }
                }
            }
        });
    }

    // --- CHART: Task Completion Velocity ---
    const completedWithDate = tasks.filter(task => task.completedAt);
    const weeklyCompletions = completedWithDate.reduce((acc, task) => {
        const weekStart = getWeekStart(task.completedAt.toDate());
        const weekKey = new Date(weekStart).toISOString().split('T')[0]; // Use consistent week key
        acc[weekKey] = (acc[weekKey] || 0) + 1;
        return acc;
    }, {});

    const velocityLabels = [];
    const velocityData = [];
    // Ensure we look back from the current week to have consistent labels
    const currentWeekStart = getWeekStart(new Date());
    for (let i = 4; i >= 0; i--) { // Last 5 weeks including current partial week
        const d = new Date(currentWeekStart);
        d.setDate(d.getDate() - (i * 7));
        const weekKey = d.toISOString().split('T')[0];
        const label = new Date(weekKey).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        velocityLabels.push(`Week of ${label}`);
        velocityData.push(weeklyCompletions[weekKey] || 0);
    }

    const velocityCtx = document.getElementById('velocity-chart')?.getContext('2d');
    if (velocityCtx) {
        charts['velocity-chart'] = new Chart(velocityCtx, {
            type: 'line',
            data: { labels: velocityLabels, datasets: [{ label: 'Tasks Completed', data: velocityData, borderColor: '#2C4465', backgroundColor: 'rgba(44, 68, 101, 0.1)', fill: true, tension: 0.2 }] },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } } }
        });
    }

    // --- Metric: Average Task Lifespan by Priority ---
    const tasksWithLifespan = tasks.filter(task => task.createdAt && task.completedAt);
    const lifespansByPriority = tasksWithLifespan.reduce((acc, task) => {
        const priority = task.priority || 'Low';
        const created = task.createdAt && typeof task.createdAt.toMillis === 'function' ? task.createdAt.toMillis() : 0;
        const completed = task.completedAt && typeof task.completedAt.toMillis === 'function' ? task.completedAt.toMillis() : 0;

        if (created && completed) {
            const lifespan = completed - created;

            if (!acc[priority]) {
                acc[priority] = { totalMillis: 0, count: 0 };
            }
            acc[priority].totalMillis += lifespan;
            acc[priority].count++;
        }
        return acc;
    }, {});

    const priorities = ['High', 'Medium', 'Low'];
    priorities.forEach(priority => {
        const el = document.getElementById(`avg-lifespan-${priority.toLowerCase()}`);
        if (el) {
            const data = lifespansByPriority[priority];
            if (data && data.count > 0) {
                const avgMillis = data.totalMillis / data.count;
                el.textContent = formatMillisToDHMS(avgMillis);
            } else {
                el.textContent = 'N/A';
            }
        }
    });
}