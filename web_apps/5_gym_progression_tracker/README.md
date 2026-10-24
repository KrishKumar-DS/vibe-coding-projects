# Gym Progression Tracker

A lightweight, client-side web app for logging workouts, reviewing history, and tracking strength progression over time.

No accounts, no backend, no build step. Open `index.html` in a browser and start training.

---

## Quick Start

1. Open `index.html` in any modern browser (double-click it, or serve the folder locally).
2. The app boots on today's date and shows the routine for that weekday.
3. Enter weight and reps per set, tick the sets you completed, then press **Finish & Save Workout**.
4. Your workout appears under **History**.

The app works offline after the first load. All data lives in your browser's `localStorage`.

---

## Views

| View | Purpose |
|------|---------|
| **Today** | Perform and record the current (or past) workout. Pick a date or weekday, enter sets, skip/remove exercises, add extra exercises. |
| **History** | Review saved workouts grouped by year. Expand a workout for details, volume, and Edit/Delete actions. |
| **Progress** | Select an exercise to see best weight, estimated 1RM, session count, a top-set weight graph, and recent sessions. |
| **Routine** | Configure the routine for each day (name, exercises, muscle groups, set/rep ranges). Also contains backup, restore, and theme settings. |

---

## Logging a Workout

- **Date / day** — Use the date picker or the Mon–Sun chips. Future dates are disabled; past dates are allowed.
- **Sets** — Enter `kg` and reps for each set. Tick the checkbox to mark a set as completed.
- **Add / remove sets** — `+ Set` adds a row; `✕` next to a row removes it.
- **Copy weight** — `Copy weight to all` copies the first set's weight to every set in that exercise.
- **Skip / include** — `Skip` grays out an exercise; `Include` brings it back. Skipped exercises are not saved.
- **Add exercise** — Use the **Add exercise** card at the bottom to append a custom exercise for this session only.
- **Edit / delete** — From History, `Edit` reopens the saved workout (changes update the original record), and `Delete` asks for confirmation.

Only sets that are ticked **and** have repetitions are saved.

---

## Progress

The Progress view groups exercise history by a stable exercise identity, so renaming a routine exercise does not split its history.

- **Best weight** — highest weight recorded for the exercise.
- **Est. 1RM** — `Weight × (1 + Reps / 30)`, taking the highest estimate across recorded sets. This is an estimate, not a tested max.
- **Sessions** — number of workouts containing that exercise.
- **Graph** — top-set weight per session.
- **Recent sessions** — the latest top-set weight and reps.

---

## Backing Up & Restoring

> **Important:** Your workout data is stored only in this browser via `localStorage`. Clearing browser data, using a different browser/device, or private browsing can lose it. **Create backups regularly.**

### Create a backup

1. Go to **Routine**.
2. Under **Backup**, press **Copy backup**.
3. The full app state is serialized as JSON and copied to your clipboard (a text prompt appears if clipboard access is blocked).
4. Paste it somewhere safe — a notes app, a file, or cloud storage.

### Restore a backup

1. Go to **Routine**.
2. Press **Restore**.
3. Paste the backup JSON into the prompt.
4. The app validates the `plan` and `logs` structures before replacing your current state.

A malformed or incompatible backup is rejected and your current data is left untouched.

---

## Themes

The app follows your operating system's light/dark preference by default.

To override it:

1. Go to **Routine**.
2. Press the **Theme** button to cycle **Light → Dark → System**.
3. Your choice is saved and restored on the next visit.

---

## Running Tests

The project includes a dependency-free regression suite that loads the app in a Node `vm` with a stubbed DOM and `localStorage`.

```bash
node tests/run-tests.mjs
```

Expected tail of the output:

```
============================================================
151 passed, 0 failed
```

No dependencies are required — just Node.js.

---

## Project Structure

```
5_gym_progression_tracker/
├── index.html          # App shell (main container + bottom nav)
├── README.md           # This file
├── css/
│   └── style.css       # Styles and light/dark theme variables
├── js/
│   ├── store.js        # localStorage adapter (`Store`)
│   └── app.js          # State, views, and event handlers
├── tests/
│   └── run-tests.mjs   # Regression tests
└── docs/
    └── PRD.md          # Product Requirements Document
```

---

## How Data Is Stored

State is persisted in `localStorage` under three keys:

| Key | Contents |
|-----|----------|
| `gym_data` | Routine plan (`plan`) and saved workout history (`logs`). |
| `gym_draft` | The in-progress workout draft, kept separate from completed history. |
| `gym_theme` | Your theme preference (`light`, `dark`, or `system`). |

If saved data is ever unreadable, the app keeps a recovery copy under a `gym_data_recovery_<timestamp>` key and falls back to defaults.

---

## Limitations

- **Browser-only storage.** Data does not sync across devices or browsers.
- **Manual backups only.** There is no automatic cloud backup.
- **No accounts or authentication.**
- **No backend or database.**
- **Basic analytics.** Progression focuses on top-set weight, estimated 1RM, session count, and workout volume.
- **No nutrition, body-weight, RPE/RIR, rest timer, or PR detection** in this version.

See `docs/PRD.md` for the full requirements, data model, and future scope.

---

## Product Principle

> **Plan → Train → Record → Review → Improve**

Every feature should be judged against this loop. If it adds complexity without improving workout tracking, progression, or decision-making, it should not be prioritized.
