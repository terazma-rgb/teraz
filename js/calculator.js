// Stock Pro Calculator Logic

let weightChartInstance = null;
let positionChartInstance = null;
let currentMode = 'manual'; // 'manual' or 'target'
let currentTab = 'us-stock'; // 'us-stock' or 'kr-stock'

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    setupTabs();
    setupInputs();
    
    // Refresh button listener
    document.getElementById('refresh-rate-btn').addEventListener('click', function() {
        const icon = this.querySelector('i');
        icon.classList.add('fa-spin');
        // Call the fetch function from dashboard.js
        if (typeof fetchExchangeRate === 'function') {
            fetchExchangeRate().then(() => {
                setTimeout(() => icon.classList.remove('fa-spin'), 1000);
            });
        }
    });
});

function setupTabs() {
    // Currency Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTab = btn.getAttribute('data-tab');
            updateCurrencyLabels();
        });
    });
}

function setCalcMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.mode-btn[onclick="setCalcMode('${mode}')"]`).classList.add('active');
    
    document.querySelectorAll('.mode-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`mode-${mode}`).classList.add('active');
}

function updateCurrencyLabels() {
    const isUS = currentTab === 'us-stock';
    // Logic to maybe change placeholders or symbols if strictly needed, 
    // but the UI is mostly generic now.
    // Toggle Exchange Rate Visibility logic could go here if we wanted to hide it for KR stocks.
    const origRateGroup = document.getElementById('orig-rate-group');
    if (isUS) {
        origRateGroup.style.display = 'block';
    } else {
        origRateGroup.style.display = 'none';
    }
}

function setupInputs() {
    // Auto-calculate on Enter key
    const inputs = document.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') calculate();
        });
    });
}

function getExchangeRate() {
    const rateText = document.getElementById('usd-krw-rate').textContent;
    if (rateText && !rateText.includes('loading') && !rateText.includes('실패')) {
        return parseFloat(rateText.replace(/,/g, '').replace(/[^\d.]/g, '')) || 1;
    }
    return 1; // Default to 1 if failed or KRW
}

function calculate() {
    // 1. Get Common Inputs
    const currentShares = parseFloat(document.getElementById('current-shares').value) || 0;
    const currentPrice = parseFloat(document.getElementById('current-price').value) || 0;
    const marketPrice = parseFloat(document.getElementById('market-price').value) || 0;
    
    // Fee Logic
    const includeFees = document.getElementById('include-fees').checked;
    const feeRate = includeFees ? 0.0025 : 0; // 0.25%

    let additionalShares = 0;
    let additionalPrice = 0;

    // 2. Determine Additional Buy based on Mode
    if (currentMode === 'manual') {
        additionalShares = parseFloat(document.getElementById('additional-shares').value) || 0;
        additionalPrice = parseFloat(document.getElementById('additional-price').value) || 0;
    } else {
        // Target Mode Logic (Reverse Calc)
        const targetAvg = parseFloat(document.getElementById('target-avg-price').value) || 0;
        const targetBuyPrice = parseFloat(document.getElementById('target-buy-price').value) || marketPrice;
        additionalPrice = targetBuyPrice;

        if (targetAvg > 0 && targetBuyPrice > 0 && currentShares > 0) {
            // Formula: NewAvg = (OldCost + NewCost) / (OldShares + NewShares)
            // Target * (OldShares + X) = (OldShares * OldPrice) + (X * BuyPrice)
            // Target*OldShares + Target*X = OldCost + BuyPrice*X
            // X * (Target - BuyPrice) = OldCost - Target*OldShares
            // X = (OldCost - Target*OldShares) / (Target - BuyPrice)
            
            const oldCost = currentShares * currentPrice;
            const numerator = oldCost - (targetAvg * currentShares);
            const denominator = targetAvg - additionalPrice; // Note: If Fee included, BuyPrice increases effectively
            
            // Fee adjustment for reverse calc is complex, doing simple approximation first
            // Effective Buy Price = Price * (1 + fee)
            const effectiveBuyPrice = additionalPrice * (1 + feeRate);
            
            // Adjusted Formula
            // Target = (OldCost + X * BuyPrice * (1+Fee)) / (OldShares + X)
            // Target * (OldS + X) = OldCost + X * BuyPrice * (1+Fee)
            // Target*OldS + Target*X = OldCost + X * BuyPriceEff
            // X * (Target - BuyPriceEff) = OldCost - Target*OldS
            
            const denomAdjusted = targetAvg - effectiveBuyPrice;

            if (denomAdjusted === 0) {
                alert("목표 평단가가 매수 희망가(수수료 포함)와 동일하여 계산할 수 없습니다.");
                return;
            }

            const calculatedShares = numerator / denomAdjusted;
            
            if (calculatedShares <= 0) {
                 alert("목표 평단가가 현재 평단가보다 높거나, 매수 희망가로는 달성 불가능한 목표입니다.");
                 return;
            }
            
            additionalShares = Math.ceil(calculatedShares); // Must buy whole shares
        }
    }

    if (currentShares <= 0 || currentPrice <= 0) {
        alert("현재 보유 수량과 평단가를 입력해주세요.");
        return;
    }

    // 3. Perform Final Calculation
    const isUS = currentTab === 'us-stock';
    const currency = isUS ? '$' : '₩';
    const exchangeRate = isUS ? getExchangeRate() : 1;
    const originalRate = isUS ? (parseFloat(document.getElementById('original-exchange-rate').value) || exchangeRate) : 1;

    // Costs
    const totalCostBefore = currentShares * currentPrice;
    
    // Additional Cost (with fees)
    const rawAdditionalCost = additionalShares * additionalPrice;
    const additionalFee = rawAdditionalCost * feeRate;
    const totalAdditionalCost = rawAdditionalCost + additionalFee;

    // Post-Averaging
    const totalSharesAfter = currentShares + additionalShares;
    const totalCostAfter = totalCostBefore + totalAdditionalCost;
    const avgPriceAfter = totalCostAfter / totalSharesAfter;
    
    // Metrics
    const avgChange = avgPriceAfter - currentPrice;
    const avgChangePercent = ((avgChange / currentPrice) * 100).toFixed(2);
    
    // Current Returns
    const currentValuation = currentShares * marketPrice;
    const currentReturnRate = ((currentValuation - totalCostBefore) / totalCostBefore) * 100;
    
    // Expected Returns (at market price, immediate)
    const valuationAfter = totalSharesAfter * marketPrice; // Assuming price stays at market price or buy price? Usually market.
    // If buying at different price, immediate P/L changes. Let's use marketPrice for valuation.
    const returnRateAfter = ((valuationAfter - totalCostAfter) / totalCostAfter) * 100;

    // Recovery
    // Price needed to break even = avgPriceAfter
    const recoveryRate = ((avgPriceAfter - marketPrice) / marketPrice) * 100;

    // 4. Update UI
    
    // Target Action Card (Specific to Target Mode)
    const targetActionCard = document.getElementById('res-target-action');
    if (currentMode === 'target') {
        const targetAvg = parseFloat(document.getElementById('target-avg-price').value) || 0;
        targetActionCard.style.display = 'flex';
        document.getElementById('target-price-val').textContent = `${currency}${targetAvg.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
        document.getElementById('target-shares-val').textContent = additionalShares.toLocaleString();
    } else {
        targetActionCard.style.display = 'none';
    }

    // Banner
    document.getElementById('res-old-avg').textContent = `${currency}${currentPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('res-new-avg').textContent = `${currency}${avgPriceAfter.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    
    const changeBadge = document.getElementById('res-avg-change');
    changeBadge.textContent = `${avgChangePercent}%`;
    changeBadge.className = `insight-change badge ${avgChange < 0 ? 'good' : 'bad'}`;

    // Required Cost
    document.getElementById('res-required-cost').textContent = `${currency}${totalAdditionalCost.toLocaleString(undefined, {maximumFractionDigits: 2})}`;
    
    if (isUS) {
        const requiredKrw = totalAdditionalCost * exchangeRate;
        const krwEl = document.getElementById('res-required-cost-krw');
        krwEl.style.display = 'block';
        krwEl.textContent = `(약 ₩${Math.round(requiredKrw).toLocaleString()})`;
    } else {
        document.getElementById('res-required-cost-krw').style.display = 'none';
    }

    // Data Grid
    document.getElementById('res-total-shares').textContent = `${totalSharesAfter.toLocaleString()}주`;
    document.getElementById('res-total-invest').textContent = `${currency}${totalCostAfter.toLocaleString(undefined, {maximumFractionDigits: 2})}`;
    
    if (isUS) {
        // Total KRW Investment (Old part @ OrigRate + New part @ CurrRate)
        const oldPartKrw = totalCostBefore * originalRate;
        const newPartKrw = totalAdditionalCost * exchangeRate;
        const totalKrw = oldPartKrw + newPartKrw;
        const totalKrwEl = document.getElementById('row-krw-total');
        const valEl = document.getElementById('res-total-invest-krw');
        totalKrwEl.style.display = 'flex';
        valEl.textContent = `₩${Math.round(totalKrw).toLocaleString()}`;
    } else {
         document.getElementById('row-krw-total').style.display = 'none';
    }

    // Risk
    setReturnColor('res-current-return', currentReturnRate);
    setReturnColor('res-new-return', returnRateAfter);
    
    const recEl = document.getElementById('res-recovery-rate');
    recEl.textContent = `${recoveryRate.toFixed(2)}%`;
    recEl.style.color = recoveryRate > 0 ? '#f87171' : '#4ade80'; // Positive recovery means we are down, so red.

    // Scenario
    const profitAtOldAvg = (currentPrice * totalSharesAfter) - totalCostAfter;
    document.getElementById('scenario-text').innerHTML = `
        주가가 기존 평단가(<strong>${currency}${currentPrice.toFixed(2)}</strong>)까지 회복 시<br>
        예상 수익금: <strong style="color: #4ade80">${currency}${profitAtOldAvg.toLocaleString(undefined, {maximumFractionDigits: 2})}</strong> 
        (수익률 ${(profitAtOldAvg/totalCostAfter*100).toFixed(2)}%)
    `;

    // Show Results
    document.getElementById('results').style.display = 'block';
    
    // Render Charts
    renderCharts(currentShares, additionalShares, currentPrice, avgPriceAfter, marketPrice, currency);

    // Scroll
    document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
}

