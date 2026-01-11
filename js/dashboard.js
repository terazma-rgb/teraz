async function fetchExchangeRate() {
    try {
        const response = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await response.json();
        
        if (data && data.rates && data.rates.KRW) {
            const rate = data.rates.KRW;
            const rateElement = document.getElementById('usd-krw-rate');
            const changeElement = document.getElementById('usd-krw-change');
            
            if (rateElement) {
                // Format with commas and 2 decimal places
                rateElement.textContent = `${rate.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} ₩`;
            }
            
            if (changeElement) {
                // Show last update time
                const lastUpdate = new Date(data.time_last_update_utc);
                const year = lastUpdate.getFullYear();
                const month = String(lastUpdate.getMonth() + 1).padStart(2, '0');
                const day = String(lastUpdate.getDate()).padStart(2, '0');
                const hours = String(lastUpdate.getHours()).padStart(2, '0');
                const minutes = String(lastUpdate.getMinutes()).padStart(2, '0');
                
                changeElement.textContent = `환율 업데이트: ${year}-${month}-${day} ${hours}:${minutes} (현지 시간)`;
                changeElement.style.color = '#888';
            }
        }
    } catch (error) {
        console.error('Exchange rate fetch error:', error);
        const rateElement = document.getElementById('usd-krw-rate');
        if (rateElement) rateElement.textContent = '연결 실패';
    }
}

// Fetch on load
document.addEventListener('DOMContentLoaded', fetchExchangeRate);

// Refresh every 5 minutes
setInterval(fetchExchangeRate, 300000);