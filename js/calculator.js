// 주식 물타기 계산기 JavaScript

let returnChart = null;

// 탭 전환 기능
document.addEventListener('DOMContentLoaded', function() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // 탭 버튼 활성화/비활성화
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // 탭 콘텐츠 표시/숨김
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === targetTab) {
                    content.classList.add('active');
                }
            });
        });
    });
});

// 미국주식 계산
function calculateUSStock() {
    const currentShares = parseFloat(document.getElementById('us-current-shares').value) || 0;
    const currentPrice = parseFloat(document.getElementById('us-current-price').value) || 0;
    const marketPrice = parseFloat(document.getElementById('us-market-price').value) || 0;
    const additionalShares = parseFloat(document.getElementById('us-additional-shares').value) || 0;
    const additionalPrice = parseFloat(document.getElementById('us-additional-price').value) || 0;
    const targetPrice = parseFloat(document.getElementById('us-target-price').value) || 0;

    let exchangeRate = 0;
    const rateText = document.getElementById('usd-krw-rate').textContent;
    if (rateText && rateText !== 'loading...' && rateText !== '연결 실패') {
        exchangeRate = parseFloat(rateText.replace(/,/g, '').replace(' ₩', '')) || 0;
    }

    if (validateInputs(currentShares, currentPrice, marketPrice, additionalShares, additionalPrice)) {
        const results = calculateStock(currentShares, currentPrice, marketPrice, additionalShares, additionalPrice, '$', exchangeRate);
        displayResults(results);
    }
}

// 한국주식 계산
function calculateKRStock() {
    const currentShares = parseFloat(document.getElementById('kr-current-shares').value) || 0;
    const currentPrice = parseFloat(document.getElementById('kr-current-price').value) || 0;
    const marketPrice = parseFloat(document.getElementById('kr-market-price').value) || 0;
    const additionalShares = parseFloat(document.getElementById('kr-additional-shares').value) || 0;
    const additionalPrice = parseFloat(document.getElementById('kr-additional-price').value) || 0;
    const targetPrice = parseFloat(document.getElementById('kr-target-price').value) || 0;

    if (validateInputs(currentShares, currentPrice, marketPrice, additionalShares, additionalPrice)) {
        const results = calculateStock(currentShares, currentPrice, marketPrice, additionalShares, additionalPrice, '₩', 0);
        displayResults(results);
    }
}

// 입력값 검증
function validateInputs(currentShares, currentPrice, marketPrice, additionalShares, additionalPrice) {
    if (currentShares <= 0) {
        alert('현재 보유 수량을 입력해주세요.');
        return false;
    }
    if (currentPrice <= 0) {
        alert('현재 평균 단가를 입력해주세요.');
        return false;
    }
    if (marketPrice <= 0) {
        alert('현재 시가를 입력해주세요.');
        return false;
    }
    if (additionalShares < 0) {
        alert('추가 매수 수량은 0 이상이어야 합니다.');
        return false;
    }
    if (additionalPrice < 0) {
        alert('추가 매수 희망가는 0 이상이어야 합니다.');
        return false;
    }
    return true;
}

// 주식 물타기 계산 로직
function calculateStock(currentShares, currentPrice, marketPrice, additionalShares, additionalPrice, currencySymbol, exchangeRate) {
    // 현재 상황 계산
    const totalValueBefore = currentShares * marketPrice;
    const totalCostBefore = currentShares * currentPrice;
    const currentPL = totalValueBefore - totalCostBefore;
    const currentReturn = ((marketPrice - currentPrice) / currentPrice) * 100;

    // 물타기 후 계산
    const totalSharesAfter = currentShares + additionalShares;
    const totalCostAfter = totalCostBefore + (additionalShares * additionalPrice);
    const avgPriceAfter = totalCostAfter / totalSharesAfter;
    const totalValueAfter = totalSharesAfter * marketPrice;
    const newPL = totalValueAfter - totalCostAfter;
    const improvement = newPL - currentPL;

    // 손절가 계산 (평균단가의 90%)
    const stopLoss = avgPriceAfter * 0.9;

    // 회복까지 필요한 상승률
    const recoveryRate = ((avgPriceAfter - marketPrice) / marketPrice) * 100;

    // KRW 변환 (환율이 있을 경우)
    let totalValueKrwBefore = 0;
    let totalValueKrwAfter = 0;
    if (exchangeRate > 0) {
        totalValueKrwBefore = totalValueBefore * exchangeRate;
        totalValueKrwAfter = totalValueAfter * exchangeRate;
    }

    return {
        currencySymbol,
        totalSharesBefore: currentShares,
        totalCostBefore,
        currentPL,
        currentReturn,
        totalSharesAfter,
        avgPriceAfter,
        improvement,
        stopLoss,
        totalCostAfter,
        recoveryRate,
        marketPrice,
        exchangeRate,
        totalValueKrwBefore,
        totalValueKrwAfter
    };
}

