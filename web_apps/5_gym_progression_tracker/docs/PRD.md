# Gym Progression Tracker — V1

**Version:** 1.0
**Status:** Planning
**Platform:** Web
**Primary User:** Single personal user
**Frontend:** HTML + CSS + JavaScript
**Storage:** Browser LocalStorage
**Backend:** None
**Database:** None

---

# 1. Product Overview

## 1.1 Product Name

**Gym Progression Tracker**

A personal web application for planning, logging, and reviewing gym workouts.

The application converts a predefined 6-day training routine into an interactive workout-tracking system where the user can:

* See the correct workout for the current day.
* Complete a warm-up.
* Log resistance-training exercises.
* Record sets, reps, and weight.
* Replace an exercise with an approved alternative when necessary.
* Record cardio.
* Add workout notes.
* Save the completed workout.
* Review previous workout sessions.

---

# 2. Problem Statement

When training consistently, manually remembering:

* which exercises were performed,
* how much weight was used,
* how many reps were completed,
* what happened during the previous session,
* which exercise alternatives can be used,

becomes inconvenient and makes progression harder to track.

The application should provide a simple system for answering:

> **"What am I supposed to do today, what did I actually do, and what happened during the workout?"**

V1 focuses on **accurate workout logging**, not advanced fitness coaching.

---

# 3. Product Goal

The primary goal of V1 is:

> **Create a reliable personal workout logging system that makes recording each gym session fast and structured.**

The application should reduce the amount of information the user has to remember manually.

---

# 4. Target Platform

V1 is designed primarily for **desktop and laptop use**.

### Platform Priority

1. Desktop — Primary
2. Laptop — Primary
3. Tablet — Secondary
4. Mobile — Not a V1 requirement

The application should make effective use of larger desktop screens while remaining structurally responsive enough that the interface does not break on smaller screens.

V1 does not require mobile-first optimization.

---

# 5. UI Requirements

The interface should be:

* Clean
* Simple
* Fast
* Easy to understand
* Keyboard-friendly where practical
* Comfortable for extended desktop use
* Visually organized
* Focused on workout logging rather than decoration

The application should minimize unnecessary navigation and interactions.

The user should be able to record a workout without repeatedly switching between screens.

---

# 6. Desktop Layout

The primary application layout may use:

```text
┌──────────────────────────────────────────────────────────────┐
│ Gym Progression Tracker                    Date / Day        │
├──────────────┬───────────────────────────────────────────────┤
│              │                                               │
│ Dashboard    │              Main Content                     │
│ Workout      │                                               │
│ History      │                                               │
│              │                                               │
└──────────────┴───────────────────────────────────────────────┘
```

The exact visual design is an implementation decision.

The application should prioritize:

1. Workout information
2. Previous performance
3. Set logging
4. Workout status
5. Navigation

over decorative UI elements.

---

# 7. Responsive Design

Responsive behavior is desirable but secondary to the desktop experience.

The application must not become unusable when the browser window is reduced in width.

Mobile-specific optimization is outside the scope of V1. The UI should not be designed around mobile-first interaction.

---

# 8. V1 Scope

V1 is a personal workout logging application.

The primary responsibility of V1 is:

> **Tell the user what workout they planned, allow them to record what they actually performed, and preserve that information for future reference.**

V1 prioritizes:

1. Logging
2. Recall
3. Consistency
4. Basic progress visibility

---

## V1 Includes

* Six-day workout schedule
* Sunday rest-day state
* Automatic current-day detection
* Manual workout-day selection
* Workout templates
* Workout sessions
* Warm-up tracking
* Exercise logging
* Set logging
* Weight and rep tracking
* Exercise alternatives
* Previous workout performance
* Cardio logging
* Workout notes
* Workout timer
* Workout summary
* Workout history
* Previous workout detail
* LocalStorage persistence
* Active workout restoration
* Input validation
* Basic error handling
* Data export/import

---

## V1 Does Not Include

### Accounts

* Login
* Signup
* User accounts

### Backend

* Flask
* FastAPI
* Node.js backend
* REST API

### Database

* PostgreSQL
* MySQL
* MongoDB

### Cloud

* Cloud synchronization
* Multi-device synchronization

### Social

* Friends
* Followers
* Leaderboards
* Social sharing

