# Gym Progression Tracker — Product Requirements Document

**Project Type:** Personal Web Application
**Project Stage:** MVP / Functional Prototype
**Technology:** HTML, CSS, JavaScript
**Architecture:** Single-file client-side application
**Data Storage:** Browser `localStorage`
**Target Platform:** Desktop-first personal use, with responsive layout support

---

# 1. Product Overview

## 1.1 Product Name

**Gym Progression Tracker**

## 1.2 Product Purpose

Gym Progression Tracker is a personal workout tracking web application designed to make it easy to:

* Follow a predefined workout routine.
* Record exercises, sets, weight, and repetitions.
* Review previous workouts.
* Edit or delete workout records.
* Monitor exercise progression over time.
* Customize the workout routine.
* Preserve workout data locally in the browser.
* Create and restore manual backups.

The primary objective is to replace manual workout tracking with a simple, structured digital system.

---

# 2. Problem Statement

Traditional workout tracking can become difficult when workout information is stored across notebooks, phone notes, spreadsheets, or memory.

The application solves this by providing a centralized system where workout data can be recorded in a consistent structure.

The system should answer questions such as:

* What workout am I performing today?
* What weight did I use previously?
* How many repetitions did I perform?
* What exercises are included in my routine?
* How has my performance changed over time?
* How much training volume did I perform?
* Can I review or correct a previous workout?

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

## 3.2 Secondary Goals

1. Minimize unnecessary UI complexity.
2. Keep the application lightweight.
3. Make the application usable without an internet connection after loading.
4. Keep the initial architecture simple enough to understand and maintain.

---

# 4. Non-Goals

The current version does NOT attempt to provide:

* User accounts.
* Authentication.
* Cloud synchronization.
* A backend server.
* A remote database.
* Social features.
* Trainer/coaching functionality.
* Nutrition tracking.
* Body-weight tracking.
* Sleep tracking.
* Wearable/device integration.
* AI-generated workout plans.
* Automatic cloud backups.
* Multi-user support.

These may be considered future features but are outside the current MVP.

---

# 5. Target User

## Primary User

A single individual who regularly performs resistance training and wants to track workout performance and progression.

The current application is designed primarily for personal use rather than as a commercial multi-user fitness platform.

---

# 6. Core User Stories

## Workout Logging

* As a user, I want to see my workout routine for a selected day.
* As a user, I want to enter the weight used for each set.
* As a user, I want to enter repetitions for each set.
* As a user, I want to mark sets as completed.
* As a user, I want to skip an exercise when necessary.
* As a user, I want to add an additional exercise to a workout.
* As a user, I want to add or remove individual sets.
* As a user, I want to copy a weight across all sets of an exercise.

## Previous Performance

* As a user, I want to see my previous sets for an exercise while logging.
* As a user, I want the application to pre-fill the previous weight when possible.

The current implementation retrieves previous sets for the same exercise and uses them when constructing a new workout draft.

## Workout History

* As a user, I want to see previously completed workouts.
* As a user, I want workouts grouped by year.
* As a user, I want to see the exercises and sets recorded in a workout.
* As a user, I want to edit an existing workout.
* As a user, I want to delete an existing workout.
* As a user, I want to log workouts for previous dates.

## Progression

* As a user, I want to select an exercise.
* As a user, I want to see my best recorded weight.
* As a user, I want to see an estimated 1RM.
* As a user, I want to see the number of sessions containing the exercise.
* As a user, I want to visualize weight progression over time.

## Routine Management

* As a user, I want to define a routine for each day.
* As a user, I want to rename a workout day.
* As a user, I want to add exercises to a routine.
* As a user, I want to remove exercises.
* As a user, I want to define set ranges.
* As a user, I want to define repetition ranges.
* As a user, I want to define the target muscle group.

## Data Management

* As a user, I want workout data to persist after refreshing the page.
* As a user, I want to manually create a backup.
* As a user, I want to restore data from a backup.

---

# 7. Functional Requirements

## FR-01 — Workout Day Selection

The application shall allow the user to select a workout day from Monday through Sunday.

