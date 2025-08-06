/**
 * Populates a select dropdown with a list of all users for filtering tasks.
 * It always includes an "All Assignees" option.
 * @param {HTMLSelectElement} selectElement - The dropdown element to populate.
 * @param {Array<object>} users - An array of user objects, each with an 'id' and 'displayName'.
 */
export function populateFilter(selectElement, users) {
    // Check if we have the element and the user data before proceeding.
    if (!selectElement || !users) {
        console.error("UI Error: Cannot populate filter. Missing select element or users array.");
        return;
    }

    // Filter the users array to only include interns.
    const interns = users.filter(user => user.role === 'Intern');

    // Start by clearing any existing options and adding the default "All Interns" option.
    selectElement.innerHTML = '<option value="all">All Interns</option>';

    // Loop through each intern object.
    interns.forEach(intern => {
        // Create a new <option> HTML element.
        const option = document.createElement('option');
        // Set its value to the user's unique ID.
        option.value = intern.id;
        // Set its visible text to the user's name.
        option.textContent = intern.displayName;
        // Add the new option to the dropdown.
        selectElement.appendChild(option);
    });
}