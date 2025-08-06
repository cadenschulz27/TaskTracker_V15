/**
 * Updates the circular SVG progress bar and its text label.
 * @param {number} completedCount - The number of tasks that are complete.
 * @param {number} totalCount - The total number of tasks being displayed.
 */
export function updateProgressBar(completedCount, totalCount) {
    // Get the SVG circle and the text element from the page.
    const progressRing = document.getElementById('progress-ring-circle');
    const progressText = document.getElementById('progress-text');

    if (!progressRing || !progressText) {
        console.error("UI Error: Could not find progress bar elements.");
        return;
    }

    // Calculate the radius and circumference of the circle.
    const radius = progressRing.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;

    // Set the stroke-dasharray to create the "gap" in the circle's stroke.
    progressRing.style.strokeDasharray = `${circumference} ${circumference}`;

    // If there are no tasks, reset the progress bar to 0%.
    if (totalCount === 0) {
        progressText.textContent = '0%';
        progressRing.style.strokeDashoffset = circumference;
        return;
    }

    // Calculate the completion percentage.
    const percentage = Math.round((completedCount / totalCount) * 100);
    // Calculate the dash offset to visually represent the percentage.
    const offset = circumference - (percentage / 100) * circumference;

    // Apply the offset to the circle and update the text label.
    progressRing.style.strokeDashoffset = offset;
    progressText.textContent = `${percentage}%`;
}