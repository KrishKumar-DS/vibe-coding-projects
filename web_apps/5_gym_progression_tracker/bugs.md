# Gym Progression Tracker — Bugs and Immediate Fixes

**Date:** 2026-10-27 (last updated 2026-11-24)
**Baseline:** `docs/PRD.md` updated to match the current implementation
**Test status:** `node tests/run-tests.mjs` → **609 passed, 0 failed**; Playwright UI pass (2026-11-19) → **64/72 checks passed, 5 open issues**; static + Node harness review (2026-11-24) → **10 further open issues** (#43–#52); #38 re-checked in Chromium (2026-11-25) at 320/360/390/768/1280
**Scope of this document:** code quality, correctness, data integrity, UX, security, documentation, and test gaps

> Open issues found in the 2026-11-19 Playwright UI pass are listed below, followed by the 2026-11-24 static/harness review (#43–#52). Resolved items are archived under [Resolved Items](#resolved-items), together with their regression coverage.
> Items keep their original numbers so existing references remain stable.

---

## Open Items Summary

| # | Priority | Area | Issue |
|---|----------|------|-------|
| 39 | P3 | Responsive | Date field clips at 320px on long weekday names |
| 40 | P3 | Responsive | Reps placeholder clips at 320px |
| 41 | P3 | Copy | History says "1 workouts" |
| 42 | P3 | Console | Missing favicon logs a 404 on every load |
| 43 | P2 | Data integrity | Fractional reps from a backup normalize to 0 and the workout vanishes on reload |
| 44 | P2 | Restore validation | Array, empty, or out-of-range plan entries pass validation and blank the routine |
| 45 | P2 | Input validation | Huge weights/reps are accepted, render Infinity, or save as null |
| 46 | P3 | Recovery copy | Negative-weight repair is reported as "oversized target(s)" |
| 47 | P3 | Data integrity | Duplicate exercise entries double-count History volume |
| 48 | P3 | Recovery copy | A non-array routine `ex` is emptied without a warning |
| 49 | P3 | Copy | "the default routine was restored" fires for a single day |
| 50 | P3 | UX | A future-dated draft loads but cannot be finished |
| 51 | P3 | UX | A checked 0-rep set is silently discarded at Finish |
| 52 | P3 | Validation | Non-string routine names become blank exercises |

### Recommended next patch

Fix the data-integrity items first: **#43–#45** share the normalization/validation layer and can silently lose or corrupt saved workouts. Add harness regressions for each before touching the UI.

Then fix **#39–#42** in one pass; they are small markup/copy/CSS changes. #36, #37, and #38 are already resolved. Re-check #40 at 320px: the #36 checkbox fix should free enough space for the reps placeholder, but keep it open until the browser pass confirms it. Add a regression test for #41, then rerun the Playwright pass at 1280/768/390/320. The remaining items (#46–#52) are small diagnostics/validation gaps that can follow in the same release.

Resolved work is listed below. Items **18, 20–24, and 26–38** are complete.

---

# Open Items

Items in this section were found by manually exercising the app through Playwright on **2026-11-19** (Chrome for Testing 140, Playwright 1.66, viewports 1280×900, 768×1024, 390×844, and 320×568). The four remaining items are reproducible in the current checkout.

Items **#43–#52** were added on **2026-11-24** by static review plus a Node `vm` harness (stubbed DOM/localStorage) against the current checkout. Each behavior below was reproduced in that harness. The automated suite still passes (609/609) because none of these cases are covered yet.

## 39. Date field clips at 320px on long weekday names

**Priority:** P3
**Status:** Open
**Where:** `js/app.js` — `today_v()` date row; `css/style.css` — `.row input`

### Problem

On the 320px viewport, the native date input is squeezed to about 126px by the adjacent `Thursday · 2026` label. The displayed value is cut off (`11/19/202` behind the calendar icon). The clipping depends on the weekday name: `Monday · 2026` fits, `Thursday · 2026` does not.

### Reproduction

1. Set the viewport to 320×568.
2. Open **Today** on a Thursday (or another long weekday name).

### Fix

Give the date input enough intrinsic width and let the header row wrap instead of squeezing it, for example:

```css
.date-row { flex-wrap: wrap; }
#dt { min-width: 140px; }
```

Then add the class to the date row in `today_v()`. Alternatively, render only the weekday (not the year) beside the picker at narrow widths.

### Acceptance

- [ ] The full date value is visible at 320px for every weekday.
- [ ] The weekday/year label remains readable.
- [ ] No horizontal overflow is introduced.

---

## 40. Reps placeholder clips at 320px

**Priority:** P3
**Status:** Open
**Where:** `js/app.js` — reps input placeholder; `css/style.css` — `.row input` / `.ok`

### Problem

At 320px, the planned reps hint is cut off (`12-15` renders as `12-1`, `10-15` as `10-1`). The root cause is the over-wide checkbox in #36 consuming space that should belong to the inputs.

### Reproduction

1. Set the viewport to 320×568.
2. Open **Today** → **Mon**.
3. Look at the reps placeholders on Lateral Raise or Triceps Pushdown.

### Fix

Fixing #36 raises the reps input from 68px to 82px at 320px and makes the placeholder readable (verified with an injected stylesheet). If further space is needed, shorten the narrow-width placeholder to `reps`.

### Acceptance

- [ ] Planned rep ranges are fully readable at 320px.
- [ ] The fix does not require changing the stored range values.

---

## 41. History says “1 workouts”

**Priority:** P3
**Status:** Open
**Where:** `js/app.js` — `hist_v()`

### Problem

The year heading always uses the plural noun: a single saved workout produces “2026 **1 workouts**”.

### Reproduction

1. Save exactly one workout.
2. Open **History** and read the year heading.

### Fix

Pluralize the count:

```js
`${ls.length} ${ls.length === 1 ? 'workout' : 'workouts'}`
```

### Acceptance

- [ ] One workout renders “1 workout”.
- [ ] Zero/multiple counts keep the plural form.
- [ ] A regression test covers both forms.

---

## 42. Missing favicon logs a 404 on every load

**Priority:** P3
**Status:** Open
**Where:** `index.html`

### Problem

The page declares no icon, so the browser requests `/favicon.ico` and the console/server records a 404 on every load. This pollutes the console and any network monitoring during debugging; no other runtime errors were observed.

### Reproduction

1. Load the app with DevTools open (or watch the static server log).
2. Observe `GET /favicon.ico 404` and a console resource error.

### Fix

Add an inline empty icon (or a real asset) to the document head:

```html
<link rel="icon" href="data:,">
```

### Acceptance

- [ ] Loading the app produces no favicon 404.
- [ ] No other console errors are introduced.

---

### Additional observations from the same Playwright pass

These are already covered by **Related Known Limitations** below; they were re-confirmed but are not new open items:

- **Accessible names:** set checkboxes have no name; weight/reps inputs rely on placeholders; `✕`/`🗑` buttons expose only their glyphs. The accessibility tree shows bare `checkbox` and `spinbutton "kg"` entries, which do not identify the exercise or set.
- **Contrast:** accent orange (`#e8590c`) measures **3.28:1** on the light page background and **3.58:1** on white, below WCAG AA for the 15px text used by the ghost/primary buttons. `#c2410c` would reach about **4.75:1** on the page background and **5.18:1** on white.
- **Native constraints are not surfaced:** number inputs declare `min`/`max`, but because the app has no form submission or `checkValidity()` call, the browser's validation UI never appears. The Finish handler now performs its own non-negative weight check (#35); native constraint bubbles remain unused, so range inputs still silently normalize.

---

## 43. Fractional reps from a backup normalize to 0 and vanish on reload

**Priority:** P2
**Status:** Open
**Where:** `js/app.js` — `normLogEx()`, `isCompleted()`, Finish handler (`a === 'fin'`)

### Problem

`validateImport()` accepts any finite `r > 0`, including a fractional value such as `0.5`. Restore then runs `normLogEx()`, which checks `r <= 0` on the raw value but stores `r: Math.floor(r)`. A `0.5` therefore becomes `0`. The app's own `isCompleted()` requires `r > 0`, so the next boot drops that set; if it was the exercise's only set, the exercise and workout are dropped too.

The Finish path handles the same input differently (`Math.max(1, Math.floor(+s.r) || 1)`), so a value typed in the UI becomes `1` while a restored value becomes `0`.

### Reproduction

1. Restore `{"plan":{"0":{"name":"Push","ex":[]}},"logs":[{"id":"L1","date":"2026-10-12","ex":[{"n":"Bench","m":"Chest","sets":[{"w":60,"r":0.5}]}]}]}`.
2. Observe `Backup restored.` and the stored set `{"w":60,"r":0}`.
3. Reload.

Result: the workout disappears and a recovery alert reports the dropped workout/exercise/set entries.

### Fix

Normalize reps with the same rule used by Finish (`Math.max(1, Math.floor(r))`), or reject fractional reps in `validateImport()` so restore stays strict. Prefer one shared helper so boot, restore, and Finish cannot diverge.

### Acceptance

- [ ] A restored set with `r: 0.5` either saves `r: 1` or is rejected with a clear error.
- [ ] No set is stored with `r <= 0`.
- [ ] A harness test covers restore plus reload with fractional reps.

---

## 44. Restore accepts array, empty, or out-of-range plan entries

**Priority:** P2
**Status:** Open
**Where:** `js/app.js` — `validateBackup()`, `normPlan()`, restore handler (`a === 'rs'`)

### Problem

`validateBackup()` checks `typeof p !== 'object'` for each plan entry but not `Array.isArray(p)`, so `[]` passes. `normPlan()` then treats arrays as invalid and, because restore calls `normalizeData(o, { fallbackPlan: false })`, falls back to an empty day.

The validator also accepts a plan with no recognized day keys (`{}` or `{"7": ...}`), which restore turns into seven blank days. Each case reports `Backup restored.` even though the routine was silently blanked. This contradicts the comment that restore is strict and rejects bad backups.

### Reproduction

Restore each of these in turn:

- `{"plan":{"0":[]},"logs":[]}` → day 0 becomes `{"name":"","ex":[]}`.
- `{"plan":{},"logs":[]}` → all seven days blank.
- `{"plan":{"7":{"name":"X","ex":[]}},"logs":[]}` → key ignored, all seven days blank.

### Fix

In `validateBackup()`, reject arrays for plan entries, require at least one valid day key, and reject keys outside `0–6`/full day names (or normalize them before validating). Return a specific error instead of accepting a plan that normalizes to nothing.

### Acceptance

- [ ] Array plan entries are rejected with a clear message.
- [ ] Empty and out-of-range plans are rejected instead of blanking the routine.
- [ ] A restore test asserts the existing routine is unchanged after rejection.

---

## 45. Huge weight or rep values are accepted and corrupt stats/data

**Priority:** P2
**Status:** Open
**Where:** `js/app.js` — today-view inputs, Finish handler (`a === 'fin'`), `validateImport()`, `hist_v()`

### Problem

The weight/reps inputs declare no `max`, and Finish accepts any finite number. A large finite weight such as `1e308` is stored and then multiplied by reps for History volume, producing `Infinity` (`"Infinity kg vol"`); Progress renders labels such as `1e+308kg`.

If a value parses to `Infinity`, `JSON.stringify` serializes it as `null`; on reload a huge weight silently becomes `0 kg`, and huge reps cause the whole workout to be dropped with a recovery alert. Restore accepts the same finite values because `validateImport()` only checks `Number.isFinite(w)` and `Number.isFinite(r)`.

### Reproduction

1. On Today, enter weight `1e308`, reps `10`, tick the set, and Finish.
2. Open History: the volume reads `Infinity kg vol`.
3. (Optional) Use a draft value that parses to `Infinity` (for example `1e999` in a browser that accepts it) and reload: the set is saved with `null` and later becomes `0 kg` or is dropped.

### Fix

Define a realistic upper bound (for example 1000 kg and 1000 reps, matching the planned-rep cap) and enforce it in the inputs (`max`), in Finish, and in `validateImport()`. Reject non-finite values with an explicit message rather than letting `JSON.stringify` turn them into `null`.

### Acceptance

- [ ] Out-of-range weights/reps are rejected at Finish and on restore.
- [ ] No stored set contains `null`, `Infinity`, or `NaN`.
- [ ] History/Progress never render `Infinity` or exponent-notation weights for accepted data.
- [ ] Tests cover the largest accepted value and one value above it.

---

## 46. Negative-weight repair is reported as “oversized target(s)”

**Priority:** P3
**Status:** Open
**Where:** `js/app.js` — `cappedBound()`, `normLogEx()`, `bootState()`

### Problem

`diag.clamped` is shared by two unrelated repairs: capping an oversized planned bound (`cappedBound()`) and clamping a negative saved weight (`normLogEx()`). `bootState()` always describes the count as “oversized target(s) were capped”, so a negative weight is reported with the wrong cause.

### Reproduction

1. Store `{"plan":{...},"logs":[{"date":"2026-10-12","ex":[{"n":"Bench","sets":[{"w":-5,"r":8}]}]}]}` in `localStorage.gym_data`.
2. Reload.

Result: alert `1 oversized target(s) were capped`; the stored set becomes `{"w":0,"r":8}`.

### Fix

Track negative-weight clamps separately (for example `diag.negativeWeights`) and report “N negative weight(s) were reset to 0” from `bootState()`. Keep the existing oversized-target message for planned bounds.

### Acceptance

- [ ] A negative stored weight produces a message that names the weight repair.
- [ ] Oversized planned bounds still produce the “oversized target(s)” message.
- [ ] A boot test asserts both messages.

---

## 47. Duplicate exercises in one workout double-count History

**Priority:** P3
**Status:** Open
**Where:** `js/app.js` — `validateBackup()`/`validateImport()`, `hist_v()`, `prog_v()`

### Problem

The UI prevents the same plan exercise from appearing twice in one workout, but restore/import validation does not reject duplicate exercise entries. History sums every entry for volume, while Progress uses `.find()` and therefore counts only the first entry for a date. A restored duplicate therefore inflates volume and the exercise count but changes nothing in the chart.

### Reproduction

Restore a workout with two `Bench` entries: `60×10` and `50×10`.

Result: History shows `2 ex · 1100 kg vol`; Progress charts the `60×10` entry only.

### Fix

Reject duplicates within `l.ex` in `validateBackup()` (by `xid` when present, otherwise name+muscle), or merge them during normalization and report the merge. Add a regression test that restores two same-name entries and asserts one is rejected or merged consistently.

### Acceptance

- [ ] A workout cannot be restored with two entries for the same exercise.
- [ ] History volume and Progress agree for every accepted workout.
- [ ] The rejection message identifies the duplicate exercise.

---

## 48. A non-array routine `ex` is emptied without a warning

**Priority:** P3
**Status:** Open
**Where:** `js/app.js` — `normPlan()`

### Problem

`normPlan()` renders `ex: Array.isArray(p.ex) ? ... : []`. A stored day whose `ex` is not an array therefore loses all exercises, but no diagnostic counter is incremented, so `bootState()` reports that the data was readable and the loss is silent. Restore rejects this shape, so the gap is boot-only.

### Reproduction

Store `{"plan":{"0":{"name":"Push","ex":"oops"}},"logs":[]}` and reload.

Result: day 0 becomes `{"name":"Push","ex":[]}` with no alert; the emptied plan is persisted.

### Fix

Count a non-array `ex` as dropped exercises (or set a dedicated diagnostic) so `bootState()` reports it, and keep the recovery copy. Consider rejecting the day rather than silently emptying it.

### Acceptance

- [ ] A non-array `ex` produces a repair message naming the dropped exercises.
- [ ] A boot test covers the case and asserts the recovery copy exists.

---

## 49. “the default routine was restored” fires for a single day

**Priority:** P3
**Status:** Open
**Where:** `js/app.js` — `normPlan()`, `bootState()`

### Problem

`diag.planFallback` is a single boolean set whenever any one day is malformed, but the message says the whole default routine was restored. If only day 0 was invalid, days 1–2 keep the user's routine and the message still claims a full reset.

### Reproduction

Store a plan with day 0 as `[]` and valid custom days 1–2, then reload.

Result: alert `Readable data was normalized: the default routine was restored.`; day 0 becomes the default push day while days 1–2 remain the user's routines.

### Fix

Track which days fell back (for example `diag.planFallbackDays = [0]`) and report “day 0 was reset to the default routine” or “N routine day(s) were reset”. Keep the existing wording only when all seven days fall back.

### Acceptance

- [ ] A single-day fallback names that day.
- [ ] A full-plan fallback keeps the “default routine” wording.
- [ ] A boot test covers both.

---

## 50. A future-dated saved draft loads but cannot be finished

**Priority:** P3
**Status:** Open
**Where:** `js/app.js` — `normDraft()`, `today_v()`, Finish handler (`a === 'fin'`)

### Problem

`normDraft()` validates only that `d.date` is a date; it does not reject or repair a future date. Today renders the date input with a `value` greater than its `max`, and Finish then refuses to save with “Please choose a valid date that is not in the future.” The draft stays open until the user manually changes the date.

### Reproduction

Seed `localStorage.gym_draft` with `{"date":"2026-10-20","di":1,"ex":[...]}` while “today” is `2026-10-13`, then open Today and press Finish.

Result: the future date is displayed; Finish alerts and saves nothing.

### Fix

In `normDraft()`, clamp a future `date` to today (or discard the draft with a notice), matching the repair policy used for future logs at boot (`diag.futureLogs`).

### Acceptance

- [ ] A future-dated draft cannot be loaded into the editor unchanged.
- [ ] The repair is reported or the draft is reset consistently with future-log handling.
- [ ] A harness test covers the future-draft case.

---

## 51. A checked set with 0 reps is silently discarded at Finish

**Priority:** P3
**Status:** Open
**Where:** `js/app.js` — `isCompleted()`, Finish handler (`a === 'fin'`)

### Problem

`isCompleted()` requires `r > 0`, and Finish filters sets through it without warning. A set the user explicitly ticked but left at `0`/blank reps therefore disappears from the saved workout. Blank exercise names and negative weights get explicit errors, so this silent drop is inconsistent.

### Reproduction

Start a workout, tick a set with weight `60` and reps `0`, tick a second set with `60 × 10`, then Finish.

Result: only the `60 × 10` set is saved; no alert mentions the discarded checked set.

### Fix

At Finish, count checked sets whose reps are not positive and show an error naming the exercise/set, or uncheck them with an explicit notice. Ensure the user can tell the difference between “not done” and “done but invalid”.

### Acceptance

- [ ] Finish never silently discards a checked set.
- [ ] The message identifies the exercise and set number.
- [ ] A harness test covers a checked 0-rep set alongside a valid set.

---

## 52. Non-string routine exercise names become blank exercises

**Priority:** P3
**Status:** Open
**Where:** `js/app.js` — `normRoutineEx()`

### Problem

`normRoutineEx()` accepts an entry if it has an `n` or `name` property, then converts a non-string name to `''`. An entry such as `{n: 5}` survives as a nameless routine exercise. The Routine tab shows a blank entry, and Today refuses to finish until it is named or removed.

### Reproduction

Store `{"plan":{"0":{"name":"Push","ex":[{"n":5}]}},"logs":[]}` and reload.

Result: the routine day contains an exercise with `n: ""`; no alert is shown.

### Fix

Reject exercises whose name is present but not a non-empty string (or coerce only when a string is available), and count the dropped entry so boot reports it.

### Acceptance

- [ ] A non-string name is either rejected with a repair message or normalized to a usable string.
- [ ] No routine exercise renders with a blank name from imported/stored data.
- [ ] A boot test covers the case.

---

# Resolved Items

## 38. Bottom navigation wraps to two lines at 320px

**Priority:** P3
**Status:** Resolved
**Where:** `css/style.css` — `nav button`

### Problem

At a 320px viewport, each nav button was 80px wide and its emoji + label no longer fit on one line. The nav grew from 47px to **65px**, and “Progress” and “Routine” wrapped below their icons while “Today” and “History” stayed inline, producing an uneven bar. At 360px and above the nav was already a single line.

### Reproduction

1. Set the viewport to 320×568.
2. Observe the bottom navigation.

### Fix

`nav button` now keeps its emoji + label on one line, and a narrow-width breakpoint tightens the type so all four tabs fit:

```css
nav button {
  /* … */
  white-space: nowrap
}

@media (max-width: 359px) {
  nav button {
    font-size: 12px;
    padding-left: 2px;
    padding-right: 2px
  }
}
```

The breakpoint stops at 359px so 360px and wider layouts keep the original 13px type. At 320px each tab is still 80px wide, the nav stays a single **45.8px** line, and no label overflows its button. The 90px bottom padding on `main` still clears the bar.

Regression coverage: `tests/run-tests.mjs` section “Bug 38 — bottom nav stays on one line at 320px”; re-checked in Chromium at 320/360/390/768/1280 with no horizontal page overflow and no per-button content overflow.

### Acceptance

- [x] The nav is one line at 320px and every label remains readable.
- [x] No label is clipped and all four tabs stay tappable.
- [x] 360px+ layouts are unchanged.

---

## 37. Equal minimum and maximum targets displayed as “3-3 sets”

**Priority:** P3
**Status:** Resolved
**Where:** `js/app.js` — `rangePart()`

### Problem

When a planned range's minimum equalled its maximum, `rangePart()` always formatted a range, so target labels repeated the number: Incline DB Press showed `3-3 sets × 8-12 reps`, and an equal rep range would show `10-10 reps`.

### Reproduction

1. Open **Today** and choose **Mon**.
2. Read the target text under Incline DB Press or Triceps Pushdown (or any exercise with equal bounds).

Result: the label repeated the shared value.

### Fix

`rangePart()` now returns a single value when both bounds are present and equal:

```js
if (lo == null) return `≤${hi} ${unit}`;
if (hi == null) return `${lo}+ ${unit}`;
if (lo === hi) return `${lo} ${unit}`;
return `${lo}-${hi} ${unit}`;
```

Equal bounds render as `3 sets` / `10 reps`; unequal (`3-4 sets`) and one-sided (`3+ sets`, `≤4 sets`) forms are unchanged.

Regression coverage: `tests/run-tests.mjs` section “Bug 37 — equal min/max targets collapse to one value”; the existing “Bugs.md 8” cases cover unequal and one-sided bounds.

### Acceptance

- [x] Equal bounds render as “3 sets” / “10 reps”.
- [x] Unequal and one-sided ranges keep their current output.
- [x] A regression test covers equal, unequal, and one-sided bounds.

---

## 36. Set checkboxes rendered far wider than intended

**Priority:** P3
**Status:** Resolved
**Where:** `css/style.css` — `.row input` and `.ok`

### Problem

Every set checkbox was intended to be a 22×22 control, but `.row input { flex: 1; width: 0 }` had higher specificity than `.ok { width: 22px; height: 22px; flex: none }`. The checkbox stretched to 50–73px, creating a large invisible click target and stealing width from the weight/reps inputs.

### Reproduction

1. Open **Today** → **Mon**.
2. Measure `input[data-f="d"]` in DevTools, or view the page at 390px/320px.

Result: the element was 73px/50px wide instead of 22px.

### Fix

The checkbox rule now uses the compound selector `.row input.ok`, which outranks `.row input`, and keeps the control out of the flex distribution:

```css
.row input.ok {
  accent-color: var(--ok);
  flex: 0 0 auto;
  width: 22px;
  height: 22px
}
```

`accent-color` and the 22×22 size are unchanged; only the selector specificity and flex behaviour changed.

Regression coverage: `tests/run-tests.mjs` section “Bug 36 — set checkboxes keep their 22px size”. The browser measurement and the expected #40 side effect still need the Playwright pass at 320px/390px.

### Acceptance

- [x] `.row input.ok` wins the cascade and pins the control to 22×22.
- [x] The checkbox no longer participates in flex growth, so weight/reps inputs receive the freed space.
- [x] A regression test asserts the checkbox rule.
- [ ] Computed width and horizontal overflow re-checked in Playwright at 320px/390px.

---

## 35. Negative weight is silently saved as 0 kg

**Priority:** P2
**Status:** Resolved
**Where:** `js/app.js` — `isCompleted()`, Finish handler (`a === 'fin'`), today-view weight input

### Problem

A completed set with a negative weight passed Finish validation and was persisted as `{ w: 0, r: ... }`. No warning was shown, so the user was not told that the recorded weight had been changed.

### Reproduction

1. Open **Today** and choose **Mon**.
2. Enter weight `-10` and reps `10` for set 1.
3. Tick set 1 and press **Finish & Save Workout**.

Result: the workout was saved with `w: 0`, and no message appeared. The input's native `min="0"` constraint never fires because the app does not submit a form or call `checkValidity()`.

### Fix

- Added `firstNegativeWeightSet()`, which scans included exercises for completed sets whose numeric weight is negative.
- Finish now blocks before building the saved record, shows `Weight cannot be negative for <exercise> (set N). Enter 0 for bodyweight or remove the minus sign.`, focuses/selects the offending input when the DOM supports it, and keeps the draft open.
- Blank weights still become `0`; `0`, decimals, and skipped exercises are unchanged. Boot still clamps malformed stored values, and strict restore already rejects negative weights.
- The defensive `Math.max(0, +s.w || 0)` mapping remains as a fallback and is no longer reachable through normal Finish validation.

Regression coverage: `tests/run-tests.mjs` section “Bug 35 — negative weights are rejected; zero and decimals stay valid” (rejection, correction/retry, zero and decimal weights, skipped exercise, edit mode).

### Acceptance

- [x] A completed set with a negative weight cannot be saved.
- [x] The user sees a clear message naming the problem.
- [x] Weight `0` remains valid for bodyweight sets.
- [x] A regression test covers negative weight in a completed set.

---

## 20. Changing the date while editing moved the saved workout; there was no Cancel Edit path

**Priority:** P1
**Status:** Resolved
**Where:** `js/app.js` — `openDate()`, the weekday-chip handler (`a === 'day'`), the date-input change handler (`id === 'dt'`), Finish (`a === 'fin'`), and the Today view

### Problem

Once today had a saved workout, opening Today auto-loaded that workout as an edit draft (`D.editId` was set). Choosing another date with the date picker or weekday chips changed the existing record's date directly: no explicit move/start-new choice, no warning, and no way to abandon an edit. Finish then updated the original record at the new date instead of creating a new workout.

### Reproduction

1. Save today's workout.
2. Open Today; it auto-loads today's workout in edit mode.
3. Choose an empty past date with the date picker or weekday chips.
4. Press **Update**.

Result: today's workout was moved to the chosen date, with no new workout and no move-specific warning.

### Fix

- An edit-mode date change is now a transient in-memory proposal (`pendingMove`). The draft keeps its date and the record is untouched.
- The Today view renders a choice card above the routine with three actions:
  - **Move workout** applies the proposed date to the draft; the record still only changes on **Update Workout**.
  - **Start new here** discards the edit draft (after the dirty-draft confirmation) and starts a separate draft on the target date with no edit link.
  - **Keep editing** dismisses the proposal without changing anything.
- **Cancel edit** was added to the edit banner. It discards the draft (with a confirmation when dirty), leaves the saved record untouched, and returns to History.
- **Update Workout** is blocked while a proposal is pending.
- After a confirmed move, Today notes that the workout moves on Update.
- The occupied-date conflict message now refers to the real **Cancel edit** action.
- The proposal is not persisted: reloading keeps the draft's date and drops the choice.

### Acceptance

- [x] Choosing a past date during an edit does not silently move the existing record.
- [x] The user is warned before any destructive date move.
- [x] There is a clear cancel path for an edit.
- [x] The History past-day control continues to create a separate workout.
- [x] After today is saved, a separate past-day workout can be created from the edit-mode date controls without moving today's record.

Regression coverage: `tests/run-tests.mjs` section “Bugs.md 20 — edit-mode date changes require an explicit move and can be cancelled”.

---

## 18. Add regression tests for the fixes above

**Priority:** Tests
**Status:** Resolved
**Where:** `tests/run-tests.mjs`

### Coverage

Tests added for:

1. ~~Restore with a dirty draft prompts and preserves the draft on cancel.~~ Covered by the Bugs.md 10 tests.
2. ~~Draft and theme injection payloads remain escaped.~~ Covered by the Bugs.md 11 tests.
3. ~~Invalid theme values fall back to `system`.~~ Covered by the Bugs.md 11 tests.
4. ~~Routine validation rejects blank names and inverted ranges.~~ Covered by the Bugs.md 9 tests.
5. ~~First boot followed by a reload with only `gym_draft` preserves plan/log identities and does not split Progress.~~ Covered by the Bugs.md 19 tests.
6. ~~Structurally invalid boot data yields the documented fallback (defaults) and does not silently persist a blank plan.~~ Covered by the Bug #18 boot-repair tests.
7. ~~Backup validation rejects or reports malformed log exercises and set entries instead of silently dropping them.~~ Covered by the Bug #18 malformed-log tests.
8. ~~Restore and boot reject future-dated workouts.~~ Covered by the Bug #18 future-date tests.
9. ~~Adding the same exercise twice in one workout does not create duplicate cards, doubled volume, or duplicate Progress entries.~~ Covered by the Bug #18 duplicate-add tests.
10. ~~Imported duplicate dates do not make both records uneditable.~~ Covered by the Bug #18 duplicate-date tests.
11. ~~Deleting the currently edited workout with dirty changes warns before discarding the draft.~~ Covered by the Bug #18 dirty-delete tests.
12. ~~Blank routine names do not blank out a recorded Progress label, and duplicate-label suffixes preserve muscle information.~~ Covered by the Bug #18 Progress-label tests.
13. ~~Editing a legacy ambiguous-name exercise does not arbitrarily assign one routine identity.~~ Covered by the Bug #18 ambiguous-legacy tests.
14. ~~A valid backup whose write fails reports a storage failure, not an invalid backup.~~ Covered by the Bug #18 restore-write-failure tests.
15. ~~A huge imported/routine `smin` is rejected or capped rather than allocating an unbounded set array.~~ Covered by the Bug #18 cap tests.
16. ~~Invalid stored JSON does not create a new recovery copy on every reload, and a corrupt draft is reported instead of silently overwritten.~~ Covered by the Bug #18 recovery tests.
17. ~~Boot and restore do not crash for prototype-key names (`toString`, `constructor`, `__proto__`).~~ Covered by the Bugs.md 16 tests.
18. ~~The History past-day control opens the chosen date as a new workout without moving an existing record.~~ Covered by the Bugs.md 14 tests.
19. ~~The saved theme is applied before the first paint.~~ Covered by the Bug #18 theme-bootstrap test.

> Already covered: cross-weekday workout-name preservation, weekday-chip date conflicts, disabled future-day chip markup and styling, native-control `color-scheme` theming, the History past-day control, boot/theme storage-failure warnings, accurate recovery-copy reporting, and prototype-key exercise names.

### Acceptance

- [x] Each new test was observed failing before the corresponding fix and passes after it.
- [x] The full suite remains green.
- [x] Test names describe the behavior, not the implementation detail.
- [x] The suite grew from 437 to 588 passing tests.

---

## 21. Structurally invalid stored data becomes a blank or partial plan instead of defaults

**Priority:** P2
**Status:** Resolved
**Where:** `js/app.js` — `normalizeData`, `bootState`, and boot persistence

### Problem

Before the fix, invalid JSON loaded `def()`, but a parsed yet structurally invalid object followed a different path:

```js
recoverCopy(rawStr, 'missing or malformed fields');
return { S: normalizeData(raw), persist: true };
```

`normalizeData({})` produced seven blank routine days with no exercises, and `persist: true` immediately saved that blank plan. The alert still said “default data has been loaded.”

Also, a payload such as `{ plan: "bad", logs: [validLog] }` kept the logs but replaced the entire routine with blank days.

### Reproduction

1. Seed `gym_data` with `{}` or with a missing/invalid `plan`.
2. Open the app.
3. Observe the recovery alert.
4. Check the Routine tab and Today draft.

Before the fix: `plan[0]` was `{ "name": "", "ex": [] }`, the draft had zero exercises, and `gym_data` was rewritten with the blank plan.

After the fix: the default routine is restored, usable logs are preserved, the repaired state is persisted, and the alert states exactly which parts were recovered.

### Fix

- On structural validation failure, load `def()` for an invalid/missing plan while preserving structurally valid logs.
- Do not persist a partial blank state without telling the user exactly what was lost.
- Make the recovery alert and `README.md` match the actual fallback.

Regression coverage: `tests/run-tests.mjs` section “Bug #18 — boot repairs invalid plans without losing usable logs”.

### Acceptance

- [x] A corrupt/empty `gym_data` does not silently erase the default routine.
- [x] The alert accurately states what was recovered.
- [x] Boot does not persist a blank plan after a structural validation failure.
- [x] A regression test starts from `gym_data = "{}"` and asserts the default exercises exist.

---

## 22. Backup/boot validation silently drops malformed log exercises and sets; empty workouts are accepted

**Priority:** P2
**Status:** Resolved
**Where:** `js/app.js` — `validateImport`, `normalizeData` diagnostics, and the restore handler

### Problem

`validateBackup` checked that a log exercise is an object and that `sets` is an array, but it did not check:

- that the exercise has a non-empty string name;
- that each set entry is an object;
- that a set contains usable repetitions;
- that the workout contains at least one exercise.

The normalizer then discarded malformed pieces silently.

### Reproduction

Before the fix:

- Restoring `{plan:{},logs:[{date:"2026-10-13",ex:[{sets:[{w:10,r:5}]}]}]}` showed **“Backup restored.”** but saved a workout with `ex: []`.
- Booting with `{n:"Squat",m:"Legs",sets:[{w:60,r:8},null,{w:70}]}` produced no warning and saved only the first set.
- Restoring a log with `ex: []` was accepted, even though the UI's Finish action prevents creating empty workouts.

After the fix: strict restore rejects the whole backup with a specific message; boot drops unusable entries once and reports the counts.

### Fix

- Require each log exercise to have a non-empty string name and at least one structurally valid set.
- Require each set entry to be an object with finite numeric weight/reps values.
- Reject empty workouts on import; on boot, drop them and report the count.
- Add a boot-time warning when normalization drops log data.

Regression coverage: `tests/run-tests.mjs` section “Bug #18 — malformed logs are rejected on restore and reported on boot”.

### Acceptance

- [x] A backup containing a nameless exercise is rejected with a specific error.
- [x] Null/partial set entries are not silently discarded without feedback.
- [x] Empty workouts are not importable.
- [x] Boot and restore use the same log rules, with repair-on-boot and rejection-on-restore.

---

## 23. Future-dated workouts are accepted on restore and boot

**Priority:** P2
**Status:** Resolved
**Where:** `js/app.js` — `validateImport`, `normalizeData`

### Problem

The UI prevents future workout dates, but a backup containing `date: "2026-12-01"` restores successfully. The workout appears in History and Progress, but Edit → Update always fails with “Please choose a valid date that is not in the future.” It must be moved or deleted.

### Reproduction

1. Restore a backup whose log date is in the future.
2. Open History and Progress; the future workout is present.
3. Edit it and press Update.

Result: the update is rejected until the date is changed.

### Fix

- Reject future dates in `validateBackup`.
- In `normalizeData`, skip future logs with a warning or repair them explicitly.
- Keep the existing defensive check in Finish.

### Acceptance

- Future-dated backups are rejected or repaired with a visible warning.
- Accepted workouts never have dates after today.
- History and Progress cannot contain future sessions from an import.

---

## 24. “Add exercise” allows duplicates within one workout

**Priority:** P2
**Status:** Resolved
**Where:** `js/app.js` — `addx`, `addName`/`addMuscle` state, and the add-exercise inputs

### Problem

`addx` does not check whether the draft already contains the exercise. Adding “Bench Press” to a workout that already has Bench Press creates a second card. On save, History shows both entries and training volume counts both.

The added entry now reuses the routine identity, so Progress merges it with existing sessions; the duplicate rows and doubled volume remain.

The name/muscle inputs are not cleared after adding, and any re-render (Skip, +Set, tab switch) wipes text that has not been added yet, making accidental duplicates easy.

### Reproduction

1. Open a routine day containing “Bench Press”.
2. Add “Bench Press” again via the add-exercise form.
3. Complete a set in both cards and finish.
4. Check History and Progress.

Result: two Bench Press entries in History and doubled volume.

### Fix

- Check the draft by stable identity or normalized name before appending.
- Alert, focus the existing card, or merge instead of creating a duplicate.
- Clear and refocus the name/muscle fields after a successful add.
- Preserve un-added field text across incidental re-renders, or disable duplicate adds.

### Acceptance

- Adding an exercise already in the draft does not create a second card.
- Volume is not double-counted.
- The add form clears after a successful add.
- Re-rendering does not silently erase text the user is still editing.

---

## 26. Duplicate dates from an imported backup make both workouts uneditable

**Priority:** P2
**Status:** Resolved
**Where:** `js/app.js` — `validateImport`, `normalizeData`, `dateTaken`

### Problem

Duplicate dates are listed as a known limitation, but the conflict check makes the consequence worse: editing either duplicate always finds the other workout on the same date and blocks Update. The user must delete or move a record before either can be edited.

### Reproduction

1. Restore a backup containing two logs with the same date and different IDs.
2. Edit one of them from History.
3. Press Update without changing the date.

Result: “Another workout already exists…” and the edit cannot be saved.

### Fix

- Reject or deduplicate duplicate dates during restore, or
- Preserve the record being edited and allow a same-date update when the conflict is one of the known imported duplicates.
- Make `openDate` behavior explicit when duplicates exist.

### Acceptance

- Imported duplicates are rejected or made editable.
- The conflict check still prevents creating a second same-date workout through the UI.
- Progress does not silently count duplicate-date sessions as separate legitimate sessions.

---

## 27. Deleting the workout currently open in the draft discards dirty changes

**Priority:** P3
**Status:** Resolved
**Where:** `js/app.js` — `dl` handler

### Problem

Deleting a workout that is currently open in the draft clears `D` without checking whether the draft has unsaved changes. The only confirmation is the generic “Delete this workout?” prompt; it does not mention the dirty draft.

### Reproduction

1. Edit a saved workout.
2. Change a weight or reps value.
3. Go to History and delete that workout.
4. Confirm deletion.

Result: the dirty draft is discarded and replaced by a fresh Today draft, with no additional warning.

### Fix

- If `D.editId` matches the deleted record and `draftHasData(D)`, ask specifically about unsaved changes before deleting/clearing the draft.
- Alternatively, extend the delete confirmation text to state that unsaved edits will be lost.

### Acceptance

- Deleting a clean workout being edited proceeds normally.
- Deleting a dirty workout being edited warns about the unsaved draft.
- Cancelling leaves both the workout and draft intact.
- Confirming performs the deletion and clears the draft.

---

## 28. Empty routine names and suffix logic break Progress labels

**Priority:** P3
**Status:** Resolved
**Where:** `js/app.js` — `prog_v()` label selection and disambiguation

### Problem

Two related label issues:

1. If the current routine exercise name is empty, it overrides the recorded log name with `''`, leaving a blank option in the Progress selector.
2. When labels still collide, the suffix loop resets to `${g.label} (${i++})`, dropping the muscle-disambiguated label. Two same-name/same-muscle groups render as `Bench Press · Chest` and `Bench Press (2)`, so the second loses its muscle context.

### Reproduction

- Set a routine exercise's name to empty; a log with a real name for that `xid` then renders as a blank Progress option.
- Import/record two identities named “Bench Press” with the same muscle; Progress shows `Bench Press · Chest` and `Bench Press (2)`.

### Fix

- Only prefer the current routine name when it is a non-empty, trimmed string.
- When adding a numeric suffix, build from the current disambiguated label, e.g. `` `${label} (${i++})` ``, so the muscle stays visible.

### Acceptance

- A blank routine name never blanks out a recorded Progress label.
- Duplicate labels retain muscle context and remain distinct.
- The selector always has a non-empty label for a valid group.

---

## 29. Editing a legacy ambiguous-name exercise assigns an arbitrary identity

**Priority:** P3
**Status:** Resolved
**Where:** `js/app.js` — `fromLog`

### Problem

`fromLog` falls back to `pl.find(x => x.n === e.n)` and then sets `xid` to the first match when the log has no identity. If several routine exercises share that name, the edit arbitrarily binds the legacy log to one of them — even though `backfillXids()` deliberately refuses ambiguous names.

### Reproduction

1. Have two routine exercises named “Bench Press” with different IDs.
2. Have a legacy log exercise named “Bench Press” with no `xid`.
3. Edit that log and save.

Result: the draft receives the first matching identity and the workout is assigned to it arbitrarily.

### Fix

- Use `findUniquePlanExercise()` (the helper used by `addx`).
- Assign an identity only when exactly one routine exercise matches the normalized name.
- Otherwise leave `xid` blank so the exercise remains name-based.

### Acceptance

- Ambiguous legacy names are not auto-assigned.
- A unique name match still upgrades the legacy log correctly.
- Progress does not merge unrelated histories through an arbitrary edit.

---

## 30. A valid restore whose write fails is reported as “Invalid backup”

**Priority:** P3
**Status:** Resolved
**Where:** `js/app.js` — restore (`a === 'rs'`)

### Problem

After validation succeeds, a failed storage write produces:

> Invalid backup: could not write to storage.

The backup was valid; the storage write failed. This sends the user toward checking the backup instead of freeing storage or unblocking persistence.

### Reproduction

1. Validate and restore a structurally valid backup.
2. Make the storage write fail (quota exceeded or blocked storage).

Result: the app reports an invalid backup rather than a storage failure.

### Fix

- Use a distinct message for write failures: “Backup is valid, but it could not be saved to this browser's storage.”
- Keep the validated plan and logs visible in memory so the user can retry or create a new backup.
- Keep validation errors separate from write errors.

Regression coverage: `tests/run-tests.mjs` section “Bug #18 — a valid backup that cannot be saved is not called invalid”.

### Acceptance

- [x] Invalid backups and storage-write failures produce different messages.
- [x] A write failure keeps the validated backup visible in memory and does not claim the backup is invalid.
- [x] The user is told the backup itself was valid.

---

## 31. Unbounded set counts can freeze or crash the app

**Priority:** P3
**Status:** Resolved
**Where:** `js/app.js` — `MAX_PLANNED_SETS`, `MAX_PLANNED_REPS`, normalization, `mk`, routine inputs

### Problem

`mk()` computes `c` from `e.smin` and allocates `Array.from({ length: c })`. Routine inputs and imported plans are not capped, so a huge `smin` can allocate millions of set objects, freeze the page, throw, or exhaust memory.

### Reproduction

1. Set a routine exercise's minimum sets to a very large number (or import such a plan).
2. Open Today for that routine day.

Result: the app hangs or crashes while building the draft.

### Fix

- Cap planned set counts to a sane range (for example 1–50) at input, normalization, and `mk()`.
- Apply similar bounds to repetition ranges and imported values.
- Reject or clamp oversized imports with a visible warning.

### Acceptance

- A huge `smin` cannot allocate an unbounded set array.
- Routine inputs and imports enforce the same bounds.
- The app remains responsive for invalid/extreme values.

---

## 32. Recovery copies accumulate and corrupt drafts are silently discarded

**Priority:** P3
**Status:** Resolved
**Where:** `js/app.js` — `recoverCopy`, boot draft handling; `js/store.js` — `keys`, `remove`

### Problem

For invalid JSON or a non-object top-level value, `bootState()` returns `persist: false`, so `gym_data` is never repaired. Every reload calls `recoverCopy()` again and writes a new `gym_data_recovery_<timestamp>` key. With no recovery UI and no pruning, repeated reloads can consume storage.

Separately, a corrupt `gym_draft` is parsed as `null` by `Store.ld()`, treated as “no draft,” and overwritten by a fresh Today draft. There is no warning that the previous draft was unreadable.

### Reproduction

1. Set `gym_data` to invalid JSON.
2. Reload several times without finishing a workout.
3. Inspect `localStorage`.

Result: a new recovery key is created on each load.

For the draft, set `gym_draft` to invalid JSON and reload; the draft disappears and is replaced with no message.

### Fix

- Keep at most one recovery copy per source, or prune/rotate old copies.
- Provide a user-visible recovery path or instructions instead of leaving the key inaccessible.
- Report failed recovery writes accurately (see item **15**).
- Detect and warn about a corrupt draft rather than silently overwriting it; consider a draft recovery copy.

### Acceptance

- Repeated reloads do not create unbounded recovery keys.
- The user can discover and restore a recovery copy.
- A corrupt draft is reported and preserved for recovery where possible.
- Recovery reporting matches actual write success.

---

## 33. Saved theme can flash after first paint

**Priority:** P3
**Status:** Resolved
**Where:** `index.html` — inline `<head>` theme bootstrap; `js/app.js` — `applyTheme`

### Problem

`store.js` and `app.js` are deferred, so the browser can paint the OS-selected theme before `applyTheme()` applies the saved explicit Light/Dark choice. A user who selected Light on a dark OS can see a dark background flash before the app renders.

### Reproduction

1. Choose **Light** while the OS is in dark mode.
2. Reload the app.
3. Watch the initial paint.

Result: a brief dark flash can occur before the light theme is applied.

### Fix

- Apply the saved theme in a tiny inline bootstrap in `<head>` before the stylesheet/body paint.
- Read and validate only the stored theme there, then let `app.js` continue the normal flow.
- Alternatively, set a `data-theme` attribute server-side/inline based on storage before first paint.

### Acceptance

- The saved explicit theme is applied before the first visible paint.
- System mode still follows OS changes.
- Invalid stored theme values still fall back to `system`.

---

## 16. Plain-object maps can collide with prototype keys

**Status:** Resolved

### Original problem

`backfillXids()`, `allEx()`, and the Progression view built lookup maps with `{}`. Exercise names and imported IDs such as `toString`, `constructor`, or `__proto__` resolved inherited properties. This produced wrong muscle fallbacks and labels, and duplicate-label counts missed collisions. A routine exercise named `toString` or `constructor` made `backfillXids()` treat an inherited function as a set and call `.add(...)` on it, which threw during boot and restore.

### Fix

- `backfillXids()` uses a null-prototype `byName` map.
- `allEx()` uses a null-prototype muscle map.
- `prog_v()` uses null-prototype `planName` and `labelCount` maps.
- Exercise names and IDs that match built-in object properties now behave like any other string.

Regression coverage: `tests/run-tests.mjs` section “Bugs.md 16 — prototype-named exercises behave like plain names”.

### Acceptance

- [x] Exercise names that match prototype property names behave like normal strings.
- [x] Progress labels and muscle fallbacks remain correct.
- [x] Boot and restore do not throw for such names.
- [x] A regression test covers `toString`, `constructor`, `__proto__`, and `hasOwnProperty`.

---

## 15. Boot-time and theme saves fail silently

**Status:** Resolved

### Original problem

The initial normalized-data save and theme save returned a boolean, but the result was ignored. If storage was blocked or full, the app appeared to work until a later edit failed. The recovery-copy alert also always claimed that a copy had been kept.

### Fix

- `bootState()` now checks the boot save result and calls `Store.notifyStorageFailure()` on failure.
- `applyTheme()` now checks `Store.saveTheme()` and warns on failure.
- `recoverCopy()` reports whether the recovery key was actually written.
- Boot-time normalization and theme save failures share the existing throttled warning.
- Recovery messages distinguish a copy that was kept from one that could not be saved.
- A structural recovery alert now says the readable parts were normalized instead of claiming defaults were loaded.

Regression coverage: `tests/run-tests.mjs` section “Bugs.md 15 — boot, theme, and recovery storage failures are reported”.

### Acceptance

- [x] A blocked initial save produces a warning.
- [x] A failed theme save produces a warning.
- [x] A successful recovery copy is reported accurately.
- [x] A failed recovery copy is reported accurately.
- [x] The warning remains throttled until a later successful write.

---

## 14. “Log / edit a past day” did not choose a past day

**Status:** Resolved

### Original problem

The History button only switched to the Today view. It showed whatever draft was already there, usually today's draft, and there was no way to choose a past date from History.

### Fix

The History view now contains a past-date control:

- A native date input (`#pd`) defaults to yesterday and is capped at yesterday.
- **Log / edit past day** validates that the chosen date is a real date before today.
- An empty past date starts a new draft for that date (`openDate()` → `newDraft()`), so it is not an edit and cannot move another record.
- A past date with a saved workout opens that workout for editing.
- A dirty draft is protected by the existing `mayDiscard()` confirmation.
- Re-selecting the date already open in the draft keeps the draft instead of resetting it.

The date fields in `js/app.js` now use a shared `shiftDate()` helper, and the Today date picker/day-chip behavior is unchanged.

Regression coverage: `tests/run-tests.mjs` section “Bugs.md 14 — History past-day control opens the chosen past date”.

### Acceptance

- [x] The control label matches its behavior.
- [x] The control opens the chosen past date.
- [x] An empty past date creates a new workout rather than moving an existing one.
- [x] A past date with a saved workout opens it for editing.
- [x] Dirty drafts are protected.
- [x] Today, future, and blank dates are rejected without changing the draft.

---

## 13. Native controls stay light in dark mode

**Status:** Resolved

### Original problem

Date pickers, selects, and scrollbars did not follow the dark theme because `color-scheme` was not set.

### Fix

`css/style.css` now declares the native color scheme for each theme mode:

```css
:root {
    color-scheme: light dark
}

:root[data-theme="light"] {
    color-scheme: light
}

:root[data-theme="dark"] {
    color-scheme: dark
}
```

The base declaration follows the OS preference, while the explicit theme selectors override it. No JavaScript change was needed because `applyTheme()` already sets and removes `data-theme`.

Regression coverage: `tests/run-tests.mjs` section “Bugs.md 13 — native controls follow the light/dark/system theme”.

### Acceptance

- [x] Native controls follow the explicit light/dark theme.
- [x] System mode follows the OS preference.
- [x] No visual regression in existing custom controls.
- [x] The light and dark rules explicitly override the system default.

---

## 12. Disabled future-day chips look enabled

**Status:** Resolved

### Original problem

The author styles for `.chip` overrode the browser’s disabled appearance, so future days looked clickable even though they were disabled.

### Fix

`css/style.css` now styles the disabled state:

```css
.chip:disabled {
    opacity: .4;
    cursor: not-allowed
}
```

No JavaScript change was needed because future-day chips already render with the native `disabled` attribute.

Regression coverage: `tests/run-tests.mjs` section “Bugs.md 12 — disabled future-day chips are visually distinct”.

### Acceptance

- [x] Future day chips are visibly disabled.
- [x] Existing enabled and selected chip styles are unchanged.
- [x] Disabled chips use a not-allowed cursor.
- [x] Future-day clicks remain blocked.

---

## 11. Stored values are inserted into HTML without escaping

**Status:** Resolved

### Original problem

Two confirmed injection paths through tampered `localStorage`:

- Draft `s.w` / `s.r` were inserted into `value="..."` directly.
- The stored theme label was inserted into generated HTML without escaping or validating the stored theme.

### Fix

- Draft weights and reps are rendered with `esc()`.
- Stored themes are validated against `light`, `dark`, and `system`; unrecognized values fall back to `system`.
- `applyTheme()` normalizes any unknown value to `system`.
- The theme label is escaped and resolves only to a known label.

Regression coverage: `tests/run-tests.mjs` section “Bugs.md 11 — stored draft and theme values are escaped”.

### Acceptance

- [x] Injected HTML remains literal text.
- [x] Invalid stored themes fall back to `system`.
- [x] Valid theme labels still render normally.
- [x] Routine/log names and muscle groups remain escaped.

---

## 9. Routine names and ranges are not validated

**Status:** Resolved

### Original problem

- `padd` added an exercise with an empty name.
- Range fields could be blank, negative, or inverted.
- A workout could be saved with an empty exercise name.

### Fix

- `normBound()` normalizes present bounds to whole numbers of at least 1; blank, zero, and legacy negative values become empty targets.
- `normalizeRanges()` repairs stored minimum/maximum pairs on boot, restore, and draft load; `fixEditedRange()` makes the field just edited authoritative during routine editing.
- All four routine range inputs have `min="1" step="1"`.
- Finish blocks a blank-named exercise that has completed sets instead of saving an unreadable entry.
- Blank routine day names remain allowed for rest days.

Regression coverage: `tests/run-tests.mjs` section “Bugs.md 9 — routine names and ranges are validated”.

### Acceptance

- [x] Blank routine names cannot produce saved blank exercises.
- [x] Minimums cannot exceed maximums.
- [x] Partial ranges do not render malformed labels.
- [x] Existing valid routines are unchanged.

---

## 10. Restore clears an unsaved draft without warning

**Status:** Resolved

### Original problem

Restore replaced `S`, set `D = null`, and cleared the draft. The paste prompt was explicit, but it did not warn that unsaved workout data was being discarded.

### Fix

The restore handler now checks for unsaved draft data after validating the backup and before replacing state (`js/app.js` restore action):

```js
if (!mayDiscard()) return;
```

Invalid backups are rejected before the prompt, so they never ask about discarding the draft. Cancelling leaves the current plan, logs, draft, and stored values untouched. Confirming proceeds with normalization and replacement, and the draft is cleared only after the new state saves successfully.

Regression coverage: `tests/run-tests.mjs` section “Bugs.md 10 — restore warns before discarding an unsaved draft”.

### Acceptance

- [x] Restore with a clean draft proceeds.
- [x] Restore with a dirty draft asks first.
- [x] Cancelling leaves both the current data and draft unchanged.
- [x] Confirming performs the replacement.
- [x] Invalid backups do not trigger the discard prompt.

---

## 6. Editing a workout across weekdays changes the routine name but not the exercises

**Status:** Resolved

### Original problem

`rec.name` was always taken from the selected date’s routine. Moving a Monday chest workout to Tuesday renamed it “Back + Biceps” while keeping the Monday chest exercises.

### Fix

The workout name is now preserved when editing:

- `js/app.js:243-246` — `draftName()` prefers the linked saved workout’s name while editing.
- `js/app.js:442` — Finish keeps the existing record’s name instead of using the destination weekday’s routine name.

Commits: `3c03201` (fix), `64e3d9f` (tests), `1913d9d` (PRD).

Regression coverage: `tests/run-tests.mjs:284-329`.

### Acceptance

- [x] New workouts use the selected date’s routine name.
- [x] Edited workouts preserve their original name when moved across weekdays.
- [x] The exercise list and name remain semantically consistent.
- [x] A deliberate rename flow, if added later, has an explicit UI.

### Residual edge case

After a workout is moved to another weekday, editing it again looks up target ranges from the destination weekday’s routine (`js/app.js:223-229`). The identity and name survive, but the target range may become blank or show “Extra exercise” because the exercise is not part of that weekday’s routine.

---

## 7. Weekday chips bypass the edit-date conflict check

**Status:** Resolved

### Original problem

While editing, clicking a weekday chip changed `D.date` even when another workout already existed on that date. The date picker blocked the same move immediately, and Finish blocked it later, but the chip left the user in a dead end.

### Fix

- Added a shared `dateTaken(date)` helper in `js/app.js`.
- Used it in the weekday-chip handler, the date input, and Finish.
- The chip now reports the conflict immediately and leaves the draft date and weekday unchanged.
- New drafts can still select an occupied date to open that workout for editing.

Regression coverage: `tests/run-tests.mjs` section “Bugs.md 7 — weekday chips block occupied dates while editing”.

### Acceptance

- [x] Weekday chips behave like the date picker during editing.
- [x] The user is told immediately about a conflict.
- [x] No dead-end state is created.
- [x] New drafts can still open an existing date for editing.

---

## 8. Added exercises displayed a malformed target range

**Status:** Resolved

### Original problem

The Today target label required a sets minimum and always rendered both ranges, so partial routines displayed malformed strings such as `3- sets × - reps`. Exercises with only reps configured were labeled “Extra exercise.”

### Fix

`targetLabel()` and `rangePart()` in `js/app.js` now build the label from each configured bound:

- Full ranges keep the current `3-4 sets × 6-10 reps` form.
- A missing maximum renders as `3+ sets` / `8+ reps`.
- A missing minimum renders as `≤4 sets` / `≤10 reps`.
- No configured targets render as “Extra exercise.”

### Acceptance

- [x] Exercises without any target ranges show “Extra exercise.”
- [x] Partially configured exercises show only the configured range.
- [x] Routine exercises with full ranges keep their previous label.
- [x] Unknown custom exercises added through the add-exercise form show “Extra exercise.”

Regression coverage: `tests/run-tests.mjs` section “Bugs.md 8 — target labels show only configured ranges”.

---

## 17. README has stale claims

**Status:** Resolved

### Original problem

`README.md` claimed that the “full app state” was backed up, that the app worked offline after the first load, that malformed backups were always rejected, and that unreadable stored data always fell back to defaults. It also omitted that malformed log entries can be dropped during normalization and that a structurally invalid plan can become blank or partial.

### Fix

`README.md` was updated to describe current behavior:

- Backups contain the routine and workout history, not the theme or draft.
- The app has no external dependencies, but should be served locally for reliable `localStorage` and clipboard behavior.
- Malformed exercise or set entries may be dropped during restore.
- A structurally invalid plan may be normalized to blank or partial routine days.
- There is no service worker or offline guarantee.
- Empty or future-dated workouts can currently be imported.

Commit: `c159345` (README and PRD wording).

### Acceptance

- [x] README matches the actual backup payload.
- [x] README does not promise offline behavior the app does not guarantee.
- [x] README does not claim malformed backups are rejected while the validator silently drops data.
- [x] README accurately describes the recovery fallback.
- [x] README and the PRD limitations describe the same behavior.

The PRD contradiction between “stable random IDs” and “do not immediately persist defaults” is resolved: the default plan is now persisted on first boot, and PRD §8.5/§10.3 describe that behavior.

---

## 34. Reopening the app restored the previous draft date instead of today

**Status:** Resolved

### Original problem

The app restored any valid `gym_draft` unconditionally. Because a draft is written merely by opening the Today view, reopening on a later day restored the previous date. The weekday chips were anchored to that date, and finishing could save a workout to the old date.

### Fix

- `rollCleanDraftToToday()` runs on boot and after a calendar-day change.
- A draft before today with no unsaved changes is replaced by today's draft.
- A stale draft with unsaved work is preserved and flagged in the Today view with a **Start today** action.
- `lastKnownToday` prevents rollover from undoing a past date the user deliberately selects in the same session.

Regression coverage: `tests/run-tests.mjs` section “Draft rollover — reopening on a later day opens today, not the stale draft”.

---

## 19. First-run plan IDs change on reload, orphaning the saved draft's identities

**Status:** Resolved

### Original problem

On a fresh installation, `def()` generated a default plan with random exercise IDs, but `bootState()` returned `persist: false` when `gym_data` was absent. The Today view then immediately created and saved a draft containing those IDs. Reloading before finishing generated a new default plan with different IDs, so the restored draft's `xid`s no longer matched the plan and Progress split the same exercise into two identities. `backfillXids()` could not repair this because it only fills empty `xid`s.

### Fix

- `bootState()` marks plans generated from defaults and returns `persist: true` for a fresh install, so the default plan is written to `gym_data` on first boot before any draft references its IDs.
- Boot order now saves the normalized plan before loading or writing a draft.
- `remapDraftXids()` runs only when the plan was generated from defaults. It remaps an orphaned draft `xid` to a current-plan exercise when the name and muscle (or name alone) match exactly one exercise, and it repairs `D.base` so a clean draft stays clean. Unmatched or ambiguous identities are left unchanged, and a plan loaded from storage is never remapped.
- The recovery path for invalid JSON still does not overwrite `gym_data`; the draft repair is applied per session.

Regression coverage: `tests/run-tests.mjs` section “Bugs.md 19 — first-run plan identity survives reload”.

---

# Verification Checklist

After applying the fixes, verify:

- [x] `node tests/run-tests.mjs` → `604 passed, 0 failed`.
- [x] No HTML/CSS/JS file was changed unintentionally by documentation edits.
- [x] Restore with a dirty draft prompts.
- [x] Moving an edited workout to another weekday keeps a consistent name and exercise list.
- [x] Weekday chips block occupied dates immediately while editing.
- [x] Extra exercises show “Extra exercise” instead of a malformed target string.
- [x] Blank routine exercises cannot silently enter saved workouts.
- [x] Routine bounds are whole numbers of at least 1, and minimums cannot exceed maximums.
- [x] Injected draft/theme payloads render as text.
- [x] Invalid theme values fall back to `system`.
- [x] Disabled future-day chips are visually distinct.
- [x] Native controls follow dark mode.
- [x] Storage failures are reported on boot and theme changes.
- [x] Prototype-key exercise names boot, restore, backfill, and label correctly.
- [x] README matches the updated PRD.
- [x] First boot followed by reload keeps draft and plan identities aligned.
- [x] The History past-day control opens the chosen past date without moving an existing workout.
- [x] After today is saved, a separate past-day workout can be created from the edit-mode date controls without moving today's record.
- [x] Corrupt/empty `gym_data` does not silently erase the default routine.
- [x] Malformed imported exercises/sets are rejected on restore and reported on boot.
- [x] Future-dated workouts cannot enter through restore or boot.
- [x] Adding the same exercise twice does not double volume or create duplicate Progress entries.
- [x] Duplicate imported dates are rejected on restore; boot keeps the first and reports the rest.
- [x] Deleting a dirty workout that is open in the draft warns before discarding edits.
- [x] Blank routine names never blank out recorded Progress labels; duplicate suffixes keep muscle context.
- [x] Ambiguous legacy names are not arbitrarily assigned an identity.
- [x] A valid backup that fails to write reports a storage failure, not an invalid backup.
- [x] Huge set counts are capped.
- [x] Repeated reloads do not accumulate recovery copies, and corrupt drafts are reported.
- [x] The saved theme is applied before the first visible paint.
- [x] A completed set with a negative weight is rejected at Finish, while `0` and decimal weights still save.

---

---

# Related Known Limitations Not Scheduled as Immediate Fixes

These are documented in `docs/PRD.md` but are larger or lower-priority changes:

- Multiple tabs are not coordinated; the last tab to write wins.
- A failed draft clear after a successful save can leave a stale draft that reappears after reload.
- There is no schema version or migration framework.
- There is no service worker or installable offline package.
- There is no in-app path to browse or restore recovery copies.
- The selected Progression exercise is not persisted across reloads.
- The chart has no axes, tooltips, or date labels.
- Routine exercises cannot be reordered.
- There is no undo for deleted workouts, removed exercises, or removed sets.
- Accessibility is basic: placeholder-only labels, small icon targets, no custom focus styles, and no ARIA live region.
- There is no multi-device synchronization or automatic backup.