function setReturnColor(id, value) {
    const el = document.getElementById(id);
    el.textContent = `${value.toFixed(2)}%`;
    if (value > 0) el.style.color = '#4ade80';
    else if (value < 0) el.style.color = '#f87171';
    else el.style.color = '#94a3b8';
}

function renderCharts(oldShares, newShares, oldAvg, newAvg, marketPrice, currency) {
    // 1. Weight Chart (Pie)
    const ctxWeight = document.getElementById('weightChart').getContext('2d');
    if (weightChartInstance) weightChartInstance.destroy();
    
    weightChartInstance = new Chart(ctxWeight, {
        type: 'doughnut',
        data: {
            labels: ['기존 보유', '신규 매수'],
            datasets: [{
                data: [oldShares, newShares],
                backgroundColor: ['#38bdf8', '#818cf8'], // Sky & Indigo
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#94a3b8' } }
            },
            cutout: '70%'
        }
    });

    // 2. Position Chart (Bar/Line hybrid)
    const ctxPos = document.getElementById('positionChart').getContext('2d');
    if (positionChartInstance) positionChartInstance.destroy();

    // Data for Comparison
    // We want to show 3 bars: Market Price, New Avg, Old Avg
    positionChartInstance = new Chart(ctxPos, {
        type: 'bar',
        data: {
            labels: ['현재가', '신규평단', '기존평단'],
            datasets: [{
                label: '가격 ($/₩)',
                data: [marketPrice, newAvg, oldAvg],
                backgroundColor: [
                    '#e2e8f0', // Slate 200 (Market)
                    '#4ade80', // Green (New Avg - Goal)
                    '#f87171'  // Red (Old Avg - High)
                ],
                borderRadius: 4,
                barThickness: 30
            }]
        },
        options: {
            indexAxis: 'y', // Horizontal bar
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#94a3b8' }
                },
                y: {
                    grid: { display: false },
                    ticks: { color: '#f8fafc', font: { weight: 'bold' } }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function resetCalculator() {
    document.querySelectorAll('input').forEach(input => input.value = '');
    document.getElementById('results').style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function saveAsImage() {
    const element = document.getElementById('capture-area');
    const originalBg = element.style.background;
    
    // Enhance look for capture
    element.style.background = '#0f172a'; // Solid dark bg for image
    
    html2canvas(element, {
        scale: 2, // High resolution
        backgroundColor: '#0f172a',
        useCORS: true
    }).then(canvas => {
        // Restore
        element.style.background = originalBg;
        
        // Download
        const link = document.createElement('a');
        const stockName = document.getElementById('stock-name').value || 'stock-analysis';
        link.download = `${stockName}-analysis.png`;
        link.href = canvas.toDataURL();
        link.click();
    });
}