### Nutrition

* Calories
* Protein
* Meal tracking
* Supplement tracking

### Body Tracking

* Body weight
* Waist measurements
* Body-fat percentage
* Progress photos

### Advanced Analytics

* Advanced progression algorithms
* Plateau detection
* Advanced muscle-volume analysis
* Advanced 1RM analysis

### AI

* AI coaching
* AI-generated workout recommendations
* AI-generated training plans

These features may be considered in later versions.

---

# 9. Training Schedule

The application uses the following weekly structure.

## Monday — Push A

| Exercise               | Sets × Reps |
| ---------------------- | ----------- |
| Machine Chest Press    | 2 × 8–12    |
| Incline Dumbbell Press | 2 × 8–12    |
| Machine Shoulder Press | 2 × 8–12    |
| Lateral Raise          | 2 × 12–15   |
| Cable Triceps Pushdown | 2 × 10–15   |

---

## Tuesday — Pull A

| Exercise            | Sets × Reps |
| ------------------- | ----------- |
| Lat Pulldown        | 2 × 8–12    |
| Seated Cable Row    | 2 × 8–12    |
| Chest-Supported Row | 2 × 8–12    |
| Reverse Pec Deck    | 2 × 12–15   |
| Dumbbell Curl       | 2 × 10–15   |

---

## Wednesday — Legs A

| Exercise             | Sets × Reps |
| -------------------- | ----------- |
| Leg Press            | 2 × 8–12    |
| Leg Curl             | 2 × 10–15   |
| Leg Extension        | 2 × 10–15   |
| Calf Raise           | 2 × 12–15   |
| Cable/Machine Crunch | 2 × 10–15   |

---

## Thursday — Push B

| Exercise                   | Sets × Reps |
| -------------------------- | ----------- |
| Incline Machine Press      | 2 × 8–12    |
| Machine Chest Press        | 2 × 8–12    |
| Lateral Raise              | 2 × 12–15   |
| Shoulder Press             | 2 × 8–12    |
| Overhead Triceps Extension | 2 × 10–15   |

---

## Friday — Pull B

| Exercise                      | Sets × Reps |
| ----------------------------- | ----------- |
| Lat Pulldown                  | 2 × 8–12    |
| Seated Cable Row              | 2 × 8–12    |
| Single-Arm Cable/Dumbbell Row | 2 × 8–12    |
| Reverse Pec Deck              | 2 × 12–15   |
| Hammer Curl                   | 2 × 10–15   |

---

## Saturday — Legs B

| Exercise                           | Sets × Reps |
| ---------------------------------- | ----------- |
| Goblet/Weighted Squat              | 2 × 8–12    |
| Romanian Deadlift                  | 2 × 8–12    |
| Leg Press                          | 2 × 10–12   |
| Calf Raise                         | 2 × 12–15   |
| Hanging/Captain's Chair Knee Raise | 2 × 8–15    |

---

## Sunday — Rest

Sunday is a:

**Full Rest + Walking Day**

No resistance-training workout is scheduled. Optional walking may be recorded as cardio if the user chooses.

---

# 10. V1 Core User Flow

The main user flow should be:

```text
Open Application
       ↓
Determine Current Date
       ↓
Determine Day of Week
       ↓
Load Today's Workout
       ↓
Warm-up
       ↓
Resistance Training
       ↓
Cardio
       ↓
Review Workout
       ↓
Save Workout
       ↓
Workout History
```

---

# 11. Functional Requirements

## FR-01 — Current Date and Day

The application must automatically display:

* Current date
* Current day of the week

Example:

```text
Saturday
03 October 2026
```

The application should use the user's local browser date/time.

The user should not need to manually enter the date for a normal workout.

---

## FR-02 — Today's Workout

The application must automatically load the workout associated with the current day.

Example:

```text
Saturday

LEGS B

5 Exercises
10 Target Sets
```

The application must display:

* Workout name
* Exercise list
* Target sets
* Target rep range

---

## FR-03 — Manual Day Selection

The user must also be able to select another day manually.

Example:

```text
< Previous     Saturday     Next >
```

or:

```text
Monday
Tuesday
Wednesday
Thursday
Friday
Saturday
Sunday
```

This allows the user to:

* review another workout,
* log a missed workout,
* test the application,
* inspect the routine.

