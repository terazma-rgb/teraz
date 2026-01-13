// Stock Pro Calculator Logic

let weightChartInstance = null;
let positionChartInstance = null;
let currentMode = 'manual'; // 'manual' or 'target'
let currentTab = 'us-stock'; // 'us-stock' or 'kr-stock'
let currentLang = 'ko'; // 'ko' or 'en'

const langPack = {
    ko: {
        mainTitle: "주식 물타기 & 목표 평단 계산기",
        tabUS: "미국주식 ($)",
        tabKR: "한국주식 (₩)",
        secCurrent: "현재 보유 자산",
        lblShares: "보유 수량",
        lblAvgPrice: "평균 단가",
        lblMarketPrice: "현재 시장가",
        secAdd: "추가 매수 계획",
        modeManual: "수량 직접 입력",
        modeTarget: "목표 평단 역계산",
        lblAddShares: "추가 매수 수량",
        lblBuyPrice: "매수 희망가",
        btnCurrent: "현재가",
        lblTargetAvg: "목표 평균 단가",
        lblTargetBuy: "매수 희망가 (선택)",
        helpTarget: "목표 평단을 맞추기 위해 필요한 주식 수를 계산합니다.",
        lblOrigRate: "최초 매수 시 환율 (선택: 환차손익 계산용)",
        btnReset: "초기화",
        btnCalc: "분석 실행",
        resTitle: "투자 분석 리포트",
        btnSave: "이미지 저장",
        resPlanLabel: "목표 달성 실행 계획",
        resAvgChange: "평단가 변화",
        resReqCost: "필요 투자금",
        chartWeight: "포트폴리오 비중",
        chartPosition: "평단가 위치 분석",
        cardEffect: "📊 물타기 효과",
        rowTotalShares: "총 보유 수량",
        rowTotalInvest: "총 투자 원금",
        rowTotalKRW: "원화 환산 총액",
        cardRisk: "🛡 리스크 & 목표",
        rowCurReturn: "현재 손익률",
        rowNewReturn: "예상 손익률 (물타기 후)",
        rowRecovery: "원금 회복까지",
        scenTitle: "💡 수익 시나리오",
        actionText: "목표 평단 <span id='target-price-val'>{0}</span> 달성을 위해<br><span class='action-highlight'>{1}에 {2}주</span>를<br>더 매수해야 합니다.",
        scenText: "주가가 기존 평단가(<strong>{0}</strong>)까지 회복 시<br>예상 수익금: <strong style='color: #4ade80'>{1}</strong> (수익률 {2}%)"
    },
    en: {
        mainTitle: "Stock Averaging Calculator",
        tabUS: "US Stock ($)",
        tabKR: "KR Stock (₩)",
        secCurrent: "Current Holdings",
        lblShares: "Shares Owned",
        lblAvgPrice: "Avg Price",
        lblMarketPrice: "Market Price",
        secAdd: "Buying Plan",
        modeManual: "Manual Input",
        modeTarget: "Reverse Calc",
        lblAddShares: "Shares to Buy",
        lblBuyPrice: "Buy Price",
        btnCurrent: "Market",
        lblTargetAvg: "Target Avg Price",
        lblTargetBuy: "Buy Price (Optional)",
        helpTarget: "Calculates shares needed to reach your target average price.",
        lblOrigRate: "Original Exchange Rate (Optional)",
        btnReset: "Reset",
        btnCalc: "Calculate",
        resTitle: "Analysis Report",
        btnSave: "Save Image",
        resPlanLabel: "Action Plan",
        resAvgChange: "Avg Price Change",
        resReqCost: "Required Capital",
        chartWeight: "Portfolio Weight",
        chartPosition: "Price Position",
        cardEffect: "📊 Effect",
        rowTotalShares: "Total Shares",
        rowTotalInvest: "Total Invested",
        rowTotalKRW: "Total in KRW",
        cardRisk: "🛡 Risk & Reward",
        rowCurReturn: "Current P/L",
        rowNewReturn: "Expected P/L",
        rowRecovery: "Break-even at",
        scenTitle: "💡 Scenario",
        actionText: "To reach avg price <span id='target-price-val'>{0}</span>,<br>you need to buy <span class='action-highlight'>{2} shares at {1}</span>.",
        scenText: "If price returns to old avg (<strong>{0}</strong>),<br>Expected Profit: <strong style='color: #4ade80'>{1}</strong> ({2}%)"
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    setupTabs();
    setupInputs();
    loadSavedData(); // Load saved data on startup
    setupLanguage(); // Setup language toggle
    
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

function setupLanguage() {
    const toggleBtn = document.getElementById('lang-toggle');
    const langText = toggleBtn.querySelector('.lang-text');
    
    toggleBtn.addEventListener('click', () => {
        currentLang = currentLang === 'ko' ? 'en' : 'ko';
        langText.textContent = currentLang === 'ko' ? 'EN' : 'KR';
        updateLanguage();
        saveData();
    });
    
    // Initial set from loaded data
    langText.textContent = currentLang === 'ko' ? 'EN' : 'KR';
    updateLanguage();
}

function updateLanguage() {
    const pack = langPack[currentLang];
    
    // Update all elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (pack[key]) {
            el.textContent = pack[key];
        }
    });
    
    // Placeholders
    if (currentLang === 'en') {
        document.getElementById('current-shares').placeholder = "0";
        document.getElementById('stock-name').placeholder = "Ticker (e.g. TSLA)";
    } else {
        document.getElementById('stock-name').placeholder = "종목명 (선택사항, 예: TSLA)";
    }
    
    // Re-render scenario text if results are visible
    if (document.getElementById('results').style.display === 'block') {
        calculate(); // Recalculate to update dynamic text strings
    }
}