// 결과 표시
function displayResults(results) {
    // 현재 상황
    document.getElementById('total-shares-before').textContent = `${results.totalSharesBefore.toLocaleString()}주`;
    document.getElementById('avg-price-before').textContent = `${results.currencySymbol}${results.totalCostBefore / results.totalSharesBefore.toFixed(2)}`;
    document.getElementById('current-pl').textContent = `${results.currencySymbol}${results.currentPL.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('current-pl').className = `value ${results.currentPL >= 0 ? 'positive' : 'negative'}`;
    document.getElementById('current-return').textContent = `${results.currentReturn.toFixed(2)}%`;
    document.getElementById('current-return').className = `value ${results.currentReturn >= 0 ? 'positive' : 'negative'}`;

    // 원화 환산 표시 (미국 주식일 경우)
    const krwConvertedBefore = document.getElementById('krw-converted-before');
    const krwConvertedAfter = document.getElementById('krw-converted-after');
    
    if (results.exchangeRate > 0) {
        krwConvertedBefore.style.display = 'flex';
        document.getElementById('total-value-krw-before').textContent = `₩${results.totalValueKrwBefore.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
        
        krwConvertedAfter.style.display = 'flex';
        document.getElementById('total-value-krw-after').textContent = `₩${results.totalValueKrwAfter.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
    } else {
        krwConvertedBefore.style.display = 'none';
        krwConvertedAfter.style.display = 'none';
    }

    // 물타기 후
    document.getElementById('total-shares-after').textContent = `${results.totalSharesAfter.toLocaleString()}주`;
    document.getElementById('avg-price-after').textContent = `${results.currencySymbol}${results.avgPriceAfter.toFixed(2)}`;
    document.getElementById('improvement').textContent = `${results.currencySymbol}${results.improvement.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('improvement').className = `value ${results.improvement >= 0 ? 'positive' : 'negative'}`;
    document.getElementById('stop-loss').textContent = `${results.currencySymbol}${results.stopLoss.toFixed(2)}`;

    // 투자 분석
    document.getElementById('total-investment').textContent = `${results.currencySymbol}${results.totalCostAfter.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('recovery-rate').textContent = `${results.recoveryRate.toFixed(2)}%`;
    document.getElementById('recovery-rate').className = `value ${results.recoveryRate >= 0 ? 'positive' : 'negative'}`;

    // 결과 섹션 표시
    document.getElementById('results').style.display = 'block';
    document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
}

// 결과 숨기기
function hideResults() {
    document.getElementById('results').style.display = 'none';
}

// 입력값 실시간 포맷팅
document.addEventListener('DOMContentLoaded', function() {
    const inputs = document.querySelectorAll('input[type="number"]');
    
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            // 양수만 허용
            if (this.value < 0) {
                this.value = 0;
            }
        });
    });
});

// 엔터키로 계산 실행
document.addEventListener('DOMContentLoaded', function() {
    const inputs = document.querySelectorAll('input[type="number"]');
    
    inputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const activeTab = document.querySelector('.tab-content.active').id;
                if (activeTab === 'us-stock') {
                    calculateUSStock();
                } else {
                    calculateKRStock();
                }
            }
        });
    });
});