Changing the displayed day must **not automatically create a workout record**.

---

## FR-04 — Warm-Up

Each workout day must contain a warm-up section.

V1 warm-up should be simple.

Example:

```text
WARM-UP

☐ Light cardio
☐ Dynamic mobility
☐ Workout-specific preparation

Duration: [ 5 ] minutes
```

The user must be able to mark warm-up items as completed.

The user must be able to enter warm-up duration.

Warm-up completion is stored as part of the workout session.

---

## FR-05 — Resistance Training

The application must display every exercise assigned to the selected workout.

Each exercise must show:

* Exercise name
* Target sets
* Target rep range
* Previous performance, if available
* Current set logging fields
* Alternative-exercise option
* Notes option

Example:

```text
Machine Chest Press

Target:
2 × 8–12

Previous:
30 kg × 10
30 kg × 9

SET 1
Weight: [ 30 ] kg
Reps:   [ 10 ]

SET 2
Weight: [ 30 ] kg
Reps:   [ 9 ]

[ Change Exercise ]

Notes:
[________________]
```

---

## FR-06 — Set Logging

Every programmed set must have independent input fields for:

* Weight
* Reps
* Set number (managed by the interface)

Example:

```text
Set 1
Weight: 30 kg
Reps: 10

Set 2
Weight: 30 kg
Reps: 9
```

The application must **not** assume that every set uses the same weight or reps.

The user must be able to record different values for each set.

---

## FR-07 — Exercise Replacement

The user must be able to replace a programmed exercise with an alternative.

Example:

```text
Programmed Exercise:
Machine Shoulder Press

Alternative Exercises:

○ Dumbbell Shoulder Press
○ Smith Machine Shoulder Press
○ Cable Shoulder Press
```

After replacement:

```text
Programmed:
Machine Shoulder Press

Performed:
Dumbbell Shoulder Press
```

The application must preserve the distinction between:

**Programmed Exercise**

and

**Performed Exercise**

This is important for maintaining accurate workout history.

---

## FR-08 — Exercise Alternatives

V1 must contain predefined alternatives for exercises where alternatives are useful.

Example:

### Machine Shoulder Press

Alternatives:

* Dumbbell Shoulder Press
* Smith Machine Shoulder Press
* Cable Shoulder Press

### Machine Chest Press

Alternatives:

* Dumbbell Bench Press
* Barbell Bench Press
* Push-up

### Lat Pulldown

Alternatives:

* Assisted Pull-up
* Band Lat Pulldown
* Cable Pulldown variation

The alternatives should come from the application's exercise data rather than being manually typed each time.

---

## FR-09 — Exercise Replacement Rules

Replacing an exercise must:

1. Preserve the original programmed exercise.
2. Record the selected alternative.
3. Preserve the target set/rep structure unless manually changed.
4. Allow the user to log the alternative normally.
5. Show the performed exercise in the saved workout history.

Example:

```text
Programmed:
Machine Shoulder Press

Performed:
Dumbbell Shoulder Press

Target:
2 × 8–12

Actual:
7.5 kg × 10
7.5 kg × 8
```

---

## FR-10 — Cardio

Each workout should provide a cardio section. Cardio logging is optional for a workout session.

The user must be able to record:

* Cardio type
* Duration
* Optional distance
* Optional notes

Example:

```text
CARDIO

Type:
[ Treadmill ▼ ]

Duration:
[ 15 ] minutes

Distance:
[ 1.2 ] km

Notes:
[ Moderate pace ]
```

Not every field needs to be mandatory.

---

## FR-11 — Workout Notes

The user must be able to add general workout notes.

Example:

```text
WORKOUT NOTES

[ Felt strong today.
  Shoulder press machine was occupied.
  Energy was good. ]
```

These notes must be stored with the workout session.

---

## FR-12 — Workout Completion

The application must provide a clear way to finish a workout.

Example:

```text
Exercises Completed:
5 / 5

Sets Completed:
10 / 10

Warm-up:
✓

Cardio:
✓

[ Finish Workout ]
```

Before saving, the application should provide a summary.

---

## FR-13 — Workout Timer

The application should provide a workout timer for the active session.

The timer must:

* Start when the user starts the workout.
* Continue while the workout is in progress.
* Display elapsed time.
* Stop when the workout is completed.
* Preserve the session duration when the workout is saved.
* Restore the timer state when an active workout is restored after refresh, where technically reliable.

The timer is for tracking session duration only. It is not a rest timer or exercise-specific interval timer in V1.

---

## FR-14 — Workout Summary

Before final save:

```text
WORKOUT SUMMARY

Saturday — Legs B

Exercises       5
Completed Sets  10
Warm-up         ✓
Cardio          ✓

Duration        48 min

[ Save Workout ]
[ Continue Editing ]
```

The user must be able to return to editing before saving.

---

## FR-15 — Workout History

The application must provide a history page.

Each saved workout should show:

* Date
* Day
* Workout name
* Completion status
* Duration

Example:

```text
WORKOUT HISTORY

03 Oct 2026
Saturday — Legs B
Completed

02 Oct 2026
Friday — Pull B
Completed

01 Oct 2026
Thursday — Push B
Completed
```

---

## FR-16 — View Previous Workout

The user must be able to open a saved workout.

The detail view should display:

* Workout date
* Workout name
* Warm-up
* Exercises
* Programmed exercises
* Performed exercises
* Sets
* Reps
* Weight
* Cardio
* Notes

---

## FR-17 — Previous Performance

When performing an exercise that has historical data, the application should display the most recent performance.

Example:

```text
Machine Chest Press

LAST SESSION

30 kg × 10
30 kg × 9
```

If no previous record exists:

```text
No previous data
```

This feature is informational only.

V1 does not automatically prescribe the next weight.

---

## FR-18 — Data Persistence

## FR-19 — Data Export and Import

The user must be able to export workout data to a portable file and import a previously exported file.

V1 export/import must:

1. Export completed workout history and relevant application data.
2. Produce a format that can be stored outside the browser.
3. Validate imported data before replacing or merging local data.
4. Require deliberate user confirmation before destructive replacement.
5. Preserve historical workout records after a successful import.

Example controls:

```text
[ Export Data ]
[ Import Data ]
```

Import/export is a backup and portability mechanism, not cloud synchronization.

---



Workout data must survive:

* Page refresh
* Browser restart
* Closing the tab

V1 will use:

**Browser LocalStorage**

No server/database is required.

---

# 12. Data Model

The application should separate static workout programming from recorded workout history.

The core relationship is:

```text
Exercise Database
       ↓
Workout Template
       ↓
Workout Session
       ↓
Exercise Performance
       ↓
Set
```

---

## Exercise

Represents an exercise known by the application.

```text
id
name
muscleGroup
equipment
category
defaultRepRange
alternatives[]
```

### Rules

* `id` must be stable and unique.
* Historical records should reference exercises using their ID.
* The display name may change without breaking historical records.

Example:

```javascript
{
    id: "machine_chest_press",
    name: "Machine Chest Press",
    muscleGroup: "Chest",
    equipment: "Machine",
    category: "Compound",
    defaultRepRange: "8-12",
    alternatives: [
        "dumbbell_bench_press",
        "barbell_bench_press"
    ]
}
```

---

## Workout Template

Represents the planned workout for a particular training day.

```text
id
day
name
exercises[]
```

Example:

```text
id: "push_a"
day: "Monday"
name: "Push A"
exercises:
    [
        machine_chest_press,
        incline_dumbbell_press,
        machine_shoulder_press,
        lateral_raise,
        cable_triceps_pushdown
    ]
```

A workout template does not represent a completed workout.

---

## Workout Session

Represents an actual workout performed by the user.

```text
id
date
day
workoutTemplateId
startTime
endTime
duration
status
warmup
exercises[]
cardio
notes
```

The session stores what actually happened during the workout.

---

## Exercise Performance

Represents the user's actual performance for one exercise during a workout session.

```text
programmedExerciseId
programmedExerciseName

performedExerciseId
performedExerciseName

targetSets
targetRepRange

sets[]
notes
```

The application must preserve the distinction between:

```text
Programmed Exercise
```

and:

```text
Performed Exercise
```

This allows exercise substitutions without losing the original workout plan.

---

## Set

Represents one performed set.

```text
setNumber
weight
reps
```

A set does not contain another `sets` field.

Each set has independent weight and rep values.

Example:

```javascript
{
    setNumber: 1,
    weight: 30,
    reps: 10
}
```

```javascript
{
    setNumber: 2,
    weight: 30,
    reps: 9
}
```

---

# 13. Data Integrity Requirements

The application must avoid accidentally losing workout data.

Before overwriting an existing saved session, the application should require deliberate user action.

The application should not silently delete historical workouts.

If LocalStorage is unavailable or corrupted, the application should display a clear error rather than pretending that data was saved successfully.

---

# 14. Navigation

V1 should have a simple navigation structure.

Suggested:

```text
HOME
WORKOUT
HISTORY
```

### Home

Today's workout and quick status.

### Workout

Active workout logging.

### Data Export / Import

* [ ] User can export workout data.
* [ ] User can import previously exported data.
* [ ] Invalid imported data is rejected safely.
* [ ] Destructive replacement requires confirmation.

## History

Previously saved workouts.

No complicated navigation is required in V1.

---

# 15. Workout State

An active workout should have a state.

Possible states:

```text
NOT_STARTED
IN_PROGRESS
COMPLETED
```

Example:

```text
Monday
Push A

Status:
IN PROGRESS
```

If the user accidentally refreshes the page during an active workout, the application should attempt to restore the active session from LocalStorage.

---

# 16. Validation

The application should validate user inputs.

Examples:

### Weight

Must be:

* numeric
* zero or greater

### Reps

Must be:

* whole number
* greater than zero

### Duration

When provided, must be numeric and zero or greater.

Invalid input should produce a clear message.

Example:

```text
Please enter a valid number of reps.
```

---

# 17. Empty States

The application should handle missing data gracefully.

Example:

### No Workout History

```text
No workouts recorded yet.

Complete your first workout to start
building your history.
```

### No Previous Exercise Data

```text
No previous performance recorded.
```

---

# 18. Error Handling

The application should not fail silently.

Potential errors:

* Invalid input
* LocalStorage failure
* Missing exercise
* Missing workout template
* Corrupted saved data

The user should receive a clear, understandable message.

Technical error details may be logged to the browser console for debugging.

---

# 19. V1 Analytics

V1 should **not** contain advanced analytics.

It may display basic information such as:

* Number of completed workouts
* Workout history
* Previous exercise performance

Advanced progression analytics are outside V1.

---

# 20. Technical Architecture

V1 should use a simple client-side architecture.

```text
HTML
  ↓
UI Structure

CSS
  ↓
Visual Design + Responsive Layout

JavaScript
  ↓
Application Logic
  ↓
Workout Data
  ↓
LocalStorage
```

Suggested JavaScript conceptual modules:

```text
/js
│
├── app.js
├── workoutData.js
├── exerciseData.js
├── workoutManager.js
├── storage.js
├── ui.js
└── utils.js
```

The exact structure can change during implementation if a simpler architecture is justified.

---

# 21. Source of Truth

The application's workout program should exist as structured data rather than being duplicated manually throughout HTML.

Conceptually:

```text
Exercise Database
       ↓
Workout Templates
       ↓
Workout Session
       ↓
Saved History
```

The UI should render the data dynamically.

---

# 22. Persistence Strategy

LocalStorage should be used for user-generated and mutable runtime data:

```text
active workout
completed workout history
application settings
```

Workout templates and exercise definitions should normally remain in the application's structured source data. They do not need to be duplicated in LocalStorage unless the implementation later supports user customization.

A reasonable storage structure could be:

```text
gymTracker.workouts
gymTracker.activeWorkout
gymTracker.settings
```

If export/import is implemented as a full application backup, the exported file may contain all of the above data.

Exact key names are implementation details.

---

# 23. Security / Privacy

V1 stores data locally in the user's browser.

No personal workout data should be sent to a server because V1 has no backend.

The application should not request:

* passwords,
* email addresses,
* personal identification,
* unnecessary permissions.

---

# 24. Accessibility

The application should provide:

* readable text,
* sufficient contrast,
* visible focus states,
* labels for form inputs,
* keyboard accessibility where practical,
* buttons with clear labels.

Icons should not be the only indication of an action.

---

# 25. Performance

V1 should load quickly.

Because there is:

* no backend,
* no database,
* no authentication,

the application should remain lightweight.

Avoid unnecessary libraries unless they provide clear value.

