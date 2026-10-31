# Gym Progression Tracker — Product Requirements Document

**Project Type:** Personal Web Application
**Project Stage:** MVP / Functional Prototype
**Technology:** HTML5, CSS3, vanilla JavaScript (ES2020+)
**Architecture:** Static multi-file client-side application
**Data Storage:** Browser `localStorage`
**Target Platform:** Mobile-first responsive web; desktop supported
**Build Step:** None
**External Dependencies:** None
**Automated Tests:** `node tests/run-tests.mjs` — 151 tests as of 2026-10-26
**Document Status:** Aligned with the current implementation

---

# 1. Product Overview

## 1.1 Product Name

**Gym Progression Tracker**

## 1.2 Product Purpose

Gym Progression Tracker is a personal workout tracking web application designed to make it easy to:

- Follow a predefined workout routine.
- Record exercises, sets, weight, and repetitions.
- Review previous workouts.
- Edit or delete workout records.
- Monitor exercise progression over time.
- Customize the workout routine.
- Preserve workout data locally in the browser.
- Persist an in-progress workout draft across reloads.
- Create and restore manual backups.
- Choose a light, dark, or system appearance.

The primary objective is to replace manual workout tracking with a simple, structured digital system.

## 1.3 Current Implementation at a Glance

The current implementation is a static, framework-free web application:

```text
index.html          Application shell and navigation containers
css/style.css       Layout, controls, and theme variables
js/store.js         localStorage adapter
js/app.js           State, normalization, views, and event handlers
tests/run-tests.mjs Dependency-free regression tests
docs/PRD.md         This document
```

Key implementation characteristics:

- No backend, account system, database, build step, or external JavaScript dependency.
- All application state is held in memory and persisted to `localStorage`.
- The UI renders four views by replacing the contents of the main container.
- Workout drafts are saved after every edit.
- The theme is persisted separately from workout data.
- Stable exercise identities link routine exercises to workout history.
- The test suite loads the application in a Node `vm` with a stubbed DOM and in-memory `localStorage`.

---

# 2. Problem Statement

Traditional workout tracking can become difficult when workout information is stored across notebooks, phone notes, spreadsheets, or memory.

The application solves this by providing a centralized system where workout data can be recorded in a consistent structure.

The system should answer questions such as:

- What workout am I performing today?
- What weight did I use previously?
- How many repetitions did I perform?
- What exercises are included in my routine?
- How has my performance changed over time?
- How much training volume did I perform?
- Can I review or correct a previous workout?
- Did my unsaved workout survive a reload?
- Can I recover my data after a storage or import problem?

---

# 3. Goals

## 3.1 Primary Goals

1. Make workout logging fast and simple.
2. Maintain a structured workout history.
3. Make previous performance visible while logging a new workout.
4. Allow the user to customize their workout routine.
5. Provide basic progression analytics.
6. Store data without requiring a backend or account.
7. Allow manual backup and restoration of workout data.
8. Keep exercise identity stable when routine exercises are renamed.

## 3.2 Secondary Goals

1. Minimize unnecessary UI complexity.
2. Keep the application lightweight.
3. Make the application usable without a network connection or build process.
4. Keep the architecture simple enough to understand and maintain.
5. Preserve an in-progress workout across reloads.
6. Detect and report storage failures instead of silently losing changes.
7. Recover from unreadable stored data without crashing.
8. Provide a persistent light / dark / system theme choice.

---

# 4. Non-Goals

The current version does NOT attempt to provide:

- User accounts.
- Authentication.
- Cloud synchronization.
- A backend server.
- A remote database.
- Social features.
- Trainer or coaching functionality.
- Nutrition tracking.
- Body-weight tracking.
- Sleep tracking.
- Wearable or device integration.
- AI-generated workout plans.
- Automatic cloud backups.
- Multi-user support.
- Personal-record detection.
- RPE / RIR tracking.
- A rest timer.
- A service worker or installable PWA.

These may be considered future features but are outside the current MVP.

---

# 5. Target User

## Primary User

A single individual who regularly performs resistance training and wants to track workout performance and progression.

The current application is designed primarily for personal use rather than as a commercial multi-user fitness platform.

---

# 6. Core User Stories

## Workout Logging

- As a user, I want to see my workout routine for a selected day.
- As a user, I want to select a workout date, including past dates.
- As a user, I want to enter the weight used for each set.
- As a user, I want to enter repetitions for each set.
- As a user, I want to mark sets as completed.
- As a user, I want to skip an exercise when necessary.
- As a user, I want to add an additional exercise to a workout.
- As a user, I want to add or remove individual sets.
- As a user, I want to copy a weight across all sets of an exercise.
- As a user, I want my in-progress workout to survive a page reload.

## Previous Performance

- As a user, I want to see my previous sets for an exercise while logging.
- As a user, I want the application to pre-fill the previous weight when possible.

The current implementation retrieves the most recent prior session for the exercise and uses its weights when constructing a new workout draft.

## Workout History

- As a user, I want to see previously completed workouts.
- As a user, I want workouts grouped by year.
- As a user, I want to see the exercises and sets recorded in a workout.
- As a user, I want to edit an existing workout.
- As a user, I want to delete an existing workout.
- As a user, I want to log workouts for previous dates.
- As a user, I want to see training volume for each workout.

## Progression

- As a user, I want to select an exercise.
- As a user, I want to see my best recorded weight.
- As a user, I want to see an estimated 1RM.
- As a user, I want to see the number of sessions containing the exercise.
- As a user, I want to visualize weight progression over time.
- As a user, I want renaming an exercise to preserve its history.

## Routine Management

- As a user, I want to define a routine for each day.
- As a user, I want to rename a workout day.
- As a user, I want to add exercises to a routine.
- As a user, I want to remove exercises.
- As a user, I want to define set ranges.
- As a user, I want to define repetition ranges.
- As a user, I want to define the target muscle group.
- As a user, I want routine changes to persist automatically.

