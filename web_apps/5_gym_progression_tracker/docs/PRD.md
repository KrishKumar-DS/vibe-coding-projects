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

# 4. Target User

V1 has one target user:

**The person using this application to follow and track their own gym routine.**

The application is therefore optimized for:

* simplicity,
* speed,
* mobile-friendly usage,
* low friction,
* personal tracking.

V1 does **not** need:

* user accounts,
* multiple users,
* social features,
* cloud synchronization,
* trainer accounts,
* subscriptions.

---

# 5. Training Schedule

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

No resistance-training workout is scheduled.

---

# 6. V1 Core User Flow

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

# 7. Functional Requirements

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

# 8. FR-02 — Today's Workout

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

# 9. FR-03 — Manual Day Selection

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

# 10. FR-04 — Warm-Up

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

# 11. FR-05 — Resistance Training

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

# 12. FR-06 — Set Logging

Every programmed set must have independent input fields for:

* Weight
* Reps
* Sets

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

# 13. FR-07 — Exercise Replacement

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

# 14. FR-08 — Exercise Alternatives

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

# 15. FR-09 — Exercise Replacement Rules

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

# 16. FR-10 — Cardio

Each workout must include a cardio section.

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

# 17. FR-11 — Workout Notes

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

# 18. FR-12 — Workout Completion

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

# 19. FR-13 — Workout Summary

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

# 20. FR-14 — Workout History

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

# 21. FR-15 — View Previous Workout

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

# 22. FR-16 — Previous Performance

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

# 23. FR-17 — Data Persistence

Workout data must survive:

* Page refresh
* Browser restart
* Closing the tab

V1 will use:

**Browser LocalStorage**

No server/database is required.

---

# 24. FR-18 — Data Model

The application should conceptually maintain the following entities.

## Exercise

```text
id
name
muscleGroup
equipment
category
defaultRepRange
alternatives[]
```

---

## Workout Template

```text
id
day
name
exercises[]
cardio
```

---

## Workout Session

```text
id
date
day
workoutTemplateId
startTime
endTime
duration

warmup
exercises[]
cardio
notes

status
```

---

## Exercise Performance

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

---

## Set

```text
setNumber
weight
reps
```

---

# 25. Data Integrity Requirements

The application must avoid accidentally losing workout data.

Before overwriting an existing saved session, the application should require deliberate user action.

The application should not silently delete historical workouts.

If LocalStorage is unavailable or corrupted, the application should display a clear error rather than pretending that data was saved successfully.

---

# 26. UI Requirements

## General

The interface should be:

* Clean
* Simple
* Mobile-friendly/Laptop-Friendly
* Easy to use inside a gym
* Touch-friendly
* Fast to navigate

The user should not need to navigate through many screens to record one set.

---

# 27. Mobile-First Requirement

The application should be designed primarily for a smartphone.

Important controls should be easy to tap.

Input fields should be large enough for quick gym use.

The resistance-training screen should prioritize:

```text
Exercise
Target
Previous
Set logging
Complete
```

over decorative elements.

---

# 28. Responsive Design

The application must work reasonably on:

* Mobile
* Tablet
* Desktop

Desktop may use additional horizontal space, but the core functionality must remain identical.

---

# 29. Navigation

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

### History

Previously saved workouts.

No complicated navigation is required in V1.

---

# 30. Workout State

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

# 31. Validation

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

Must be:

* numeric
* zero or greater

Invalid input should produce a clear message.

Example:

```text
Please enter a valid number of reps.
```

---

# 32. Empty States

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

# 33. Error Handling

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

# 34. V1 Analytics

V1 should **not** contain advanced analytics.

It may display basic information such as:

* Number of completed workouts
* Workout history
* Previous exercise performance

Advanced progression analytics are outside V1.

---

# 35. V1 Does NOT Include

The following features are explicitly excluded from V1:

### Authentication

No:

* Login
* Signup
* Passwords
* Accounts

### Backend

No:

* Flask
* FastAPI
* Node backend
* REST API

### Database

No:

* PostgreSQL
* MySQL
* MongoDB

### Cloud Sync

No cloud synchronization.

### Social Features

No:

* Friends
* Followers
* Leaderboards
* Sharing

### Nutrition Tracking

No:

* Calories
* Protein
* Meal tracking
* Supplements

### Body Measurements

No:

* Weight tracking
* Waist tracking
* Body-fat tracking
* Progress photos

### Advanced Analytics

No:

* Volume analytics
* Muscle-volume analysis
* Progress graphs
* Plateau detection
* 1RM calculations
* Advanced progression algorithms

### AI Features

No AI-generated coaching or workout recommendations in V1.

AI may be considered in a later version.

---

# 36. Technical Architecture

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

# 37. Source of Truth

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

# 38. Persistence Strategy

LocalStorage should be used for:

```text
workout templates
exercise data
active workout
completed workout history
application settings
```

A reasonable storage structure could be:

```text
gymTracker.workouts
gymTracker.activeWorkout
gymTracker.settings
```

Exact key names are implementation details.

---

# 39. Security / Privacy

V1 stores data locally in the user's browser.

No personal workout data should be sent to a server because V1 has no backend.

The application should not request:

* passwords,
* email addresses,
* personal identification,
* unnecessary permissions.

---

# 40. Accessibility

The application should provide:

* readable text,
* sufficient contrast,
* visible focus states,
* labels for form inputs,
* keyboard accessibility where practical,
* buttons with clear labels.

Icons should not be the only indication of an action.

---

# 41. Performance

V1 should load quickly.

Because there is:

* no backend,
* no database,
* no authentication,

the application should remain lightweight.

Avoid unnecessary libraries unless they provide clear value.

---

# 42. Acceptance Criteria

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

## Saving

* [ ] Workout can be saved.
* [ ] Saved data survives page refresh.
* [ ] Saved data survives browser restart.
* [ ] Active workout can be restored after refresh.

## History

* [ ] Saved workouts appear in history.
* [ ] User can open a previous workout.
* [ ] Complete workout details are displayed.

## Previous Performance

* [ ] Previous exercise performance is shown when available.
* [ ] "No previous data" is shown when unavailable.

## Quality

* [ ] Application works on mobile.
* [ ] Application works on desktop.
* [ ] Invalid inputs are handled.
* [ ] No critical JavaScript errors remain in the console.
* [ ] No workout data is silently lost.

---

# 43. Definition of Done

V1 is **Done** when a user can realistically walk into a gym with their phone and perform this complete flow:

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

# 44. Future Roadmap

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

# 45. Product Principle

The most important principle for V1 is:

> **The tracker should make recording training easier, not make training itself more complicated.**

The application should never become more difficult to use than writing the workout down manually.

Every feature should justify its existence by improving one of these:

1. **Logging**
2. **Recall**
3. **Consistency**
4. **Progress visibility**

If a feature does not significantly improve one of those areas, it should probably wait for a later version.

---

# 46. V1 Success Criteria

The project succeeds if the user can consistently use it during real gym sessions without friction.

The primary success metric is therefore:

> **Can the user accurately record a complete workout in the tracker while spending minimal attention on the application itself?**

The application is a **tracking tool**, not the workout.

The user's training remains the primary activity.