The selected day shall determine which routine is displayed.

---

## FR-02 — Date Selection

The application shall allow the user to select a workout date.

The user shall be able to log workouts for previous dates.

Future dates shall not be selectable from the current workout interface.

The application derives the weekday from the selected date.

---

## FR-03 — Exercise Display

For each exercise in the selected routine, the application shall display:

* Exercise name.
* Target muscle group.
* Target set range.
* Target repetition range.
* Previous recorded sets when available.

---

## FR-04 — Set Management

The user shall be able to:

* Enter weight.
* Enter repetitions.
* Mark a set as completed.
* Add a set.
* Delete a set.
* Copy the first set's weight to all sets.

---

## FR-05 — Exercise Management During Workout

The user shall be able to:

* Skip an exercise.
* Re-enable a skipped exercise.
* Remove an exercise from the current workout.
* Add an additional exercise.

Additional exercises may be assigned a muscle group and are treated as custom workout entries.

---

## FR-06 — Workout Completion

When the user finishes a workout:

1. Exercises marked as skipped shall be excluded.
2. Sets without recorded repetitions shall not be saved.
3. Recorded weight and repetitions shall be converted into numeric values.
4. At least one exercise with recorded repetitions shall be required.
5. The workout shall be stored in the workout history.

The application currently uses repetitions as the minimum condition for saving a set.

---

## FR-07 — Workout Editing

The user shall be able to open an existing workout and modify its recorded data.

Editing an existing workout shall update the original record rather than create an additional duplicate record.

---

## FR-08 — Workout Deletion

The user shall be able to delete a previously saved workout.

The application shall request confirmation before deletion.

---

## FR-09 — Workout History

The History module shall display:

* Workout date.
* Workout name.
* Number of exercises.
* Total training volume.

The current volume calculation is:

**Training Volume = Σ (Weight × Repetitions)**

for all recorded sets in the workout.

---

## FR-10 — Progression Tracking

The Progression module shall allow the user to select an exercise and view:

* Best recorded weight.
* Estimated 1RM.
* Number of sessions.
* Historical top-set weight.
* A progression graph.

---

## FR-11 — Estimated 1RM

The application shall estimate 1RM using the following formula:

**Estimated 1RM = Weight × (1 + Reps / 30)**

The application calculates the highest estimated value across the exercise's recorded sets.

This value is an estimate and shall not be treated as an actual tested one-repetition maximum.

---

## FR-12 — Routine Management

The Routine module shall allow the user to configure each day independently.

Each routine exercise shall support:

* Exercise name.
* Muscle group.
* Minimum sets.
* Maximum sets.
* Minimum repetitions.
* Maximum repetitions.

The application shall allow exercises to be added and removed from a routine.

---

## FR-13 — Local Persistence

The application shall persist application data using browser `localStorage`.

Two categories of data are currently stored:

* Main application data.
* Current workout draft.

The application shall restore saved data when reopened in the same browser environment.

---

## FR-14 — Workout Draft Persistence

While a workout is being entered, the current draft shall be stored separately from completed workout history.

This prevents a partially completed workout from being treated as a completed workout.

---

## FR-15 — Backup

The user shall be able to create a manual backup of the application state.

## The current implementation serializes the application state as JSON and copies it to the clipboard when possible.

## FR-16 — Restore

The user shall be able to paste a previously created JSON backup.

The application shall validate that the restored object contains the required `plan` and `logs` structures before replacing the current application state.

---

# 8. Application Structure

The current application contains four primary views.

## 8.1 Today

Purpose:

**Perform and record the current workout.**

Responsibilities:

* Select date/day.
* Display routine.
* Enter sets.
* Enter weight/reps.
* Skip exercises.
* Add exercises.
* Save workout.

---

## 8.2 History

Purpose:

**Review previously recorded workouts.**

Responsibilities:

* Display saved workouts.
* Group workouts by year.
* Calculate workout volume.
* Expand workout details.
* Edit workouts.
* Delete workouts.
* Start logging a past workout.

---

## 8.3 Progression

