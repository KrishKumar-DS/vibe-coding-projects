// Application logic for Gym Progression Tracker — V1 Step 1

import { workouts } from './data/workouts.js';
import { exercises } from './data/exercises.js';

// ── DOM elements ──────────────────────────────────────────────────────
const homeScreen   = document.getElementById('home-screen');
const workoutScreen = document.getElementById('workout-screen');
const historyScreen = document.getElementById('history-screen');

const dateDisplay   = document.getElementById('current-date');
const dayDisplay    = document.getElementById('current-day');
const workoutNameDisplay = document.getElementById('workout-name');
const exercisesListDisplay = document.getElementById('exercises-list');
const workoutStatusDisplay = document.getElementById('workout-status'); // single element

const startWorkoutBtn = document.getElementById('start-workout-btn');
const backHomeBtn     = document.getElementById('back-home-btn');

// ── State ─────────────────────────────────────────────────────────────
let selectedDay = null; // null → today, otherwise key like 'monday'

// ── Day mapping ───────────────────────────────────────────────────────
const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const dayToKey = {
  monday: 'monday', tuesday: 'tuesday', wednesday: 'wednesday',
  thursday: 'thursday', friday: 'friday', saturday: 'saturday', sunday: 'sunday',
};

// ── Format date like PRD: "03 October 2026" ───────────────────────────
function formatDateLikePRD(now) {
  const day = now.getDate();
  const month = now.toLocaleString(undefined, { month: 'long' });
  const year = now.getFullYear();
  return `${day} ${month} ${year}`;
}

// ── Get current date info ────────────────────────────────────────────
function getCurrentDateInfo() {
  const now = new Date();
  const dayOfWeek = now.toLocaleDateString(undefined, { weekday: 'long' });
  const formattedDate = formatDateLikePRD(now);
  return { dayOfWeek, formattedDate, now };
}

// ── Map day name to workout key ──────────────────────────────────────
function dayNameToKey(dayName) {
  return dayToKey[dayName.toLowerCase()] || null;
}

// ── Get workout for a day key ───────────────────────────────────────
function getWorkoutForDay(dayKey) {
  if (dayKey === 'sunday') {
    return { ...workouts.sunday, isRestDay: true, day: 'Sunday', name: 'Rest' };
  }
  return workouts[dayKey] || workouts.monday;
}

// ── Show exactly one screen ──────────────────────────────────────────
function showScreen(screen) {
  [homeScreen, workoutScreen, historyScreen].forEach(s => s.style.display = 'none');
  screen.style.display = 'block';
}

// ── Render the 7-day strip ──────────────────────────────────────────
function renderDayStrip() {
  const strip = document.getElementById('day-strip');
  if (!strip) return;

  strip.innerHTML = dayNames.map(key => {
    const workout = getWorkoutForDay(key);
    const isToday = selectedDay === key;
    const isSelected = selectedDay === key;
    const dayLabel = workout.day; // e.g. "Monday"

    return `
      <button class="day-button ${isSelected ? 'selected' : ''}" data-day="${key}">
        ${dayLabel}
      </button>
    `;
  }).join('');

  // re-attach listeners after re-render
  attachDayButtonListeners();
}

// ── Attach day-button listeners ─────────────────────────────────────
function attachDayButtonListeners() {
  document.querySelectorAll('.day-button').forEach(btn => {
    btn.replaceWith(btn.cloneNode(true)); // simple re-attach hack
  });
  // Better: use event delegation below (kept simple)
  document.querySelectorAll('.day-button').forEach(btn => {
    btn.addEventListener('click', () => {
      const dayKey = btn.dataset.day;
      selectDay(dayKey);
    });
  });
}

// ── Select a day (FR-03) ──────────────────────────────────────────
function selectDay(dayKey) {
  selectedDay = dayKey;
  renderDayStrip();

  const workout = getWorkoutForDay(dayKey);
  displayWorkout(workout);
  // Changing day does NOT create a workout record (FR-03)
}

// ── Display workout ─────────────────────────────────────────────────
function displayWorkout(workout) {
  // Update header
  workoutNameDisplay.textContent = `${workout.day}`;

  // Update status
  if (workoutStatusDisplay) {
    workoutStatusDisplay.textContent = 'Not Started';
  }

  if (workout.isRestDay) {
    // Sunday rest state
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

  // Render exercises
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

  // Ensure workout screen is showing
  showScreen(workoutScreen);
}

// ── Initialization ──────────────────────────────────────────────────
function init() {
  const dateInfo = getCurrentDateInfo();

  // ── Home screen: date + day ────────────────────────────────────
  if (dayDisplay) dayDisplay.textContent = dateInfo.dayOfWeek;
  if (dateDisplay) dateDisplay.textContent = dateInfo.formattedDate;

  // ── Select today initially ─────────────────────────────────────
  selectedDay = dayNameToKey(dateInfo.dayOfWeek) || null;

  // ── Render day strip (FR-03 manual selection) ──────────────────
  renderDayStrip();

  // ── Load today's workout ───────────────────────────────────────
  const todayWorkout = getWorkoutForDay(selectedDay);
  displayWorkout(todayWorkout);

  // ── Home: "Start Today's Workout" ──────────────────────────────
  if (startWorkoutBtn) {
    startWorkoutBtn.replaceWith(startWorkoutBtn.cloneNode(true)); // reset
  }
  const newStartBtn = document.getElementById('start-workout-btn');
  if (newStartBtn) {
    newStartBtn.addEventListener('click', () => {
      showScreen(workoutScreen);
    });
  }

  // ── Back Home ──────────────────────────────────────────────────
  if (backHomeBtn) {
    backHomeBtn.addEventListener('click', () => {
      showScreen(homeScreen);
    });
  }
}

// ── Kick off ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
