// This file handles the rendering of market data using simulated static data.
// It uses Chart.js for the S&P 500 chart and generates mock data for meme coins.
// Data is rendered once when the tab is loaded (page reload/login) and does not automatically update.

// Chart.js is loaded globally via a script tag in app.html, so no import is needed here.
// Access it directly as 'Chart'.

// No Chart.js instance needed for S&P 500 anymore as it's replaced by a list.

/**
 * Destroys an existing Chart.js instance.
 * @param {string} chartId - The ID of the canvas element associated with the chart.
 */
function destroyChart(chartId) {
    // Access Chart from the global scope (window.Chart)
    // This function is kept for other potential Chart.js uses in the app,
    // but not directly used for the market tab in this current iteration.
    const chart = Chart.getChart(chartId); // Get chart instance by ID
    if (chart) {
        chart.destroy();
    }
}

/**
 * Renders a list of simulated major indexes and sectors.
 * Data is static based on page load.
 */
async function fetchAndRenderIndexesAndSectors() {
    const indexesSectorsListEl = document.getElementById('indexes-sectors-list');
    if (!indexesSectorsListEl) {
        console.error("Indexes and Sectors list element not found.");
        return;
    }

    indexesSectorsListEl.innerHTML = '<p class="text-center text-slate-500">Loading data...</p>';

    try {
        // Simulated data for major indexes and sectors
        // Prices and changes are simulated at the time of page load/login.
        const mockMarketData = [
            { "name": "S&P 500", "symbol": "SPX", "base_price": 5400.00 },
            { "name": "Dow Jones", "symbol": "DJI", "base_price": 39000.00 },
            { "name": "Nasdaq Composite", "symbol": "IXIC", "base_price": 17500.00 },
            { "name": "Russell 2000", "symbol": "RUT", "base_price": 2000.00 },
            { "name": "Tech Sector", "symbol": "XLK", "base_price": 230.00 },
            { "name": "Energy Sector", "symbol": "XLE", "base_price": 90.00 },
            { "name": "Healthcare Sector", "symbol": "XLV", "base_price": 150.00 },
            { "name": "Financials Sector", "symbol": "XLF", "base_price": 45.00 },
            { "name": "Consumer Discretionary", "symbol": "XLY", "base_price": 180.00 }
        ];

        const simulatedMarketData = mockMarketData.map(item => {
            // Simulate daily percentage change (including after-hours)
            // Range: -3% to +3% for major indexes, -5% to +5% for sectors
            const maxFluctuation = item.symbol.includes('X') ? 0.05 : 0.03; // Higher volatility for sectors
            const fluctuation = (Math.random() - 0.5) * 2 * maxFluctuation * item.base_price;
            const current_price = item.base_price + fluctuation;
            const change_percent = (fluctuation / item.base_price) * 100;

            return {
                ...item,
                current_price: current_price,
                change_percent: change_percent
            };
        });

        indexesSectorsListEl.innerHTML = ''; // Clear loading message

        if (simulatedMarketData.length === 0) {
            indexesSectorsListEl.innerHTML = '<p class="text-center text-slate-500 italic">No data found.</p>';
            return;
        }

        simulatedMarketData.forEach(item => {
            const changeColor = item.change_percent >= 0 ? 'text-green-600' : 'text-red-600';
            const changeSign = item.change_percent >= 0 ? '+' : '';

            const itemElement = document.createElement('div');
            itemElement.className = 'flex items-center justify-between p-2 bg-white rounded-lg shadow-sm text-sm';
            itemElement.innerHTML = `
                <span class="font-semibold text-ink">${item.name} (${item.symbol})</span>
                <span class="font-medium">$${item.current_price.toFixed(2)}</span>
                <span class="${changeColor}">${changeSign}${item.change_percent.toFixed(2)}%</span>
            `;
            indexesSectorsListEl.appendChild(itemElement);
        });

    } catch (error) {
        console.error("Error rendering indexes and sectors list:", error);
        indexesSectorsListEl.innerHTML = '<p class="text-center text-red-500">Error loading data.</p>';
    }
}


/**
 * Renders a list of simulated top trading meme coins, sorted by 1-day price percentage change.
 * Filters for "crazy volatile" ones. Data is static based on page load.
 */