Purpose:

**Analyze performance for individual exercises.**

Responsibilities:

* Select exercise.
* Display best weight.
* Display estimated 1RM.
* Display session count.
* Display progression graph.
* Display historical top-set records.

---

## 8.4 Routine

Purpose:

**Configure the workout structure.**

Responsibilities:

* Select workout day.
* Rename routine.
* Add exercises.
* Remove exercises.
* Configure sets.
* Configure reps.
* Configure muscle groups.
* Backup data.
* Restore data.

---

# 9. Data Model

## 9.1 Application State

The application maintains a central state containing:

```text
S
├── plan
│   ├── Monday
│   ├── Tuesday
│   ├── Wednesday
│   ├── Thursday
│   ├── Friday
│   ├── Saturday
│   └── Sunday
│
└── logs
    └── workout records
```

The current implementation initializes this state through a default configuration and loads existing state from `localStorage`.

---

## 9.2 Routine Exercise

A routine exercise contains:

```text
name
muscle
minimum sets
maximum sets
minimum reps
maximum reps
```

---

## 9.3 Workout Record

A saved workout contains:

```text
id
date
day
year
routine day index
workout name
exercises
```

Each exercise contains:

```text
name
muscle
sets
```

Each set contains:

```text
weight
repetitions
```

---

# 10. Data Storage Architecture

## Current Architecture

```text
User
  ↓
Web Browser
  ↓
HTML + CSS + JavaScript
  ↓
Application State
  ↓
localStorage
```

There is currently:

* No backend.
* No API.
* No database server.
* No authentication.
* No cloud storage.

This makes the current application simple and inexpensive to operate, but data is tied to the browser/device unless manually backed up.

---

# 11. UI / UX Requirements

## 11.1 Navigation

The application shall provide navigation between:

* Today
* History
* Progress
* Routine

The current implementation uses a fixed bottom navigation bar.

---

## 11.2 Visual Design

The interface should prioritize:

* Low visual complexity.
* Clear hierarchy.
* Fast data entry.
* Consistent controls.
* Readable workout information.
* Clear distinction between active and skipped exercises.

---

## 11.3 Theme

The application shall support light and dark visual themes through CSS variables and system dark-mode detection.

The current implementation contains both system dark-mode handling and an explicit dark theme selector in the CSS structure.

---

# 12. Technical Requirements

## 12.1 Frontend

Required technologies:

* HTML5
* CSS3
* JavaScript

The current MVP combines all three into a single HTML file.

---

## 12.2 External Dependencies

The current application should not require external JavaScript libraries or frameworks for its core functionality.

---

## 12.3 Browser Storage

The application shall use:

```javascript
localStorage
```

for persistent application state.

---

## 12.4 Rendering

The current application uses JavaScript functions to generate and replace the main application HTML.

The major view functions are:

```text
today_v()
hist_v()
prog_v()
plan_v()
```

## These are selected through the application view map and rendered into the main container.

# 13. Data Integrity Requirements

The application should:

1. Prevent future workout dates from being logged.
2. Prevent saving a completely empty workout.
3. Ignore sets without repetitions when saving.
4. Preserve existing workout IDs when editing.
5. Confirm destructive deletion.
6. Validate imported backup data.
7. Escape user-provided text before inserting it into generated HTML.

The current implementation already includes input escaping through the `esc()` helper.

---

# 14. Current MVP Acceptance Criteria

The MVP is considered functional when the user can complete this workflow:

```text
Open Application
      ↓
Select Workout Day
      ↓
View Routine
      ↓
Enter Weight + Reps
      ↓
Complete Workout
      ↓
Save Workout
      ↓
View History
      ↓
Edit/Delete Workout
      ↓
Open Progression
      ↓
Analyze Exercise Progress
```

The user must also be able to:

```text
Routine
   ↓
Modify Exercises
   ↓
Save Routine
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

---

# 15. Known Limitations

The current implementation has several intentional limitations.

### Storage

Data is stored only in the browser's local storage.

Clearing browser storage can remove application data unless a manual backup exists.

### Backup

Backup is manual rather than automatic.

### Multi-device Usage

Data does not automatically synchronize between devices.

### Analytics

Progression analytics are currently basic.

The application primarily focuses on:

* Top-set weight.
* Estimated 1RM.
* Session count.
* Workout volume.

### Authentication

There is no user account system.

### Backend

There is no server-side data layer.

### Advanced Analytics

The application does not currently provide:

* Muscle-group volume analysis.
* Weekly volume trends.
* Personal-record detection.
* Workout frequency analysis.
* Exercise frequency analysis.
* Fatigue analysis.
* Recovery analysis.
* Deload tracking.

These are potential future improvements rather than current requirements.

---

# 16. Future Scope

Future development should be divided into stages rather than being added indiscriminately.

## Phase 2 — Better Tracking

Potential features:

* Personal Record detection.
* Weekly/monthly volume.
* Exercise frequency.
* Muscle-group volume.
* Workout duration.
* Rest timer.
* Body-weight tracking.
* Notes/RPE/RIR.

## Phase 3 — Better Analytics

Potential features:

* Weekly progression dashboards.
* Volume progression.
* Strength trends.
* Muscle-group balance.
* Training consistency.
* PR history.
* Advanced charts.

## Phase 4 — Architecture Improvement

Potential technical improvements:

```text
Single HTML
     ↓
Separate HTML
     +
CSS
     +
JavaScript
     ↓
Modular JavaScript
     ↓
Clear State Management
     ↓
Optional Backend
```

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

* Generating implementation ideas.
* Explaining unfamiliar code.
* Identifying bugs.
* Suggesting architecture improvements.
* Reviewing implementation.
* Generating test cases.
* Refactoring code.

However, generated code should not automatically be accepted.

The developer should understand:

* What the code does.
* Why the code exists.
* What data it modifies.
* What assumptions it makes.
* What can fail.
* How it interacts with other parts of the application.

---

# 18. Definition of Done

A feature is considered complete only when:

### Functionality

* The feature works according to its specification.

### Data

* Data is stored correctly.
* Existing data is not unintentionally corrupted.

### UI

* The feature is usable.
* States and actions are understandable.

### Error Handling

* Invalid or incomplete input is handled appropriately.

### Testing

The feature has been manually tested through its primary workflow and relevant edge cases.

### Understanding

The developer can explain:

1. The purpose of the feature.
2. The data flow.
3. The main functions involved.
4. The important edge cases.
5. How the feature could fail.

---

# 19. Current Project Status

## Implemented

* [x] Workout day selection
* [x] Date selection
* [x] Routine display
* [x] Set logging
* [x] Weight logging
* [x] Rep logging
* [x] Set completion checkbox
* [x] Skip exercise
* [x] Add exercise
* [x] Add/remove sets
* [x] Copy weight across sets
* [x] Previous-set display
* [x] Previous-weight prefill
* [x] Workout saving
* [x] Workout editing
* [x] Workout deletion
* [x] Past workout logging
* [x] Workout history
* [x] Training-volume calculation
* [x] Exercise progression
* [x] Best-weight calculation
* [x] Estimated 1RM
* [x] Progression graph
* [x] Routine customization
* [x] Local persistence
* [x] Draft persistence
* [x] JSON backup
* [x] JSON restore
* [x] Light/dark visual support
* [x] Responsive layout

## Not Implemented

* [ ] Authentication
* [ ] Backend
* [ ] Database
* [ ] Cloud synchronization
* [ ] Multi-device synchronization
* [ ] Automatic backup
* [ ] Advanced analytics
* [ ] Nutrition tracking
* [ ] Body-weight tracking
* [ ] RPE/RIR tracking
* [ ] Rest timer
* [ ] Personal-record system
* [ ] AI workout recommendations

---

# 20. Product Principle

The application should remain **simple before sophisticated**.

The primary loop is:

> **Plan → Train → Record → Review → Improve**

Every future feature should be evaluated against this loop.

If a feature increases complexity without significantly improving workout tracking, progression analysis, or decision-making, it should not be prioritized.