function setupTabs() {
    // Currency Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTab = btn.getAttribute('data-tab');
            updateCurrencyLabels();
            saveData(); // Save tab state
        });
    });
}

function setCalcMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    const modeBtn = document.querySelector(`.mode-btn[onclick="setCalcMode('${mode}')"]`);
    if (modeBtn) modeBtn.classList.add('active');
    
    document.querySelectorAll('.mode-content').forEach(content => content.classList.remove('active'));
    const modeContent = document.getElementById(`mode-${mode}`);
    if (modeContent) modeContent.classList.add('active');
    saveData(); // Save mode state
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
    // Auto-calculate on Enter key and Save on input
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') calculate();
        });
        input.addEventListener('input', saveData);
    });
}

function saveData() {
    const data = {
        currentShares: document.getElementById('current-shares').value,
        currentPrice: document.getElementById('current-price').value,
        marketPrice: document.getElementById('market-price').value,
        additionalShares: document.getElementById('additional-shares').value,
        additionalPrice: document.getElementById('additional-price').value,
        targetAvgPrice: document.getElementById('target-avg-price').value,
        targetBuyPrice: document.getElementById('target-buy-price').value,
        originalExchangeRate: document.getElementById('original-exchange-rate').value,
        currentTab: currentTab,
        currentMode: currentMode,
        currentLang: currentLang
    };
    localStorage.setItem('stockProData', JSON.stringify(data));
}

function loadSavedData() {
    const savedData = localStorage.getItem('stockProData');
    if (savedData) {
        const data = JSON.parse(savedData);
        if (data.currentShares) document.getElementById('current-shares').value = data.currentShares;
        if (data.currentPrice) document.getElementById('current-price').value = data.currentPrice;
        if (data.marketPrice) document.getElementById('market-price').value = data.marketPrice;
        if (data.additionalShares) document.getElementById('additional-shares').value = data.additionalShares;
        if (data.additionalPrice) document.getElementById('additional-price').value = data.additionalPrice;
        if (data.targetAvgPrice) document.getElementById('target-avg-price').value = data.targetAvgPrice;
        if (data.targetBuyPrice) document.getElementById('target-buy-price').value = data.targetBuyPrice;
        if (data.originalExchangeRate) document.getElementById('original-exchange-rate').value = data.originalExchangeRate;
        
        if (data.currentTab) {
            currentTab = data.currentTab;
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-tab') === currentTab);
            });
            updateCurrencyLabels();
        }
        
        if (data.currentMode) {
            setCalcMode(data.currentMode);
        }

        if (data.currentLang) {
            currentLang = data.currentLang;
        }
    }
}

function applyQuickPrice(targetId, dropPercent) {
    const marketPrice = parseFloat(document.getElementById('market-price').value) || 0;
    if (marketPrice <= 0) {
        alert("먼저 현재 시장가(현재가)를 입력해주세요.");
        return;
    }
    
    let targetPrice = marketPrice * (1 + dropPercent);
    
    // Round based on price level (simple rule)
    if (targetPrice > 100) targetPrice = Math.round(targetPrice * 100) / 100;
    else targetPrice = Math.round(targetPrice * 1000) / 1000;

    const input = document.getElementById(targetId);
    input.value = targetPrice;
    
    // Add a small highlight effect
    input.style.backgroundColor = 'rgba(56, 189, 248, 0.2)';
    setTimeout(() => {
        input.style.backgroundColor = '';
    }, 500);
    
    saveData(); // Save the new price
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
    const pack = langPack[currentLang];
    
    // Target Action Card (Specific to Target Mode)
    const targetActionCard = document.getElementById('res-target-action');
    if (currentMode === 'target') {
        const targetAvg = parseFloat(document.getElementById('target-avg-price').value) || 0;
        targetActionCard.style.display = 'flex';
        
        // Use format string from langPack
        // Format: {0}=TargetAvg, {1}=BuyPrice, {2}=Shares
        const actionHtml = pack.actionText
            .replace('{0}', `${currency}${targetAvg.toLocaleString(undefined, {minimumFractionDigits: 2})}`)
            .replace('{1}', `${currency}${additionalPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}`)
            .replace('{2}', `${additionalShares.toLocaleString()}`);
            
        targetActionCard.querySelector('.action-title').innerHTML = actionHtml;
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
        krwEl.textContent = `(≈ ₩${Math.round(requiredKrw).toLocaleString()})`;
    } else {
        document.getElementById('res-required-cost-krw').style.display = 'none';
    }

    // Data Grid
    document.getElementById('res-total-shares').textContent = `${totalSharesAfter.toLocaleString()}`;
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
    // Format: {0}=OldAvg, {1}=ProfitAmount, {2}=Profit%
    const scenHtml = pack.scenText
        .replace('{0}', `${currency}${currentPrice.toFixed(2)}`)
        .replace('{1}', `${currency}${profitAtOldAvg.toLocaleString(undefined, {maximumFractionDigits: 2})}`)
        .replace('{2}', `${(profitAtOldAvg/totalCostAfter*100).toFixed(2)}`);
        
    document.getElementById('scenario-text').innerHTML = scenHtml;

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
    localStorage.removeItem('stockProData'); // Clear saved data
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