---

# 26. Acceptance Criteria

V1 is considered complete when all of the following are true:

## Workout

* [ ] Application determines current day.
* [ ] Correct workout is displayed.
* [ ] User can manually select another day.
* [ ] Sunday displays the rest-day state.
* [ ] All six workout templates are correctly implemented.

## Warm-up

* [ ] Warm-up section exists.
* [ ] Warm-up items can be marked complete.
* [ ] Duration can be recorded.

## Resistance Training

* [ ] All programmed exercises are displayed.
* [ ] Target sets/reps are displayed.
* [ ] User can enter weight.
* [ ] User can enter reps.
* [ ] Each set has independent values.
* [ ] User can add notes.

## Alternatives

* [ ] Exercise alternatives are available.
* [ ] User can replace an exercise.
* [ ] Original programmed exercise remains recorded.
* [ ] Performed alternative is recorded correctly.

## Cardio

* [ ] Cardio type can be selected.
* [ ] Duration can be recorded.
* [ ] Distance can optionally be recorded.
* [ ] Cardio notes can optionally be recorded.

## Timer

* [ ] Workout timer starts for an active workout.
* [ ] Elapsed duration is displayed.
* [ ] Duration is stored with the saved workout.

## Saving

* [ ] Workout can be saved.
* [ ] Saved data survives page refresh.
* [ ] Saved data survives browser restart.
* [ ] Active workout can be restored after refresh.

## Data Export / Import

* [ ] User can export workout data.
* [ ] User can import previously exported data.
* [ ] Invalid imported data is rejected safely.
* [ ] Destructive replacement requires confirmation.

## History

* [ ] Saved workouts appear in history.
* [ ] User can open a previous workout.
* [ ] Complete workout details are displayed.

## Previous Performance

* [ ] Previous exercise performance is shown when available.
* [ ] "No previous data" is shown when unavailable.

## Quality

* [ ] Application works on desktop.
* [ ] Application works on laptop.
* [ ] Application remains usable at reduced browser widths.
* [ ] Invalid inputs are handled.
* [ ] No critical JavaScript errors remain in the console.
* [ ] No workout data is silently lost.

---

# 27. Definition of Done

V1 is **Done** when a user can realistically use the tracker during a real gym session and perform this complete flow on the supported desktop/laptop interface:

```text
Open Tracker
     ↓
See today's workout
     ↓
Complete warm-up
     ↓
Start resistance training
     ↓
See previous performance
     ↓
Enter weight + reps
     ↓
Replace an exercise if necessary
     ↓
Continue logging
     ↓
Record cardio
     ↓
Add notes
     ↓
Review workout
     ↓
Save
     ↓
Close browser
     ↓
Open tracker later
     ↓
Historical workout still exists
```

If this workflow works reliably, **V1 has achieved its purpose.**

---

# 28. Future Roadmap

These features are intentionally reserved for future versions.

## V2 — Progress Analytics

Potential features:

* Exercise progression graphs
* Total training volume
* Personal records
* Weekly/monthly statistics
* Workout streaks
* Training consistency
* Exercise history graphs

## V3 — Customization

Potential features:

* Custom exercises
* Custom workouts
* Editable rep ranges
* Custom alternatives
* Exercise database management
* Import/export data
* Backup/restore

## V4 — Intelligence

Potential features:

* Progression suggestions
* Plateau detection
* AI workout summaries
* Natural-language workout queries
* AI-assisted training analysis

## V5 — Full Application

Potential features:

* Backend
* Database
* Authentication
* Cloud synchronization
* Multi-device access

---

# 29. Product Principle

The most important principle for V1 is:

> **The tracker should make recording training easier, not make training itself more complicated.**

The application should never become more difficult to use than writing the workout down manually.

Every feature should justify its existence by improving one of these:

1. **Logging**
2. **Recall**
3. **Consistency**
4. **Progress visibility**

If a feature does not significantly improve one of those areas, it should wait for a later version.

---

# 30. V1 Success Criteria

The project succeeds if the user can consistently use it during real gym sessions without friction.

The primary success metric is therefore:

> **Can the user accurately record a complete workout in the tracker while spending minimal attention on the application itself?**

The application is a **tracking tool**, not the workout.

The user's training remains the primary activity.
