/**
 * Sets a personalized greeting in the main header based on the time of day.
 * @param {string} firstName - The first name of the logged-in user.
 */
export function setDynamicGreeting(firstName) {
    const headerElement = document.getElementById('main-header-title');
    if (!headerElement) {
        console.error("UI Error: Main header element not found.");
        return;
    }

    const currentHour = new Date().getHours();
    let greeting = '';

    if (currentHour < 12) {
        greeting = 'Good morning';
    } else if (currentHour < 18) {
        greeting = 'Good afternoon';
    } else {
        greeting = 'Good evening';
    }

    headerElement.textContent = `${greeting}, ${firstName}!`;
}

/**
 * Fetches a random quote from an API and displays it on the dashboard.
 */
export async function displayQuoteOfTheDay() {
    const quoteContainer = document.getElementById('quote-of-the-day');
    if (!quoteContainer) {
        console.error("UI Error: Quote container element not found.");
        return;
    }

    try {
        const response = await fetch("https://type.fit/api/quotes");
        if (!response.ok) {
            throw new Error('Failed to fetch quotes.');
        }
        const quotes = await response.json();
        
        // Select a random quote from the list
        const randomIndex = Math.floor(Math.random() * quotes.length);
        const randomQuote = quotes[randomIndex];

        // Format the quote text and author
        const quoteText = randomQuote.text || "The best way to predict the future is to create it.";
        const quoteAuthor = randomQuote.author || "Anonymous";

        quoteContainer.innerHTML = `
            <p class="italic">"${quoteText}"</p>
            <p class="text-right mt-1 font-semibold">- ${quoteAuthor.replace(', type.fit', '')}</p>
        `;

    } catch (error) {
        console.error("Error fetching quote:", error);
        // Display a fallback quote in case of an API error
        quoteContainer.innerHTML = `<p class="italic">"The secret of getting ahead is getting started."</p><p class="text-right mt-1 font-semibold">- Mark Twain</p>`;
    }
}
