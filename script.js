(function () {
    const state = {
        currentValue: '0',
        previousValue: null,
        operator: null,
        shouldReset: false,
        expression: ''
    };

    const resultDisplay = document.getElementById('result');
    const expressionDisplay = document.getElementById('expression');
    const themeToggle = document.getElementById('themeToggle');

    function formatNumber(num) {
        if (num === 'Error' || num === 'Infinity' || num === '-Infinity') return 'Error';
        const n = parseFloat(num);
        if (!isFinite(n)) return 'Error';
        if (Number.isInteger(n) && Math.abs(n) < 1e15) {
            return n.toLocaleString('en-US');
        }
        const str = parseFloat(n.toFixed(10)).toString();
        if (str.length > 15 && Math.abs(n) < 1e15) {
            return parseFloat(n.toFixed(8)).toLocaleString('en-US', {
                maximumFractionDigits: 8
            });
        }
        return str;
    }

    function updateDisplay() {
        resultDisplay.textContent = state.currentValue === 'Error'
            ? 'Error'
            : formatNumber(state.currentValue);
        expressionDisplay.textContent = state.expression || '\u00A0';
    }

    function inputDigit(digit) {
        if (state.shouldReset) {
            state.currentValue = digit;
            state.expression = '';
            state.shouldReset = false;
            updateDisplay();
            return;
        }
        if (state.currentValue === '0' && digit !== '.') {
            state.currentValue = digit;
        } else if (state.currentValue.replace(/[^.]/g, '').length < 1 || digit !== '.') {
            state.currentValue += digit;
        }
        updateDisplay();
    }

    function inputDecimal() {
        if (state.shouldReset) {
            state.currentValue = '0.';
            state.shouldReset = false;
            state.expression = '';
            updateDisplay();
            return;
        }
        if (!state.currentValue.includes('.')) {
            state.currentValue += '.';
        }
        updateDisplay();
    }

    function compute(a, op, b) {
        const left = parseFloat(a);
        const right = parseFloat(b);
        switch (op) {
            case '+': return left + right;
            case '-': return left - right;
            case '*': return left * right;
            case '/': return right !== 0 ? left / right : 'Error';
            default: return right;
        }
    }

    const opSymbols = { '+': '+', '-': '−', '*': '×', '/': '÷' };

    function setOperator(op) {
        const current = parseFloat(state.currentValue);
        if (state.operator && !state.shouldReset) {
            const result = compute(state.previousValue, state.operator, current);
            if (result === 'Error') {
                state.currentValue = 'Error';
                state.operator = null;
                state.previousValue = null;
                state.expression = 'Error';
                updateDisplay();
                return;
            }
            state.currentValue = String(result);
        }
        state.previousValue = state.currentValue;
        state.operator = op;
        state.shouldReset = true;
        state.expression = `${state.previousValue} ${opSymbols[op]}`;
        updateDisplay();
    }

    function calculate() {
        if (!state.operator || state.shouldReset) {
            if (!state.operator) return;
            if (state.shouldReset && state.previousValue) {
                const result = compute(state.previousValue, state.operator, parseFloat(state.currentValue));
                if (result === 'Error') {
                    state.currentValue = 'Error';
                } else {
                    state.currentValue = String(result);
                }
                state.expression = `${state.previousValue} ${opSymbols[state.operator]} ${state.currentValue} =`;
                state.operator = null;
                state.previousValue = null;
                state.shouldReset = true;
                updateDisplay();
                return;
            }
            return;
        }
        const current = parseFloat(state.currentValue);
        const result = compute(state.previousValue, state.operator, current);
        state.expression = `${state.previousValue} ${opSymbols[state.operator]} ${state.currentValue} =`;
        if (result === 'Error') {
            state.currentValue = 'Error';
        } else {
            state.currentValue = String(result);
        }
        state.operator = null;
        state.previousValue = null;
        state.shouldReset = true;
        updateDisplay();
    }

    function percent() {
        const current = parseFloat(state.currentValue);
        if (isNaN(current)) return;
        state.expression = `${state.currentValue}%`;
        state.currentValue = String(current / 100);
        state.shouldReset = true;
        updateDisplay();
    }

    function sqrt() {
        const current = parseFloat(state.currentValue);
        if (isNaN(current) || current < 0) {
            state.expression = `√(${state.currentValue})`;
            state.currentValue = 'Error';
        } else {
            state.expression = `√(${state.currentValue})`;
            state.currentValue = String(Math.sqrt(current));
        }
        state.shouldReset = true;
        state.operator = null;
        state.previousValue = null;
        updateDisplay();
    }

    function square() {
        const current = parseFloat(state.currentValue);
        if (isNaN(current)) return;
        state.expression = `sqr(${state.currentValue})`;
        state.currentValue = String(current * current);
        state.shouldReset = true;
        state.operator = null;
        state.previousValue = null;
        updateDisplay();
    }

    function half() {
        const current = parseFloat(state.currentValue);
        if (isNaN(current)) return;
        state.expression = `½(${state.currentValue})`;
        state.currentValue = String(current / 2);
        state.shouldReset = true;
        state.operator = null;
        state.previousValue = null;
        updateDisplay();
    }

    function backspace() {
        if (state.currentValue === 'Error') {
            state.currentValue = '0';
            updateDisplay();
            return;
        }
        if (state.shouldReset) return;
        if (state.currentValue.length > 1) {
            state.currentValue = state.currentValue.slice(0, -1);
        } else {
            state.currentValue = '0';
        }
        updateDisplay();
    }

    function clearAll() {
        state.currentValue = '0';
        state.previousValue = null;
        state.operator = null;
        state.shouldReset = false;
        state.expression = '';
        updateDisplay();
    }

    function handleButton(btn) {
        const action = btn.dataset.action;
        const value = btn.dataset.value;
        if (value !== undefined) {
            if (value === '.') {
                inputDecimal();
            } else {
                inputDigit(value);
            }
            return;
        }
        switch (action) {
            case 'clear': clearAll(); break;
            case 'backspace': backspace(); break;
            case 'percent': percent(); break;
            case 'divide': setOperator('/'); break;
            case 'multiply': setOperator('*'); break;
            case 'subtract': setOperator('-'); break;
            case 'add': setOperator('+'); break;
            case 'sqrt': sqrt(); break;
            case 'square': square(); break;
            case 'half': half(); break;
            case 'equals': calculate(); break;
        }
    }

    function handleKeyboard(e) {
        if (e.key >= '0' && e.key <= '9') {
            inputDigit(e.key);
            e.preventDefault();
        } else if (e.key === '.') {
            inputDecimal();
            e.preventDefault();
        } else if (e.key === '+') {
            setOperator('+');
            e.preventDefault();
        } else if (e.key === '-') {
            setOperator('-');
            e.preventDefault();
        } else if (e.key === '*') {
            setOperator('*');
            e.preventDefault();
        } else if (e.key === '/') {
            setOperator('/');
            e.preventDefault();
        } else if (e.key === 'Enter' || e.key === '=') {
            calculate();
            e.preventDefault();
        } else if (e.key === 'Backspace') {
            backspace();
            e.preventDefault();
        } else if (e.key === 'Escape') {
            clearAll();
            e.preventDefault();
        } else if (e.key === '%') {
            percent();
            e.preventDefault();
        }
    }

    function toggleTheme() {
        const isLight = document.body.getAttribute('data-theme') === 'light';
        if (isLight) {
            document.body.removeAttribute('data-theme');
            themeToggle.textContent = '\uD83C\uDF19';
        } else {
            document.body.setAttribute('data-theme', 'light');
            themeToggle.textContent = '\u2600\uFE0F';
        }
    }

    document.querySelectorAll('.btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            handleButton(this);
        });
    });

    document.addEventListener('keydown', handleKeyboard);
    themeToggle.addEventListener('click', toggleTheme);

    updateDisplay();
})();
