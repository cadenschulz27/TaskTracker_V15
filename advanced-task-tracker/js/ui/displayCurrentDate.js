/**
 * Finds the element with the ID 'current-date' and sets its text content
 * to the current date, formatted as 'Weekday, Month Day, Year'.
 */
export function displayCurrentDate() {
    // Find the element on the page where the date should be displayed.
    const dateElement = document.getElementById('current-date');

    // Check if the element actually exists before trying to change it.
    if (dateElement) {
        // Set the element's text to the formatted current date.
        dateElement.textContent = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } else {
        // Log an error if the element isn't found, which helps with debugging.
        console.error("UI Error: The 'current-date' element was not found in the DOM.");
    }
}