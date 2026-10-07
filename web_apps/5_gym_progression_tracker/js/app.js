import { workouts } from './data/workouts.js';
import { exercises } from './data/exercises.js';

const homeScreen = document.getElementById('home-screen');
const workoutScreen = document.getElementById('workout-screen');
const historyScreen = document.getElementById('history-screen');

const dateDisplay = document.getElementById('current-date');
const dayDisplay = document.getElementById('current-day');
const workoutNameDisplay = document.getElementById('workout-name');
const exercisesListDisplay = document.getElementById('exercises-list');
const workoutStatusDisplay = document.getElementById('workout-status');

const startWorkoutBtn = document.getElementById('start-workout-btn');
const backHomeBtn = document.getElementById('back-home-btn');

let selectedDay = null;

const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const dayToKey = {
  monday: 'monday', tuesday: 'tuesday', wednesday: 'wednesday',
  thursday: 'thursday', friday: 'friday', saturday: 'saturday', sunday: 'sunday',
};

function formatDateLikePRD(now) {
  const day = now.getDate();
  const month = now.toLocaleString(undefined, { month: 'long' });
  const year = now.getFullYear();
  return `${day} ${month} ${year}`;
}

function getCurrentDateInfo() {
  const now = new Date();
  const dayOfWeek = now.toLocaleDateString(undefined, { weekday: 'long' });
  const formattedDate = formatDateLikePRD(now);
  return { dayOfWeek, formattedDate, now };
}

function dayNameToKey(dayName) {
  return dayToKey[dayName.toLowerCase()] || null;
}

function getWorkoutForDay(dayKey) {
  if (dayKey === 'sunday') {
    return { ...workouts.sunday, isRestDay: true, day: 'Sunday', name: 'Rest' };
  }
  return workouts[dayKey] || workouts.monday;
}

function showScreen(screen) {
  [homeScreen, workoutScreen, historyScreen].forEach(s => s.style.display = 'none');
  screen.style.display = 'block';
}

function renderDayStrip() {
  const strip = document.getElementById('day-strip');
  if (!strip) return;

  strip.innerHTML = dayNames.map(key => {
    const workout = getWorkoutForDay(key);
    const isToday = selectedDay === key;
    const isSelected = selectedDay === key;
    const dayLabel = workout.day;

    return `
      <button class="day-button ${isSelected ? 'selected' : ''}" data-day="${key}">
        ${dayLabel}
      </button>
    `;
  }).join('');

  attachDayButtonListeners();
}

function attachDayButtonListeners() {
  document.querySelectorAll('.day-button').forEach(btn => {
    btn.replaceWith(btn.cloneNode(true));
  });
  document.querySelectorAll('.day-button').forEach(btn => {
    btn.addEventListener('click', () => {
      const dayKey = btn.dataset.day;
      selectDay(dayKey);
    });
  });
}

function selectDay(dayKey) {
  selectedDay = dayKey;
  renderDayStrip();

  const workout = getWorkoutForDay(dayKey);
  displayWorkout(workout);
}

function displayWorkout(workout) {
  workoutNameDisplay.textContent = `${workout.day}`;

  if (workoutStatusDisplay) {
    workoutStatusDisplay.textContent = 'Not Started';
  }

  if (workout.isRestDay) {
    exercisesListDisplay.innerHTML = `
      <div class="rest-day">
        <h2>Sunday</h2>
        <p>Full Rest + Walking Day</p>
        <p>No resistance-training workout is scheduled.</p>
      </div>
    `;
    showScreen(workoutScreen);
    return;
  }

  const exerciseNodes = workout.exercises.map(ex => {
    const exData = exercises.find(e => e.id === ex.exerciseId);
    const name = exData ? exData.name : ex.exerciseId.replace(/-/g, ' ');
    const reps = exData ? exData.defaultRepRange : ex.reps;
    return `
      <div class="exercise-entry">
        <strong>${name}</strong>
        <span class="target-specs">${ex.sets} × ${reps}</span>
        <span class="target-sets">${ex.sets} Target Sets</span>
      </div>
    `;
  });

  exercisesListDisplay.innerHTML = exerciseNodes.join('');

  showScreen(workoutScreen);
}

function init() {
  const dateInfo = getCurrentDateInfo();

  if (dayDisplay) dayDisplay.textContent = dateInfo.dayOfWeek;
  if (dateDisplay) dateDisplay.textContent = dateInfo.formattedDate;

  selectedDay = dayNameToKey(dateInfo.dayOfWeek) || null;

  renderDayStrip();

  const todayWorkout = getWorkoutForDay(selectedDay);
  displayWorkout(todayWorkout);

  if (startWorkoutBtn) {
    startWorkoutBtn.replaceWith(startWorkoutBtn.cloneNode(true));
  }
  const newStartBtn = document.getElementById('start-workout-btn');
  if (newStartBtn) {
    newStartBtn.addEventListener('click', () => {
      showScreen(workoutScreen);
    });
  }

  if (backHomeBtn) {
    backHomeBtn.addEventListener('click', () => {
      showScreen(homeScreen);
    });
  }
}

document.addEventListener('DOMContentLoaded', init);
