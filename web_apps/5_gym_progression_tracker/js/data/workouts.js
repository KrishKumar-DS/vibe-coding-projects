/**
 * Workout templates organized by day of the week.
 * Monday through Sunday, with Sunday being a rest day.
 */

export const workouts = {
  // Monday — Push A
  monday: {
    day: 'Monday',
    name: 'Push A',
    exercises: [
      { exerciseId: 'machine-chest-press', sets: 2, reps: '8-12' },
      { exerciseId: 'incline-dumbbell-press', sets: 2, reps: '8-12' },
      { exerciseId: 'machine-shoulder-press', sets: 2, reps: '8-12' },
      { exerciseId: 'lateral-raise', sets: 2, reps: '12-15' },
      { exerciseId: 'cable-triceps-pushdown', sets: 2, reps: '10-15' },
    ],
  },

  // Tuesday — Pull A
  tuesday: {
    day: 'Tuesday',
    name: 'Pull A',
    exercises: [
      { exerciseId: 'lat-pulldown', sets: 2, reps: '8-12' },
      { exerciseId: 'seated-cable-row', sets: 2, reps: '8-12' },
      { exerciseId: 'chest-supported-row', sets: 2, reps: '8-12' },
      { exerciseId: 'reverse-pec-deck', sets: 2, reps: '12-15' },
      { exerciseId: 'dumbbell-curl', sets: 2, reps: '10-15' },
    ],
  },

  // Wednesday — Legs A
  wednesday: {
    day: 'Wednesday',
    name: 'Legs A',
    exercises: [
      { exerciseId: 'leg-press', sets: 2, reps: '8-12' },
      { exerciseId: 'leg-curl', sets: 2, reps: '10-15' },
      { exerciseId: 'leg-extension', sets: 2, reps: '10-15' },
      { exerciseId: 'calf-raise', sets: 2, reps: '12-15' },
      { exerciseId: 'cable-machine-crunch', sets: 2, reps: '10-15' },
    ],
  },

  // Thursday — Push B
  thursday: {
    day: 'Thursday',
    name: 'Push B',
    exercises: [
      { exerciseId: 'incline-machine-press', sets: 2, reps: '8-12' },
      { exerciseId: 'machine-chest-press', sets: 2, reps: '8-12' },
      { exerciseId: 'lateral-raise', sets: 2, reps: '12-15' },
      { exerciseId: 'shoulder-press', sets: 2, reps: '8-12' },
      { exerciseId: 'overhead-triceps-extension', sets: 2, reps: '10-15' },
    ],
  },

  // Friday — Pull B
  friday: {
    day: 'Friday',
    name: 'Pull B',
    exercises: [
      { exerciseId: 'lat-pulldown', sets: 2, reps: '8-12' },
      { exerciseId: 'seated-cable-row', sets: 2, reps: '8-12' },
      { exerciseId: 'single-arm-cable-row', sets: 2, reps: '8-12' },
      { exerciseId: 'reverse-pec-deck', sets: 2, reps: '12-15' },
      { exerciseId: 'hammer-curl', sets: 2, reps: '10-15' },
    ],
  },

  // Saturday — Legs B
  saturday: {
    day: 'Saturday',
    name: 'Legs B',
    exercises: [
      { exerciseId: 'goblet-squat', sets: 2, reps: '8-12' },
      { exerciseId: 'romanian-deadlift', sets: 2, reps: '8-12' },
      { exerciseId: 'leg-press', sets: 2, reps: '10-12' },
      { exerciseId: 'calf-raise', sets: 2, reps: '12-15' },
      { exerciseId: 'hanging-knee-raise', sets: 2, reps: '8-15' },
    ],
  },

  // Sunday — Rest
  sunday: {
    day: 'Sunday',
    name: 'Rest',
    exercises: [],
    isRestDay: true,
  },
};