## Data Management

- As a user, I want workout data to persist after refreshing the page.
- As a user, I want to manually create a backup.
- As a user, I want to restore data from a backup.
- As a user, I want to be warned when the browser cannot save my changes.
- As a user, I want the application to keep a recovery copy when stored data is unreadable.

## Appearance

- As a user, I want the application to follow my operating system's light or dark preference by default.
- As a user, I want to override the appearance with light, dark, or system mode.
- As a user, I want my theme choice to persist across visits.

---

# 7. Functional Requirements

## FR-01 — Workout Day Selection

The application shall allow the user to select a workout day from Monday through Sunday using day chips.

The selected day shall determine which routine is displayed.

The day chips map to dates within the same Monday-to-Sunday week as the currently selected date:

- Selecting a chip calculates the date for that weekday in the selected week.
- Chips whose calculated date is in the future are disabled.
- The click handler also rejects future dates defensively.
- Selecting the currently selected weekday is a no-op.
- When a saved workout is being edited, a day chip changes the workout date and its weekday index without reloading the routine exercise list.

---

## FR-02 — Date Selection

The application shall allow the user to select a workout date.

- The date input is capped at today's date.
- Past dates are allowed.
- Future dates are rejected with a message.
- Invalid or cleared dates cause the view to re-render with the last valid date.
- The workout weekday is derived from the selected date.
- Selecting a date that already has a saved workout opens that workout for editing.
- Selecting a date without a saved workout creates a new draft using that date's routine.
- The application prevents creating a second saved workout on the same date through the UI; duplicate dates can still be introduced by an imported backup.
- When editing, changing the date to a date occupied by another workout is blocked immediately by the date input and again at save time.

---

## FR-03 — Exercise Display and Previous Performance

For each exercise in the selected routine, the application shall display:

- Exercise name.
- Target muscle group.
- Target set range when configured.
- Target repetition range when configured.
- Previous recorded sets when available.

Previous performance behavior:

- The application looks for the most recent workout before the selected date, excluding the workout currently being edited.
- Routine exercises are matched by stable `xid`.
- Legacy exercises without a stable identity may fall back to name matching when the name is unambiguous.
- The previous sets are displayed as a "Last" summary.
- New drafts pre-fill each set's weight from the corresponding previous set, falling back to the previous session's last set weight.
- Repetitions and completion checkboxes always start blank/unchecked.
- Added custom exercises attempt name-based history lookup when the name is unambiguous; see Known Limitations.

---

## FR-04 — Set Management

The user shall be able to:

- Enter weight.
- Enter repetitions.
- Mark a set as completed.
- Add a set.
- Delete a set.
- Copy the first set's weight to all sets in an exercise.

Initial draft behavior:

- A new exercise starts with a number of sets equal to its planned minimum.
- If the minimum is blank or zero, three sets are created.
- The computed set count is clamped to at least one.
- The planned maximum set count is not enforced.
- "Add set" appends a new set using the previous set's weight and blank repetitions.
- Deleting a set immediately removes it from the draft.
- "Copy weight to all" copies the first set's current weight, including a blank value.
- Set/rep ranges are guidance only; the user may record any positive number of repetitions.

---

## FR-05 — Exercise Management During a Workout

The user shall be able to:

- Skip an exercise.
- Re-enable a skipped exercise.
- Remove an exercise from the current workout.
- Add an additional exercise.

Behavior:

- Skipped exercises are visually dimmed and excluded from the saved workout.
- Removing an exercise removes it from the current draft only.
- Additional exercises are session-only and are not added to the routine.
- The user may supply an exercise name and muscle group.
- If the muscle is blank and the name matches a known exercise, that exercise's muscle is used.
- If no muscle can be inferred, `Other` is used.
- Added exercises start with three sets.
- Added exercises do not receive a stable routine identity.

---

## FR-06 — Workout Completion

A set is saved only when both conditions are true:

1. The set is marked as completed.
2. The set has repetitions greater than zero.

When the user finishes a workout:

1. Exercises marked as skipped are excluded.
2. Exercises with no completed sets are excluded.
3. Sets without completed status or without repetitions are excluded.
4. Weight is converted to a number; a blank or non-numeric weight becomes `0`.
5. Repetitions are converted to a number.
6. At least one completed set with repetitions must remain.
7. The date must be valid and must not be in the future.
8. Another workout must not already exist on the same date, excluding the workout currently being edited.
9. The workout is stored in history.
10. The draft is cleared after a successful save.

Saved workout fields:

- A new workout receives a generated ID.
- An edited workout keeps its existing ID.
- The weekday name (`day`), year, and weekday index (`di`) are derived from the date.
- The workout name is taken from the routine for the selected date's weekday.
- Only completed sets are stored.

If storage fails, the previous log collection is restored, the draft remains on screen, and the user is warned.

---

## FR-07 — Workout Editing

The user shall be able to open an existing workout from History and modify its recorded data.

- Editing loads the saved exercises and completed sets into a draft.
- The original workout ID is preserved.
- Saving updates the original record rather than creating a duplicate.
- The workout being edited is excluded from previous-performance lookup.
- The date may be changed.
- Changing the date updates the weekday index and routine context.
- Changing the date to a date occupied by another workout is blocked.
- A successful update clears the draft and returns to History.

Current behavior and limitation:

- The saved exercise list is not rebuilt when the date changes to a different weekday.
- The saved workout's routine name is recalculated from the new date's routine when the update is saved. See Known Limitations.

---

## FR-08 — Workout Deletion

The user shall be able to delete a previously saved workout.

- Deletion requires confirmation.
- Deleting removes the record by ID.
- If storage fails, the previous log collection is restored and the user is warned.
- If the deleted workout is currently open in the draft, that draft is cleared.