async function fetchAndRenderMemeCoins() {
    const memeCoinListEl = document.getElementById('meme-coin-list');
    if (!memeCoinListEl) {
        console.error("Meme coin list element not found.");
        return;
    }

    memeCoinListEl.innerHTML = '<p class="text-center text-slate-500">Loading meme coins...</p>';

    try {
        // Base simulated Meme Coin Data
        const baseMockMemeCoins = [
            { "id": "dogecoin", "symbol": "doge", "name": "Dogecoin", "base_price": 0.1500 },
            { "id": "shiba-inu", "symbol": "shib", "name": "Shiba Inu", "base_price": 0.00002200 },
            { "id": "pepe", "symbol": "pepe", "name": "Pepe", "base_price": 0.00000120 },
            { "id": "floki", "symbol": "floki", "name": "Floki", "base_price": 0.00003000 },
            { "id": "bonk", "symbol": "bonk", "name": "Bonk", "base_price": 0.0000000100 },
            { "id": "dogwifhat", "symbol": "wif", "name": "Dogwifhat", "base_price": 2.50 },
            { "id": "book-of-meme", "symbol": "bome", "name": "Book of Meme", "base_price": 0.0120 },
            { "id": "slerf", "symbol": "slerf", "name": "Slerf", "base_price": 0.3500 },
            { "id": "mog-coin", "symbol": "mog", "name": "Mog Coin", "base_price": 0.00000090 },
            { "id": "cat-coin", "symbol": "cat", "name": "Cat Coin", "base_price": 0.0000000080 }
        ];

        const NUM_MEMECOINS_TO_GENERATE = 1500; // Target around 1500 meme coins to simulate "1000s"
        const allSimulatedMemeCoins = [];

        // Generate a large number of meme coins by repeating and slightly varying base data
        for (let i = 0; i < NUM_MEMECOINS_TO_GENERATE; i++) {
            const baseCoin = baseMockMemeCoins[i % baseMockMemeCoins.length]; // Cycle through base coins
            
            // Add slight variation to base price for each generated coin
            const variedBasePrice = baseCoin.base_price * (1 + (Math.random() - 0.5) * 0.1); // +/- 5% variation
            
            // Generate current price and 1-day change based on simulation
            const fluctuation1d = (Math.random() - 0.5) * 0.50 * variedBasePrice; // Increased fluctuation for "crazy volatile" daily
            const current_price = variedBasePrice + fluctuation1d;
            const price_change_percentage_1d = (fluctuation1d / variedBasePrice) * 100;

            allSimulatedMemeCoins.push({
                id: `${baseCoin.id}-${i}`, // Unique ID for each simulated coin
                symbol: `${baseCoin.symbol}${i}`, // Unique symbol
                name: `${baseCoin.name} ${i}`, // Unique name
                current_price: current_price,
                price_change_percentage_1d: price_change_percentage_1d
            });
        }

        // Filter for "crazy volatile" meme coins based on 1-day change
        const VOLATILITY_THRESHOLD = 25.0; // Adjusted threshold for daily volatility (e.g., +/- 25% in 1 day)
        const volatileMemeCoins = allSimulatedMemeCoins.filter(coin =>
            Math.abs(coin.price_change_percentage_1d) >= VOLATILITY_THRESHOLD // Filter by 1d change
        );

        // Sort volatile meme coins by 1-day price percentage change, top to bottom (descending)
        volatileMemeCoins.sort((a, b) => b.price_change_percentage_1d - a.price_change_percentage_1d); // Sort by 1d change

        memeCoinListEl.innerHTML = ''; // Clear loading message

        if (volatileMemeCoins.length === 0) {
            memeCoinListEl.innerHTML = '<p class="text-center text-slate-500 italic">No crazy volatile meme coins found right now.</p>';
            return;
        }

        volatileMemeCoins.forEach(coin => {
            const priceChange1d = coin.price_change_percentage_1d; // Use 1d change

            const changeColor = priceChange1d >= 0 ? 'text-green-600' : 'text-red-600';
            const changeSign = priceChange1d >= 0 ? '+' : '';

            const coinElement = document.createElement('div');
            coinElement.className = 'flex items-center justify-between p-2 bg-white rounded-lg shadow-sm text-sm';
            coinElement.innerHTML = `
                <span class="font-semibold text-ink">${coin.name} (${coin.symbol.toUpperCase()})</span>
                <span class="font-medium">$${coin.current_price.toFixed(8).replace(/\.?0+$/, '')}</span>
                <span class="${changeColor}">${changeSign}${priceChange1d ? priceChange1d.toFixed(2) : 'N/A'}% (1d)</span> <!-- Changed display to 1d -->
            `;
            memeCoinListEl.appendChild(coinElement);
        });

    } catch (error) {
        console.error("Error rendering meme coin list:", error);
        memeCoinListEl.innerHTML = '<p class="text-center text-red-500">Error loading meme coins.</p>';
    }
}

/**
 * Main function to render the Market tab content.
 * Called when the Market tab is activated.
 * Data is loaded once and is static.
 */
export function renderMarket() {
    // No setIntervals are used in this static rendering approach.
    
    // Initial render of static data
    fetchAndRenderIndexesAndSectors(); // Renders simulated indexes and sectors
    fetchAndRenderMemeCoins(); // Renders filtered and sorted meme coin list
}

/**
 * This function is exported for consistency. Since data is static,
 * there are no active intervals to stop.
 */
export function stopMarketUpdates() {
    console.log("Market data is static and does not require active updates to stop.");
    // No Chart.js instance to destroy in this setup.
    // If Chart.js were used for other parts of the app, its destroy logic would remain elsewhere.
}
