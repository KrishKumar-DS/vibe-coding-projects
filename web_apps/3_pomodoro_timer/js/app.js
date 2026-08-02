const state = {
    mode: 'focus',
    timeRemaining: 25 * 60,
    originalTime: 25 * 60,
    timerId: null,
    isRunning: false,
    pomodoroCount: parseInt(localStorage.getItem('pomodoroCount')) || 0,
};

const DOM = {
    modeBtns: document.querySelectorAll('.mode-btn'),
    timerDisplay: document.getElementById('timerDisplay'),
    modeLabel: document.getElementById('modeLabel'),
    timerContainer: document.getElementById('timerContainer'),
    progressRing: document.querySelector('.progress-ring__circle'),
    startBtn: document.getElementById('startBtn'),
    resetBtn: document.getElementById('resetBtn'),
    durationBtns: document.querySelectorAll('.duration-btn'),
    customMinutes: document.getElementById('customMinutes'),
    setCustomDuration: document.getElementById('setCustomDuration'),
    pomodoroCount: document.getElementById('pomodoroCount'),
};

const presets = {
    focus: [15 * 60, 25 * 60, 30 * 60, 45 * 60, 60 * 60],
    break: [5 * 60, 10 * 60, 15 * 60, 20 * 60, 30 * 60],
};

const colors = {
    focus: '#ffffff',
    break: '#9e9e9e',
};

let audioContext = null;

function initAudio() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
        try {
            audioContext = new AudioCtx();
        } catch (e) {
            console.log('Error creating AudioContext:', e);
        }
    } else {
        console.log('Web Audio API not supported');
    }
}

function playBeep() {
    if (!audioContext) return;

    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.5);

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 1);
    } catch (e) {
        console.log('Error playing audio:', e);
    }
}

function updateDisplay() {
    const minutes = Math.floor(state.timeRemaining / 60);
    const seconds = state.timeRemaining % 60;
    DOM.timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    DOM.modeLabel.textContent = state.mode.toUpperCase();

    if (state.mode === 'focus') {
        DOM.modeLabel.style.color = '#ffffff';
        DOM.progressRing.style.stroke = 'url(#gradient)';
        document.documentElement.style.setProperty('--mode-color', '#ffffff');
    } else {
        DOM.modeLabel.style.color = '#9e9e9e';
        DOM.progressRing.style.stroke = '#9e9e9e';
        document.documentElement.style.setProperty('--mode-color', '#9e9e9e');
    }

    if (state.isRunning) {
        DOM.timerDisplay.classList.remove('paused');
    } else {
        DOM.timerDisplay.classList.add('paused');
    }

    updateProgressRing();

    if (state.timeRemaining <= 0) {
        completeSession();
    }
}

function updateProgressRing() {
    const duration = state.originalTime;
    const progress = 1 - (state.timeRemaining / duration);
    const strokeDasharray = 282.7;
    const strokeDashoffset = strokeDasharray * (1 - progress);
    DOM.progressRing.style.strokeDashoffset = strokeDashoffset;
}

function startTimer() {
    if (state.isRunning) return;

    state.isRunning = true;
    DOM.startBtn.textContent = 'Pause';

    state.timerId = setInterval(() => {
        state.timeRemaining--;
        updateDisplay();
        updateTabTitle();
    }, 1000);
}

function pauseTimer() {
    if (!state.isRunning) return;

    state.isRunning = false;
    DOM.startBtn.textContent = 'Start';
    clearInterval(state.timerId);
}

function resetTimer() {
    pauseTimer();
    state.timeRemaining = state.originalTime;
    updateDisplay();
    updateTabTitle();
}

function setDuration(minutes) {
    const duration = minutes * 60;
    state.originalTime = duration;
    state.timeRemaining = duration;
    updateDisplay();
    updateTabTitle();

    DOM.durationBtns.forEach(btn => {
        btn.classList.remove('active');
    });

    DOM.customMinutes.value = minutes;
}

function completeSession() {
    pauseTimer();
    playBeep();

    updateTabTitle('Session Complete!', true);

    DOM.timerContainer.classList.add('complete');
    setTimeout(() => {
        DOM.timerContainer.classList.remove('complete');
    }, 500);

    if (state.mode === 'focus') {
        state.pomodoroCount++;
        DOM.pomodoroCount.textContent = state.pomodoroCount;
        localStorage.setItem('pomodoroCount', state.pomodoroCount);

        switchMode('break');
    } else {
        switchMode('focus');
    }
}

function switchMode(newMode) {
    state.mode = newMode;
    DOM.modeBtns.forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.mode-btn[data-mode="${newMode}"]`).classList.add('active');

    const modeMinutes = newMode === 'focus' ? 25 : 5;
    state.timeRemaining = modeMinutes * 60;
    state.originalTime = modeMinutes * 60;
    updateDisplay();
    updateTabTitle();
}

function updateTabTitle(title = null, isComplete = false) {
    const baseTitle = 'Pomodoro Timer';
    if (title) {
        document.title = title;
        setTimeout(() => {
            document.title = baseTitle;
        }, 3000);
    } else {
        const minutes = Math.floor(state.timeRemaining / 60);
        const seconds = state.timeRemaining % 60;
        document.title = `${minutes}:${seconds.toString().padStart(2, '0')} - ${baseTitle}`;
    }

    if (isComplete) {
        document.title = '🎉 Session Complete! 🎉 - ' + baseTitle;
        setTimeout(() => {
            document.title = baseTitle;
        }, 3000);
    }
}

function handleKeyboard(e) {
    if (e.code === 'Space') {
        e.preventDefault();
        if (state.isRunning) {
            pauseTimer();
        } else {
            startTimer();
        }
    }

    if (e.code === 'KeyR') {
        e.preventDefault();
        resetTimer();
    }
}

function init() {
    initAudio();

    DOM.modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const newMode = btn.dataset.mode;
            if (state.mode !== newMode) {
                switchMode(newMode);
            }
        });
    });

    DOM.durationBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const duration = parseInt(btn.dataset.duration);
            setDuration(duration);
        });
    });

    DOM.setCustomDuration.addEventListener('click', () => {
        const minutes = parseInt(DOM.customMinutes.value);
        if (minutes >= 1 && minutes <= 120) {
            setDuration(minutes);
        }
    });

    DOM.customMinutes.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const minutes = parseInt(DOM.customMinutes.value);
            if (minutes >= 1 && minutes <= 120) {
                setDuration(minutes);
            }
        }
    });

    DOM.startBtn.addEventListener('click', () => {
        if (state.isRunning) {
            pauseTimer();
        } else {
            startTimer();
        }
    });

    DOM.resetBtn.addEventListener('click', resetTimer);

    document.addEventListener('keydown', handleKeyboard);

    updateDisplay();
}

init();
