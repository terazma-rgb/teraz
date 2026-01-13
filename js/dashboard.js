// Dashboard Logic (Exchange Rate)

window.currentExchangeRate = 1; // Default

async function fetchExchangeRate() {
    try {
        const response = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await response.json();
        
        if (data && data.rates && data.rates.KRW) {
            const rate = data.rates.KRW;
            window.currentExchangeRate = rate; // Store in global variable
            
            // UI elements are removed, so we just store the data
            return true;
        }
    } catch (error) {
        console.error('Exchange rate fetch error:', error);
        return false;
    }
}

// Fetch on load
document.addEventListener('DOMContentLoaded', fetchExchangeRate);

// Refresh every 5 minutes
setInterval(fetchExchangeRate, 300000);

// Expose to window for calculator.js
window.fetchExchangeRate = fetchExchangeRate;