---

## FR-09 — Workout History

The History view shall display:

- Workout date.
- Workout name, or `Workout` when no name exists.
- Number of saved exercises.
- Total training volume.
- Expandable exercise and set details.
- Edit and Delete actions.

Grouping and ordering:

- Workouts are grouped by year.
- Years are shown newest first.
- Workouts within a year are shown newest first.

Training volume is calculated as:

**Training Volume = Σ (Weight × Repetitions)**

for all recorded sets in the workout. The displayed volume is rounded to the nearest whole number.

---

## FR-10 — Progression Tracking

The Progression view shall allow the user to select an exercise and view:

- Best recorded top-set weight.
- Estimated 1RM.
- Number of sessions.
- Historical top-set weight.
- A progression graph.
- Recent session top sets.

Identity and grouping:

- Log exercises with a stable `xid` are grouped by that identity.
- Legacy exercises without `xid` are grouped by name.
- If the identity still exists in the routine, the current routine name is preferred as the label.
- Otherwise, the most recent recorded name is used.
- Duplicate labels are disambiguated by appending the muscle group.
- If labels are still duplicated, numeric suffixes such as `(2)` and `(3)` are added.
- Exercises with no recorded sets are excluded.

Per-session calculation:

- The top set is the set with the highest weight; equal weights are broken by higher repetitions.
- Best weight is the highest top-set weight across sessions.
- Session count is the number of workouts containing the selected exercise with at least one recorded set.
- Estimated 1RM uses the highest estimate across the exercise's recorded sets.

Graph behavior:

- The graph plots top-set weight per session.
- Points are ordered by workout date.
- A single session is plotted as a centered point.
- Point values are shown as text labels.
- Recent sessions are listed newest first.

---

## FR-11 — Estimated 1RM

The application shall estimate 1RM using the following formula:

**Estimated 1RM = Weight × (1 + Reps / 30)**

- The highest estimate across the exercise's recorded sets is used.
- The result is displayed rounded to zero decimal places.
- This value is an estimate and shall not be treated as an actual tested one-repetition maximum.

---

## FR-12 — Routine Management

The Routine view shall allow the user to configure each day independently.

Each routine exercise shall support:

- Exercise name.
- Muscle group.
- Minimum sets.
- Maximum sets.
- Minimum repetitions.
- Maximum repetitions.
- A generated stable exercise ID.

The application shall allow exercises to be added and removed.

Behavior:

- Day chips select which day's routine is being edited.
- Routine name changes are saved immediately.
- Exercise field changes are saved immediately.
- There is no explicit "Save routine" button.
- Renaming an exercise preserves its stable ID.
- New routine exercises are appended in insertion order.
- There is no drag-and-drop or reorder control.
- Removing an exercise from the routine does not remove its past workout history.
- Set and rep ranges are drafts/guidance; they are not enforced during workout entry.
- The current implementation does not validate blank names, missing bounds, negative values, or minimum values greater than maximum values. See Known Limitations.

---

## FR-13 — Local Persistence

The application shall persist application data using browser `localStorage`.

Three primary keys are used:

| Key | Contents |
|-----|----------|
| `gym_data` | Routine plan and saved workout history. |
| `gym_draft` | The in-progress workout draft, or `null`. |
| `gym_theme` | The theme preference: `light`, `dark`, or `system`. |

Behavior:

- Data is loaded and normalized on boot.
- Invalid exercises and logs are dropped or repaired during normalization.
- The plan is normalized to seven days.
- Log workout days, years, and weekday indexes are derived from dates, except that an existing valid `di` value is preserved.
- Logs are sorted by date ascending internally.
- The normalized plan and logs are saved back after normalization when a stored JSON object was present; absent or unparseable data is not immediately overwritten.
- If storage writes fail, the user is warned once until a subsequent successful write.
- The application does not coordinate between multiple open tabs; the last tab to write wins.
- If stored data is unreadable, a recovery copy is attempted before defaults are used. See Section 10.5.

---

## FR-14 — Draft Persistence and Unsaved-Change Protection

While a workout is being entered, the current draft shall be stored separately from completed workout history.

- The draft is saved after every input or structural change.
- The draft is restored on reload.
- A saved draft may be for today or a past date.
- A successful workout save clears the draft.
- A completed or updated workout does not appear in history until Finish/Update is pressed.

Draft baseline:

- When a draft is created or loaded from a saved workout, the application stores a JSON baseline of the generated exercise state.
- Unsaved-change detection compares the current exercise state with that baseline.
- Automatically prefilled weights and untouched generated rows are not treated as unsaved work.
- For legacy drafts without a baseline, the application treats a skipped exercise, completed set, or entered repetition as evidence of unsaved work.
- When creating a new workout, a confirmation prompt is shown before changing the date or weekday if the draft differs from its baseline.
- Edit-mode date changes retain the exercise list, so they do not trigger the discard prompt.
- Switching tabs does not prompt because the draft is persisted.

If a storage write fails while editing a draft, the change remains in memory, the user is warned, and the draft may be lost on reload.

---

## FR-15 — Backup

The user shall be able to create a manual backup of application state.

- The backup payload is `JSON.stringify(S)`, containing the routine `plan` and saved `logs`.
- The theme preference and current draft are not included.
- The application attempts to copy the JSON to the clipboard.
- If clipboard access fails, a prompt containing the JSON is shown for manual copying.
- A confirmation message is shown when clipboard copying succeeds.

---

## FR-16 — Restore

The user shall be able to paste a previously created JSON backup.

The application shall:

1. Parse the pasted text as JSON.
2. Reject invalid JSON with a message.
3. Validate that the object contains a `plan` object and a `logs` array.
4. Validate plan entries and workout entries structurally.
5. Reject malformed backups without changing current state.
6. Normalize the imported data to the current data model; missing plan days become empty routines.
7. Backfill legacy exercise identities when unambiguous.
8. Replace the current plan and logs.
9. Leave the current theme unchanged.
10. Clear the current draft.
11. Return to History and confirm success.

If saving the restored state fails, the previous in-memory state is restored and an error is shown.

The validator accepts duplicate workout IDs, but normalization replaces them with unique IDs. It does not reject duplicate workout dates or a valid but internally inconsistent `di` value; those remain Known Limitations.

---

## FR-17 — Theme

The application shall support three appearance modes:

- `light`
- `dark`
- `system`

Behavior:

- `system` follows the operating system preference through CSS media queries.
- The theme button in Routine cycles Light → Dark → System.
- The current theme label is shown on the button.
- The theme is persisted in `gym_theme`.
- The stored theme is applied before the first view render.
- The default theme is `system`.
- The theme is saved when applied, including on boot.

---

# 8. Application Structure

## 8.1 File Layout

```text
5_gym_progression_tracker/
├── index.html          # App shell: main container and bottom nav
├── README.md           # User-facing usage documentation
├── css/
│   └── style.css       # Layout, controls, and light/dark theme variables
├── js/
│   ├── store.js        # localStorage adapter
│   └── app.js          # State, normalization, views, event handlers
├── tests/
│   └── run-tests.mjs   # Dependency-free regression tests
└── docs/
    └── PRD.md          # This document
```

## 8.2 Primary Views

The application has four primary views.

### Today

Purpose: perform and record the current or selected workout.

Responsibilities:

- Select date and weekday.
- Display the routine.
- Show previous performance.
- Enter weight/repetitions.
- Mark sets complete.
- Skip or remove exercises.
- Add custom exercises.
- Finish/update the workout.

### History

Purpose: review saved workouts.

Responsibilities:

- Group workouts by year.
- Show date, name, exercise count, and volume.
- Expand workout details.
- Edit workouts.
- Delete workouts.
- Navigate to workout entry.

### Progress

Purpose: analyze performance for individual exercises.

Responsibilities:

- Select an exercise.
- Show best weight.
- Show estimated 1RM.
- Show session count.
- Show a top-set weight graph.
- Show recent top sets.

### Routine

Purpose: configure workout structure and application settings.

Responsibilities:

- Select a workout day.
- Rename the routine.
- Add or remove exercises.
- Configure muscle groups, sets, and reps.
- Copy a backup.
- Restore a backup.
- Change the theme.

## 8.3 Navigation

The application uses a fixed bottom navigation bar with four buttons:

- 🏋️ Today
- 📅 History
- 📈 Progress
- ⚙️ Routine

The active view is highlighted with the accent color and a top inset shadow.

The application does not use URL routing. Reloading the page returns to the Today view, while the persisted draft determines the date shown.

## 8.4 Rendering Model

- Each view is a function returning an HTML string.
- The active view is selected from a view map.
- `render()` replaces the main container's `innerHTML` and updates the navigation.
- Click, input, and change events are handled through delegated document listeners.
- The main application state is held in module-level variables for the workout state, draft, active tab, selected progress exercise, selected routine day, and theme.

## 8.5 Default Routine

On a new installation, the application generates a default plan with stable random IDs.

| Day | Routine name | Exercises |
|-----|--------------|-----------|
| Monday | Chest + Shoulder + Triceps | Bench Press (Chest, 3–4 sets, 6–10 reps), Incline DB Press (Chest, 3–3, 8–12), Shoulder Press (Shoulders, 3–4, 8–12), Lateral Raise (Shoulders, 3–4, 12–15), Triceps Pushdown (Triceps, 3–3, 10–15) |
| Tuesday | Back + Biceps | Lat Pulldown (Back, 3–4, 8–12), Barbell Row (Back, 3–4, 6–10), Barbell Curl (Biceps, 3–3, 8–12) |
| Wednesday | Legs | Squat (Quads, 3–4, 6–10), Leg Curl (Hamstrings, 3–3, 10–15), Calf Raise (Calves, 4–4, 12–20) |
| Thursday | Rest | None |
| Friday | — | None |
| Saturday | — | None |
| Sunday | Rest | None |

The IDs are generated at first boot and are not fixed constants.

---

# 9. Data Model

## 9.1 Application State

```text
S
├── plan
│   └── 0..6
│       ├── name: string
│       └── ex: RoutineExercise[]
└── logs: WorkoutLog[]
```

The plan uses numeric weekday keys:

- `0` Monday
- `1` Tuesday
- `2` Wednesday
- `3` Thursday
- `4` Friday
- `5` Saturday
- `6` Sunday

For legacy restores, the normalizer also accepts full weekday names as plan keys.

## 9.2 Routine Exercise

```text
{
  id: string,
  n: string,        // exercise name
  m: string,        // muscle group
  smin: number | '',
  smax: number | '',
  rmin: number | '',
  rmax: number | ''
}
```

- `id` is generated on creation and preserved across renames.
- `smin` determines the initial set count, defaulting to three when blank or zero.
- `smax`, `rmin`, and `rmax` are displayed guidance only.

## 9.3 Workout Log

```text
{
  id: string,
  date: 'YYYY-MM-DD',
  day: 'Monday' | ... | 'Sunday',
  year: number,
  di: 0..6,
  name: string,
  ex: [
    {
      n: string,
      m: string,
      xid: string,
      sets: [
        { w: number, r: number }
      ]
    }
  ]
}
```

- `id` is a generated identifier validated against `^[A-Za-z0-9_-]+$` when loaded.
- `xid` links a logged exercise to a routine exercise ID when known.
- Only completed sets with positive repetitions are stored.
- Logs are sorted ascending by date in memory.

## 9.4 Draft

