/**
 * Populates the 'Assign To' dropdown in the task modal.
 * The options depend on the logged-in user's role to enforce permissions.
 * - Advisors/WMAs can assign to any non-Advisor or to a general 'Any Interns' pool.
 * - Interns can only assign tasks to themselves.
 * @param {HTMLSelectElement} selectElement - The dropdown element to populate.
 * @param {Array<object>} users - An array of all user objects.
 * @param {object} loggedInUser - The user object for the currently logged-in user.
 */
export function populateDropdown(selectElement, users, loggedInUser) {
    if (!selectElement || !users || !loggedInUser) {
        console.error("UI Error: Cannot populate dropdown. Missing element or user data.");
        return;
    }

    // Clear any existing options before adding new ones.
    selectElement.innerHTML = '';

    // Logic for supervisor roles (Advisor or WMA)
    if (loggedInUser.role === 'Advisor' || loggedInUser.role === 'WMA') {
        // Add a special option to assign a task to the general intern pool.
        selectElement.innerHTML += `<option value="any_intern">Any Interns</option>`;
        
        // Add options for all individual users who are not Advisors.
        users.forEach(user => {
            if (user.role !== 'Advisor') {
                selectElement.innerHTML += `<option value="${user.id}">${user.displayName}</option>`;
            }
        });
    }
    // Logic for the Intern role
    else if (loggedInUser.role === 'Intern') {
        // Interns can only assign tasks to themselves.
        selectElement.innerHTML += `<option value="${loggedInUser.id}">${loggedInUser.displayName}</option>`;
    }
}