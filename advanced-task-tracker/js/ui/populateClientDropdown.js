/**
 * Populates a select dropdown with a list of clients.
 * It preserves the first option (e.g., "No Client") and appends the clients after it.
 * @param {HTMLSelectElement} selectElement - The dropdown element to populate.
 * @param {Array<object>} clients - An array of client objects, each with an 'id' and 'name'.
 */
export function populateClientDropdown(selectElement, clients) {
    if (!selectElement || !clients) {
        console.error("UI Error: Cannot populate client dropdown. Missing element or client data.");
        return;
    }

    // Preserve the first option (the "No Client" default)
    const defaultOption = selectElement.options[0];
    selectElement.innerHTML = '';
    selectElement.appendChild(defaultOption);

    // Sort clients alphabetically by name before populating
    clients.sort((a, b) => a.name.localeCompare(b.name));
    
    // Add an option for each client
    clients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.id;
        option.textContent = client.name;
        selectElement.appendChild(option);
    });
}