```text
D
├── date: 'YYYY-MM-DD'
├── di: 0..6
├── editId: string
├── base: string | null
└── ex: [
      {
        xid: string,
        n: string,
        m: string,
        smin: number | '',
        smax: number | '',
        rmin: number | '',
        rmax: number | '',
        on: boolean,
        sets: [
          { w: string | number | '', r: string | number | '', d: boolean }
        ]
      }
    ]
```

- `editId` is empty for a new workout and contains the workout ID while editing.
- `base` is the JSON baseline used for unsaved-change detection.
- `on` is `false` for skipped exercises.
- Draft set values are stored as entered, not necessarily numeric.

## 9.5 Theme

```text
theme: 'light' | 'dark' | 'system'
```

The theme is stored separately from `S` and `D`.

## 9.6 Exercise Identity

- Each routine exercise has a stable `id`.
- A logged exercise stores that identity as `xid`.
- Progression groups by `xid` first, then by name for legacy records.
- On load and restore, legacy logs without `xid` are backfilled only when an exercise name maps to exactly one routine identity across the entire plan.
- Duplicate routine exercise IDs are replaced during normalization; the first exercise with that ID keeps it.
- Logs that used a duplicated `xid` are moved to the matching routine exercise only when name and muscle identify exactly one match; otherwise the exercise stays name-based.
- Ambiguous names remain name-based.
- Custom exercises added during a workout currently receive an empty `xid`.

## 9.7 Legacy and Normalization Rules

When loading or restoring data, the application:

- Accepts `n` or `name` for exercise names.
- Accepts `m` or `muscle` for muscle groups.
- Accepts `smin`/`minSets`, `smax`/`maxSets`, `rmin`/`minReps`, and `rmax`/`maxReps`.
- Accepts numeric or full weekday-name plan keys.
- Drops non-object plan exercises and exercises that have neither `n` nor `name`; non-string names become empty strings.
- Drops logs without valid dates.
- Recomputes `day` and `year` from the date.
- Preserves a valid integer `di` from stored data; otherwise derives it from the date.
- Keeps only sets with positive repetitions in saved logs.
- Generates replacement log IDs when a stored ID is missing, has an invalid format, or duplicates another workout.
- Generates replacement routine exercise IDs when an imported plan repeats an ID.
- Sorts logs ascending by date.
- Drops unknown top-level fields.

---

# 10. Data Storage Architecture

## 10.1 Storage Keys

| Key | Value |
|-----|-------|
| `gym_data` | JSON-serialized application state `S`. |
| `gym_draft` | JSON-serialized draft `D`, or `null`. |
| `gym_theme` | JSON-serialized theme string. |
| `gym_data_recovery_<timestamp>` | Raw unreadable `gym_data` payload, when recovery is possible. |

## 10.2 Store Adapter

`js/store.js` exposes a single `Store` object so the rest of the application does not call `localStorage` directly, except for recovery-copy handling in `app.js`.

The adapter exposes:

- `mode` — currently `local`.
- `ready` — currently `true`.
- `init()` — resolves immediately.
- `loadData()` / `loadDraft()` / `loadTheme()` — read and parse keys.
- `saveData()` / `saveDraft()` / `saveTheme()` — serialize and write keys.
- `flush()` — resolves immediately.
- `online()` — currently always `true`.
- `readRaw`, `ld`, `sv` — low-level helpers.
- `notifyStorageFailure()` — shows a throttled storage warning.

Only the local adapter exists. No file adapter or backend adapter is implemented.

## 10.3 Boot and Load Sequence

1. Read `gym_data`.
2. If no data exists, create defaults and do not immediately persist them.
3. If the value is invalid JSON or not an object, attempt a recovery copy, alert the user, and load defaults.
4. If the object is structurally invalid, attempt a recovery copy and alert the user, then normalize and persist the normalized defaults/data.
5. If valid, normalize the data and persist the normalized result.
6. Load and normalize the draft.
7. Backfill legacy exercise identities.
8. Save normalized plan and logs when a stored JSON object was present.
9. Load the theme, defaulting to `system`, and apply it.

The result of the boot-time save is not checked or reported.

## 10.4 Save Behavior and Failure Handling

- Writes are synchronous and replace the entire stored JSON value.
- Workout save, delete, and restore restore their previous in-memory state when the write fails.
- Routine edits and per-keystroke draft edits remain in memory after a write failure but are not persisted.
- A storage failure warning is shown at most once until a subsequent write succeeds.
- The initial boot save and theme save failures are silent.
- The application does not handle `storage` events or coordinate writes between tabs.

## 10.5 Recovery

- Malformed or structurally invalid `gym_data` triggers an attempted recovery copy.
- The raw stored string is written to `gym_data_recovery_<timestamp>`.
- The user is alerted.
- If the recovery write itself fails, the alert still states that a copy was kept.
- Recovery copies are not automatically pruned.
- A malformed draft is ignored; a fresh draft for the current date is created when the Today view renders.

## 10.6 Draft Persistence

- The draft is written after every input or structural change.
- Completing a workout writes `null` to `gym_draft`.
- Draft writes are independent of workout history writes.
- A failed draft write does not undo the in-memory change.

## 10.7 Theme Persistence

- The theme is loaded before the first view render.
- Applying a theme updates `document.documentElement` and writes `gym_theme`.
- `system` removes the `data-theme` attribute so the CSS media query can apply.
- Explicit `light` and `dark` set `data-theme`.

---

# 11. UI / UX Requirements

## 11.1 Navigation

The application shall provide navigation between Today, History, Progress, and Routine using a fixed bottom navigation bar.

## 11.2 Visual Design

The interface should prioritize:

- Low visual complexity.
- Clear hierarchy.
- Fast data entry.
- Consistent controls.
- Readable workout information.
- Clear distinction between active and skipped exercises.
- A content width capped at 640 px with side padding.
- Bottom padding so content is not hidden by the fixed navigation.

