class StockCalculator extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.currency = 'KRW'; // Default currency
        this.render();
    }

    static get styles() {
        return `
            :host {
                --primary-color: #8a6c4a;
                --primary-color-dark: #6f563a;
                --border-color: #ddd;
                --text-color: #333;
                --result-bg-color: #e9e6e0;
            }

            .tabs {
                display: flex;
                margin-bottom: 1.5rem;
                border-bottom: 2px solid var(--border-color);
            }
            .tab {
                padding: 0.5rem 1rem;
                cursor: pointer;
                border: none;
                background-color: transparent;
                font-size: 1.1rem;
                font-weight: 600;
                color: var(--text-color);
                opacity: 0.6;
                transition: opacity 0.3s;
                border-bottom: 3px solid transparent;
                margin-bottom: -2px;
            }
            .tab.active {
                opacity: 1;
                border-bottom-color: var(--primary-color);
            }

            .calculator {
                display: grid;
                gap: 1.2rem;
            }

            .input-group {
                display: flex;
                flex-direction: column;
            }

            label {
                font-weight: 600;
                margin-bottom: 0.5rem;
                font-size: 0.9rem;
            }
            
            .input-wrapper {
                position: relative;
            }

            .currency-symbol {
                position: absolute;
                left: 10px;
                top: 50%;
                transform: translateY(-50%);
                color: #aaa;
                font-weight: 600;
            }

            input {
                width: 100%;
                padding: 0.8rem;
                padding-left: 2.2rem;
                border: 1px solid var(--border-color);
                border-radius: 6px;
                font-size: 1rem;
                box-sizing: border-box;
                transition: border-color 0.3s, box-shadow 0.3s;
            }

            input:focus {
                outline: none;
                border-color: var(--primary-color);
                box-shadow: 0 0 0 3px rgba(138, 108, 74, 0.2);
            }

            .result-section {
                margin-top: 1rem;
                background-color: var(--result-bg-color);
                padding: 1rem;
                border-radius: 8px;
                border: 1px dashed var(--primary-color);
            }
            .result-section h2 {
                margin-top: 0;
                margin-bottom: 1rem;
                font-size: 1.2rem;
                color: var(--primary-color-dark);
                border-bottom: 2px solid var(--primary-color-dark);
                padding-bottom: 0.5rem;
            }

            .result-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1rem;
            }
            
            .result-item {
                display: flex;
                flex-direction: column;
            }

            .result-item .label {
                font-size: 0.85rem;
                font-weight: 600;
                color: #555;
                margin-bottom: 0.25rem;
            }

            .result-item .value {
                font-size: 1.1rem;
                font-weight: 700;
                color: var(--text-color);
            }
            
            .reset-btn {
                margin-top: 1rem;
                padding: 0.8rem 1rem;
                width: 100%;
                background-color: var(--primary-color);
                color: white;
                border: none;
                border-radius: 6px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: background-color 0.3s;
            }

            .reset-btn:hover {
                background-color: var(--primary-color-dark);
            }
        `;
    }

    getCurrencySymbol() {
        switch(this.currency) {
            case 'KRW': return '₩';
            case 'USD': return '$';
            case 'JPY': return '¥';
            default: return '';
        }
    }

    get template() {
        return `
            <div class="tabs">
                <button class="tab ${this.currency === 'KRW' ? 'active' : ''}" data-currency="KRW">한국 주식 (KRW)</button>
                <button class="tab ${this.currency === 'USD' ? 'active' : ''}" data-currency="USD">미국 주식 (USD)</button>
                <button class="tab ${this.currency === 'JPY' ? 'active' : ''}" data-currency="JPY">일본 주식 (JPY)</button>
            </div>
            <div class="calculator">
                <div class="input-group">
                    <label for="current-shares">현재 보유 주식 수</label>
                    <div class="input-wrapper">
                        <input type="number" id="current-shares" placeholder="예: 10">
                    </div>
                </div>
                <div class="input-group">
                    <label for="current-avg-price">현재 평균 단가</label>
                     <div class="input-wrapper">
                        <span class="currency-symbol">${this.getCurrencySymbol()}</span>
                        <input type="number" id="current-avg-price" placeholder="예: 50000">
                    </div>
                </div>
                <div class="input-group">
                    <label for="additional-shares">추가 매수 주식 수</label>
                    <div class="input-wrapper">
                        <input type="number" id="additional-shares" placeholder="예: 5">
                    </div>
                </div>
                <div class="input-group">
                    <label for="additional-price">추가 매수 단가</label>
                    <div class="input-wrapper">
                        <span class="currency-symbol">${this.getCurrencySymbol()}</span>
                        <input type="number" id="additional-price" placeholder="예: 40000">
                    </div>
                </div>
            </div>
            
            <div class="result-section">
                <h2>계산 결과</h2>
                <div class="result-grid">
                    <div class="result-item">
                        <span class="label">최종 평균 단가</span>
                        <span class="value" id="final-avg-price">-</span>
                    </div>
                    <div class="result-item">
                        <span class="label">총 보유 주식 수</span>
                        <span class="value" id="total-shares">-</span>
                    </div>
                    <div class="result-item">
                        <span class="label">총 투자 금액</span>
                        <span class="value" id="total-investment">-</span>
                    </div>
                </div>
            </div>
            <button class="reset-btn">초기화</button>
        `;
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>${StockCalculator.styles}</style>
            ${this.template}
        `;
        setTimeout(() => this.addEventListeners(), 0);
    }

    addEventListeners() {
        this.shadowRoot.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', () => this.calculate());
        });
        
        this.shadowRoot.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchCurrency(e.target.dataset.currency));
        });

        this.shadowRoot.querySelector('.reset-btn').addEventListener('click', () => this.reset());
    }

    switchCurrency(newCurrency) {
        if (this.currency === newCurrency) return;
        this.currency = newCurrency;
        this.render(); // Re-render to update currency symbols and reset inputs
    }

    calculate() {
        const currentShares = parseFloat(this.shadowRoot.getElementById('current-shares').value) || 0;
        const currentAvgPrice = parseFloat(this.shadowRoot.getElementById('current-avg-price').value) || 0;
        const additionalShares = parseFloat(this.shadowRoot.getElementById('additional-shares').value) || 0;
        const additionalPrice = parseFloat(this.shadowRoot.getElementById('additional-price').value) || 0;

        if (currentShares <= 0 || currentAvgPrice <= 0) {
            this.displayResult(0, 0, 0);
            return;
        }

        const totalShares = currentShares + additionalShares;
        const currentInvestment = currentShares * currentAvgPrice;
        const additionalInvestment = additionalShares * additionalPrice;
        const totalInvestment = currentInvestment + additionalInvestment;
        const finalAvgPrice = totalShares > 0 ? totalInvestment / totalShares : 0;
        
        this.displayResult(finalAvgPrice, totalShares, totalInvestment);
    }

    displayResult(finalAvgPrice, totalShares, totalInvestment) {
        const isUSD = this.currency === 'USD';
        const formatOptions = {
            style: 'currency',
            currency: this.currency,
            minimumFractionDigits: (isUSD || this.currency === 'JPY') ? 0 : 0, // JPY usually no decimals
            maximumFractionDigits: (isUSD || this.currency === 'JPY') ? 0 : 0
        };
        if (isUSD) {
            formatOptions.minimumFractionDigits = 2;
            formatOptions.maximumFractionDigits = 2;
        }

        const formatter = new Intl.NumberFormat('ko-KR', formatOptions);
        
        this.shadowRoot.getElementById('final-avg-price').textContent = finalAvgPrice > 0 ? formatter.format(finalAvgPrice) : '-';
        this.shadowRoot.getElementById('total-shares').textContent = totalShares > 0 ? `${totalShares.toLocaleString()}주` : '-';
        this.shadowRoot.getElementById('total-investment').textContent = totalInvestment > 0 ? formatter.format(totalInvestment) : '-';
    }

    reset() {
        this.shadowRoot.querySelectorAll('input').forEach(input => input.value = '');
        this.calculate();
    }
}

customElements.define('stock-calculator', StockCalculator);