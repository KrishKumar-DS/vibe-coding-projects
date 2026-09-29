const colors = [
    { hex: '#FF6B6B', locked: false },
    { hex: '#4ECDC4', locked: false },
    { hex: '#45B7D1', locked: false },
    { hex: '#96CEB4', locked: false },
    { hex: '#FECA57', locked: false }
];

const cards = document.querySelectorAll('.color-card');
const generateBtn = document.getElementById('generateBtn');

function generateRandomHex() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}

function updateCardUI(index, newHex = null) {
    const card = cards[index];
    const colorDisplay = card.querySelector('.color-display');
    const hexValue = card.querySelector('.hex-value');
    const toggleInput = card.querySelector('.toggle-input');
    const copyFeedback = card.querySelector('.copy-feedback');
    
    if (newHex) {
        colors[index].hex = newHex;
        colorDisplay.style.backgroundColor = newHex;
        hexValue.textContent = newHex;
    }
    
    if (toggleInput) {
        toggleInput.checked = colors[index].locked;
    }
}

function showCopyFeedback(card) {
    const copyFeedback = card.querySelector('.copy-feedback');
    copyFeedback.classList.add('show');
    setTimeout(() => {
        copyFeedback.classList.remove('show');
    }, 1500);
}

function copyToClipboard(hex, card) {
    navigator.clipboard.writeText(hex).then(() => {
        showCopyFeedback(card);
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

function init() {
    colors.forEach((color, index) => {
        updateCardUI(index);
    });
    
    cards.forEach((card, index) => {
        const copyBtn = card.querySelector('.copy-btn');
        const toggleInput = card.querySelector('.toggle-input');
        
        copyBtn.addEventListener('click', () => {
            copyToClipboard(colors[index].hex, card);
        });
        
        if (toggleInput) {
            toggleInput.addEventListener('change', (e) => {
                colors[index].locked = e.target.checked;
            });
        }
    });
}

function generateNewPalette() {
    colors.forEach((color, index) => {
        if (!color.locked) {
            const newHex = generateRandomHex();
            updateCardUI(index, newHex);
        }
    });
}

generateBtn.addEventListener('click', generateNewPalette);

init();