## 11.3 Theme

- The default appearance is `system`.
- System dark mode is handled through `prefers-color-scheme`.
- Explicit light and dark variables are available.
- The user can cycle Light → Dark → System from Routine.
- The choice persists across visits.
- The theme is applied to the document root before the first view render.
- Native form controls, scrollbars, and date pickers are not explicitly themed with `color-scheme`.

## 11.4 Date and Day Controls

- The date input uses the browser's native date picker.
- The date input is capped at today's date.
- Day chips are horizontally scrollable when needed.
- Future day chips are disabled.
- The current weekday chip is highlighted with the accent color.
- Changing the date while editing updates the date and weekday index without reloading the routine exercise list.

## 11.5 Feedback and Confirmations

The application uses browser dialogs:

- `alert` for validation errors, storage failures, and confirmations.
- `confirm` for deleting workouts and discarding unsaved changes.
- `prompt` for restore input and for backup text when clipboard access fails.

## 11.6 Responsive Layout and Accessibility

- The layout is mobile-first and works on desktop.
- Safe-area insets are used for the top and bottom edges.
- Inputs rely primarily on placeholders rather than associated `<label>` elements.
- Icon-only controls use small tap targets in some cases.
- Emoji are used for navigation and action icons.
- Dates are formatted with `en-GB` conventions.
- The application does not provide a custom focus style, skip link, ARIA live region, or comprehensive keyboard navigation beyond native controls.

---

# 12. Technical Requirements

## 12.1 Frontend

Required technologies:

- HTML5
- CSS3
- Vanilla JavaScript

The application is split across `index.html`, `css/style.css`, `js/store.js`, and `js/app.js`. There is no framework, bundler, transpiler, or build step.

## 12.2 External Dependencies

The application does not require external JavaScript libraries or frameworks for its core functionality. The test suite uses only Node.js built-in modules.

## 12.3 Browser Storage

The application uses `localStorage` for persistent state and drafts.

## 12.4 Rendering

The application generates HTML strings and assigns them to the main container's `innerHTML`.

The major view functions are:

```text
today_v()
hist_v()
prog_v()
plan_v()
```

They are selected through a view map and rendered into the main container.

Event handling uses delegated `click`, `input`, and `change` listeners on `document`.

## 12.5 Date Handling

- Dates use `YYYY-MM-DD` strings.
- Date parsing uses local midnight (`T00:00:00`) to avoid UTC date shifts.
- Weekday indexes are Monday-based: `0` Monday through `6` Sunday.
- The application formats dates through `toLocaleDateString('en-GB', ...)`.
- The current date is read from the browser clock each time it is needed.
- Future-date validation compares `YYYY-MM-DD` strings against today's local date.

## 12.6 Testing

The project includes a dependency-free regression suite:

```bash
node tests/run-tests.mjs
```

The suite:

- Loads `js/store.js` and `js/app.js` into a Node `vm` context.
- Stubs the DOM, `localStorage`, clipboard, alerts, confirms, and prompts.
- Uses a fixed reference clock so date assertions are deterministic.
- Drives the app's own click/input/change handlers.
- Covers malformed storage, backup validation, checked-set saving, edit identity and conflicts, duplicate ID repair, dirty-draft detection, date/weekday mapping, stable exercise identity, storage failures, progression grouping, and regression flows.
- Exits with a nonzero status when any test fails.

Current expected result:

```text
============================================================
223 passed, 0 failed
```

## 12.7 Runtime Environment

- The app can be opened directly from the file system or served as static files.
- Browser support is required for `localStorage`, `navigator.clipboard`, optional chaining, nullish coalescing, template literals, and modern `Date` APIs.
- Clipboard access depends on browser security rules; the prompt fallback is used when clipboard access fails.
- `localStorage` behavior for `file://` URLs varies by browser. Serving the folder from a local static server is recommended for reliable persistence and clipboard behavior.
- There is no service worker, so offline behavior after a first load in a served environment is not guaranteed. Because there are no external assets, opening the files locally does not require a network connection.

---

# 13. Data Integrity Requirements

The application should:

1. Prevent future workout dates from being logged.
2. Prevent saving a completely empty workout.
3. Save only sets that are both marked completed and have positive repetitions.
4. Preserve existing workout IDs when editing.
5. Preserve stable routine exercise identities across renames.
6. Prevent creating more than one saved workout on the same date through the UI.
7. Confirm destructive workout deletion.
8. Validate imported backup structure before replacing state.
9. Normalize loaded and imported data.
10. Escape user-provided names and muscle groups before inserting them into generated HTML.
11. Attempt a recovery copy for unreadable stored data.
12. Restore previous in-memory state when a workout save, delete, or restore write fails.
13. Warn the user when storage writes fail.
14. Protect unsaved drafts when changing the date or weekday.
15. Reject future dates and invalid date strings.
16. Give every loaded or restored workout and routine exercise a unique ID.

Current exceptions to escaping and duplicate-date handling are listed in Known Limitations.

---

# 14. Current MVP Acceptance Criteria

The MVP is considered functional when the user can complete this workflow:

```text
Open Application
      ↓
Select Workout Day or Date
      ↓
View Routine
      ↓
Enter Weight + Reps
      ↓
Mark Sets Complete
      ↓
Finish & Save Workout
      ↓
View History
      ↓
Edit/Delete Workout
      ↓
Open Progress
      ↓
Analyze Exercise Progress
```

The user must also be able to:

```text
Routine
   ↓
Modify Exercises / Ranges
   ↓
Changes Persist Automatically
   ↓
Use Modified Routine
```

And:

```text
Routine
   ↓
Create Backup
   ↓
Restore Backup
   ↓
Recover Application Data
```

And:

```text
Today
   ↓
Enter Partial Workout
   ↓
Reload Browser
   ↓
Draft Restored
```

And:

```text
Routine
   ↓
Change Theme
   ↓
Reload Browser
   ↓
Theme Restored
```

Acceptance also requires that malformed stored data does not crash the app and that failed storage writes are reported to the user.

---

# 15. Known Limitations

## 15.1 Storage and Platform

- Data is stored only in the browser's `localStorage`.
- Clearing browser storage can remove application data unless a manual backup exists.
- Data does not synchronize across devices or browsers.
- Multiple open tabs are not coordinated; the last tab to write wins.
- There is no schema-version field or explicit migration system.
- The entire state is rewritten on every save, which may become slow with very large histories.
- Boot-time and theme-save failures are silent.
- Stored theme values are not validated against the supported set; an unrecognized value is displayed as-is and falls back to the browser's effective light/dark behavior.
- Recovery copies are not pruned automatically.
- The recovery alert may claim a copy was kept even if the recovery write failed.
- Opening the app through `file://` can restrict persistence or clipboard behavior depending on the browser.
- There is no service worker or installable offline package.

## 15.2 Workout and Draft

- Only one workout can be created per date through the UI; imported backups may contain duplicate dates.
- A set requires both a completed checkbox and repetitions to be saved.
- A blank weight is stored as `0`.
- Negative weights are accepted and saved.
- Negative or zero repetitions are excluded.
- Selecting a date that already has a workout opens it for editing rather than starting a new workout.
- Editing a workout and changing its date across weekdays updates its routine name but does not rebuild its exercise list.
- While editing, a weekday-chip date change can target an occupied date; the conflict is only reported at Finish.
- History → Edit replaces an unsaved draft without a separate confirmation.
- The History action labeled "+ Log / edit a past day" only switches to the Today view; the user must then choose a past date manually.
- If clearing the draft fails after a successful save, the previous draft may reappear after reload.
- Restore replaces the current state and clears the draft without a separate unsaved-change prompt.
- Skipped exercises and uncompleted sets are not stored and therefore cannot be recovered by editing.
- There is no undo for deleted workouts, removed exercises, or removed sets.

## 15.3 Identity and Progression

- Custom exercises added during a workout receive an empty `xid`.
- Custom exercises use name-based identity until a reload backfills them, and only when the name maps unambiguously to one routine exercise.
- A custom exercise whose name matches a routine exercise with stable identity may not prefill previous performance.
- Custom-exercise prefill searches the latest matching log without limiting it to the selected workout date.
- Progress may show two entries for the same exercise until reload backfills the added exercise.
- The backfill heuristic only assigns identities when an exercise name maps to exactly one routine identity across the entire plan.
- If multiple entries in one workout share the same identity/name, only the first is used by Progression.
- An exercise removed from the routine remains in history but may keep an old label.
- The selected Progression exercise is not persisted across reloads.
- The chart has no axes, tooltips, or date labels, and labels may overlap with many sessions.
- Estimated 1RM is a formula-based estimate, not a tested maximum.

## 15.4 Routine and Validation

- Routine exercise names can be blank.
- Set and rep bounds can be missing, negative, or inverted.
- `smin` of zero falls back to three initial sets.
- Minimum and maximum sets/reps are guidance only and are not enforced.
- Custom exercises currently display a malformed range label such as `3-3 sets × - reps`.
- Routine changes save immediately; there is no explicit save or undo.
- Deleting a routine exercise has no confirmation.
- Duplicate routine exercise names are allowed.
- Exercises cannot be reordered.

## 15.5 Import and Export

- Backups include only the routine plan and workout history.
- Theme and the current draft are excluded from backups.
- Backup is clipboard/prompt based; there is no file download or file upload.
- Restore replaces all current data; it does not merge.
- Restore accepts duplicate workout IDs but normalization gives each record a unique ID.
- Restore accepts duplicate routine exercise IDs but normalization gives each exercise a unique ID and repairs history that clearly matches one exercise.
- Restore accepts valid but internally inconsistent `di` values.
- Restore accepts duplicate workout dates.
- Unknown fields in a backup are dropped during normalization.
- There is no backup schema version.

## 15.6 Security and Escaping

- Exercise names and muscle groups are escaped for HTML display.
- Draft weight/repetition values are inserted into input attributes without escaping.
- The theme label is inserted into generated HTML without escaping.
- Tampered `localStorage` content can therefore inject HTML (self-XSS).
- The application has no Content Security Policy.
- Stored workout data is not encrypted.

## 15.7 Analytics and Features

The application does not currently provide:

- Personal-record detection.
- Muscle-group volume analysis.
- Weekly volume trends.
- Workout frequency analysis.
- Exercise frequency analysis.
- Fatigue or recovery analysis.
- Deload tracking.
- Workout duration.
- Notes, RPE, or RIR.
- Rest timers.
- Body-weight tracking.
- Nutrition tracking.
- Multi-device synchronization.
- Automatic backups.

## 15.8 Accessibility and UI

- Inputs rely on placeholders rather than explicit labels.
- Some icon-only controls have small tap targets.
- There is no custom focus styling, skip link, or ARIA live region.
- Native controls are not explicitly themed with `color-scheme`.
- Emoji rendering varies by platform.
- Dates are formatted in `en-GB` only.
- There is no localization or user-configurable unit system.

---

# 16. Future Scope

Future development should be divided into stages rather than added indiscriminately.

## 16.1 Reliability and Correctness Backlog

Short-term improvements that align the implementation more closely with this document:

- Give custom exercises a stable identity.
- Bound custom-exercise prefill to the selected date.
- Resolve prefill for custom exercises whose names match routine exercises.
- Fix the custom-exercise range label.
- Validate routine names and set/rep ranges.
- Reject or clamp negative weights.
- Prevent History → Edit from discarding a dirty draft without confirmation.
- Preserve or deliberately update the workout name when an edited date crosses weekdays.
- Apply the date-conflict check to weekday chips during editing.
- Escape draft set values and the theme label.
- Reject or repair duplicate dates and inconsistent `di` values on restore.
- Add a schema version and migration path.
- Improve recovery-copy reporting and cleanup.
- Add multi-tab conflict detection.
- Improve accessibility and native dark-mode control styling.

## 16.2 Phase 2 — Better Tracking

Potential features:

- Personal-record detection.
- Weekly and monthly volume.
- Exercise frequency.
- Muscle-group volume.
- Workout duration.
- Rest timer.
- Body-weight tracking.
- Notes, RPE, and RIR.
- File-based backup export/import.

## 16.3 Phase 3 — Better Analytics

Potential features:

- Weekly progression dashboards.
- Volume progression.
- Strength trends.
- Muscle-group balance.
- Training consistency.
- PR history.
- Advanced charts with axes and tooltips.

## 16.4 Phase 4 — Architecture and Platform

The current implementation has already completed:

- Separation of HTML, CSS, and JavaScript.
- A dedicated storage adapter.
- A dependency-free regression test suite.
- Stable exercise identity for routine exercises.

Remaining potential improvements:

- Modular JavaScript files or modules.
- Clearer state management.
- Schema versioning and migrations.
- Optional backend and database.
- Optional multi-device synchronization.
- Service worker/offline installation.

The application should only move toward a backend/database architecture when the requirements justify the additional complexity.

---

# 17. Vibe Coding Development Workflow

This project should be developed using the following engineering workflow:

```text
Problem Definition
        ↓
System Design
        ↓
Specification / PRD
        ↓
AI Direction
        ↓
Implementation
        ↓
Testing
        ↓
Debugging
        ↓
Iteration
```

AI may assist with:

- Generating implementation ideas.
- Explaining unfamiliar code.
- Identifying bugs.
- Suggesting architecture improvements.
- Reviewing implementation.
- Generating test cases.
- Refactoring code.
- Keeping this PRD aligned with the implementation.

Generated code should not automatically be accepted. The developer should understand:

- What the code does.
- Why the code exists.
- What data it modifies.
- What assumptions it makes.
- What can fail.
- How it interacts with other parts of the application.

---

# 18. Definition of Done

A feature is considered complete only when:

## Functionality

- The feature works according to its specification.
- Existing workflows continue to work.

## Data

- Data is stored correctly.
- Existing data is not unintentionally corrupted.
- Normalization and legacy data are considered.

## UI

- The feature is usable.
- States and actions are understandable.
- Destructive actions are confirmed where appropriate.

## Error Handling

- Invalid or incomplete input is handled appropriately.
- Storage failures are surfaced.

## Testing

- The automated regression suite passes.
- New behavior has relevant tests.
- The feature has been manually tested through its primary workflow and relevant edge cases.

## Documentation

- This PRD reflects the implemented behavior.
- Known limitations are updated when behavior changes.
- User-facing documentation is updated when workflows change.

## Understanding

The developer can explain:

1. The purpose of the feature.
2. The data flow.
3. The main functions involved.
4. The important edge cases.
5. How the feature could fail.

---

# 19. Current Project Status

## Implemented

- [x] Workout day selection
- [x] Date selection with past dates and future-date blocking
- [x] Routine display
- [x] Set logging
- [x] Weight logging
- [x] Rep logging
- [x] Set completion checkbox
- [x] Skip and include exercises
- [x] Add custom exercise
- [x] Add and remove sets
- [x] Copy weight across sets
- [x] Previous-set display
- [x] Previous-weight prefill
- [x] Workout saving
- [x] Workout editing
- [x] Workout deletion with confirmation
- [x] Past workout logging
- [x] Workout history grouped by year
- [x] Training-volume calculation
- [x] Exercise progression
- [x] Best-weight calculation
- [x] Estimated 1RM
- [x] Progression graph
- [x] Routine customization
- [x] Stable routine exercise identity
- [x] Local persistence
- [x] Draft persistence
- [x] Draft baseline and unsaved-change detection
- [x] JSON backup
- [x] JSON restore with validation and normalization
- [x] Light/dark/system theme with persistence
- [x] Responsive layout
- [x] Storage write-failure warning
- [x] Recovery copy for unreadable stored data
- [x] Duplicate-date prevention when saving
- [x] Dependency-free automated regression suite

## Not Implemented

- [ ] Authentication
- [ ] Backend
- [ ] Database
- [ ] Cloud synchronization
- [ ] Multi-device synchronization
- [ ] Multi-tab synchronization
- [ ] Automatic backup
- [ ] File-based backup export/import
- [ ] Schema versioning and migrations
- [ ] Service worker / installable offline app
- [ ] Advanced analytics
- [ ] Personal-record detection
- [ ] Nutrition tracking
- [ ] Body-weight tracking
- [ ] RPE/RIR tracking
- [ ] Rest timer
- [ ] AI workout recommendations
- [ ] Full accessibility audit

## Test Status

```text
node tests/run-tests.mjs
151 passed, 0 failed
```

---

# 20. Product Principle

The application should remain **simple before sophisticated**.

The primary loop is:

> **Plan → Train → Record → Review → Improve**

Every future feature should be evaluated against this loop.

If a feature increases complexity without significantly improving workout tracking, progression analysis, or decision-making, it should not be prioritized.

---

# 21. Document Maintenance

- This document describes the current implementation as of **2026-10-26**.
- The implementation and this document should be updated together when behavior changes.
- The data model, storage keys, save rules, and Known Limitations should be reviewed whenever code changes.
- Run `node tests/run-tests.mjs` before considering a behavior change complete.
- The PRD should not silently describe planned behavior as implemented behavior; unfinished work belongs in Future Scope.
