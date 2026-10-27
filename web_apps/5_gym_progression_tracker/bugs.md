# Gym Progression Tracker — Bugs and Immediate Fixes

**Date:** 2026-10-27
**Baseline:** `docs/PRD.md` updated to match the current implementation
**Test status:** `node tests/run-tests.mjs` → **182 passed, 0 failed**
**Scope of this document:** code quality, correctness, data integrity, UX, security, documentation, and test gaps

> The existing regression suite passes, so these are uncovered issues rather than failing tests.
> The PRD now documents many of them under Known Limitations, but the code still needs the fixes.
> Line numbers refer to the current implementation and may shift after edits.

---

## Summary

| # | Priority | Area | Issue |
|---|----------|------|-------|
| 2 | P1 | Exercise identity | “Add exercise” loses identity, prefills from the wrong date, and can duplicate Progress entries |
| 3 | P1 | Data validation | Negative weights are accepted and saved |
| 4 | P1 | Import integrity | Duplicate workout IDs are accepted |
| 5 | P1 | Import integrity | Imported `di` can disagree with the workout date |
| 6 | P1 | Editing | Moving an edited workout across weekdays changes its name but not its exercises |
| 7 | P2 | Editing | Weekday chips bypass the edit-date conflict check |
| 8 | P2 | UI | Added exercises display a malformed target range |
| 9 | P2 | Routine validation | Blank names and invalid set/rep ranges are allowed |
| 10 | P2 | Draft safety | Restore clears an unsaved draft without warning |
| 11 | P2 | Security | Draft values and the theme label are inserted into HTML unescaped |
| 12 | P3 | CSS | Disabled future-day chips look enabled |
| 13 | P3 | CSS | Native controls remain light in dark mode |
| 14 | P3 | UX | “Log / edit a past day” does not actually choose a past day |
| 15 | P3 | Storage | Boot-time and theme saves fail silently |
| 16 | P3 | Hardening | Plain-object maps can collide with prototype keys |
| 17 | Docs | Documentation | README contains stale backup and offline claims |
| 18 | Tests | Test coverage | Missing regressions for the issues above |
| 19 | P1 | Exercise identity | First-run plan IDs regenerate on reload, orphaning draft IDs |
| 20 | P1 | Editing/UX | Choosing a past day after saving today moves today's workout |
| 21 | P2 | Recovery | Structurally invalid data becomes a blank/partial plan, not defaults |
| 22 | P2 | Import integrity | Validator silently drops malformed log exercises/sets; accepts empty workouts |
| 23 | P2 | Import integrity | Future-dated workouts are accepted on restore and boot |
| 24 | P2 | Workout editing | Duplicate exercise can be added to one workout |
| 26 | P2 | Editing | Duplicate imported dates make both workouts uneditable |
| 27 | P3 | Draft safety | Deleting the currently edited workout discards a dirty draft |
| 28 | P3 | Progression UX | Empty routine names and suffix logic break Progress labels |
| 29 | P3 | Exercise identity | Ambiguous legacy names get an arbitrary identity on edit |
| 30 | P3 | UX | Restore write failure is reported as “Invalid backup” |
| 31 | P3 | Hardening | Unbounded set counts can freeze or crash the app |
| 32 | P3 | Storage | Recovery copies accumulate; corrupt drafts are silently discarded |
| 33 | P3 | Theme UX | Saved theme can flash after first paint |

> Items **19–33** were added in a follow-up review after the original 18. They are numbered separately so the existing references remain stable.

### Recommended patch order

1. Items **2–3** — data loss, incorrect saved data, and wrong prefill.
2. Items **4–6** — import integrity and edit semantics.
3. Items **7–11** — dead ends, invalid data, and escaping.
4. Items **12–16** — quick UI/reliability improvements.
5. Items **17–18** — documentation and regression coverage.
6. Follow-up items **19–20, 21–24, 26–33** — treat 19–20 as P1 and schedule them with the first data-integrity pass, then work down the remaining follow-up priorities.

---

# Priority 1 — Data loss or incorrect saved data

## 2. “Add exercise” has three related identity and prefill bugs

**Priority:** P1
**Where:** `js/app.js:323-326`, `js/app.js:158-162` (`mk`), `js/app.js:147-157` (`lastSets`)

### Problems

1. **No stable identity.** `addx` calls `mk()` without an `id`, so the exercise gets `xid: ''`. Progression groups it by name. If the name matches a routine exercise, Progress can show two entries until a reload runs `backfillXids()`.
2. **No prefill for known routine exercises.** If the custom name matches a routine exercise with a stable `id`, `canNameMatch()` returns false, so previous performance is not shown.
3. **Prefill ignores the selected date.** `mk()` is called without `D.date`, so `lastSets()` searches every log, including workouts later than the date being edited.

### Reproduction

**Duplicate Progress entry**

1. Have a saved “Bench Press” workout.
2. Add “Bench Press” as an extra exercise in another workout.
3. Complete and save it.
4. Open Progress.

Result: two entries such as “Bench Press · Chest” and “Bench Press (2)” until reload.

**Prefill from a later date**

1. Have “Cable Fly” logs on 2026-10-05 (`10kg`) and 2026-10-12 (`25kg`).
2. Select 2026-09-28.
3. Add “Cable Fly” as an extra exercise.

Result: the draft is prefilled with `25kg` from a future-relative workout.

### Fix

Add a helper that resolves a unique routine exercise by name:

```js
function findUniquePlanExercise(name) {
    const matches = [];
    Object.values(S.plan).forEach(p => p.ex.forEach(e => {
        if (e.n === name) matches.push(e);
    }));
    const ids = new Set(matches.map(e => e.id));
    return ids.size === 1 ? matches[0] : null;
}
```

Update `addx` to reuse the identity, muscle, and ranges, and pass the draft date:

```js
const n = $('#nx').value.trim();
if (!n) return;

const known = findUniquePlanExercise(n);
const m = $('#nm').value.trim() || known?.m || allEx()[n] || 'Other';

D.ex.push(mk({
    id: known?.id,
    n,
    m,
    smin: known?.smin ?? '',
    smax: known?.smax ?? '',
    rmin: known?.rmin ?? '',
    rmax: known?.rmax ?? ''
}, D.date));
```

### Acceptance

- Adding an exercise that uniquely matches a routine exercise reuses its `xid`.
- Previous performance is displayed and prefilled.
- Prefill never comes from a workout on or after the selected date.
- Saving does not create a temporary duplicate Progress entry.
- Ambiguous names remain name-based and do not guess an identity.

---

## 3. Negative weights are accepted and saved

**Priority:** P1
**Where:** `js/app.js:204`, `js/app.js:328`

### Problem

The save mapping uses `w: +s.w || 0`, which preserves negative values. Entering `-50` for weight and finishing saves `-50`.

### Reproduction

1. Enter `-50` in a weight field.
2. Enter reps and tick the set.
3. Finish the workout.

Result: the saved set has `w: -50`.

### Fix

Add input constraints in the Today view template:

```html
<input type="number" inputmode="decimal" min="0" step="any" ...>
```

Add reps constraints:

```html
<input type="number" inputmode="numeric" min="1" step="1" ...>
```

Clamp weight when saving:

```js
w: Math.max(0, +s.w || 0)
```

A weight of `0` remains valid for bodyweight exercises.

### Acceptance

- Negative weights cannot be saved.
- Decimal weights such as `62.5` behave consistently.
- Zero weight remains valid.
- Reps must be at least one to count as completed.

---

## 4. Duplicate workout IDs are accepted

**Priority:** P1
**Where:** `js/app.js:63-69` (`normalizeData` / `normLog`)

### Problem

`safeId()` validates the ID format but not uniqueness. If a backup contains two logs with `id: "dup"`:

- **Edit** always opens the first matching log.
- **Delete** removes every log with that ID.

### Reproduction

1. Restore a backup containing two logs with the same `id`.
2. Edit one of them.

Result: the first matching workout opens, regardless of which Edit button was clicked.

### Fix

Deduplicate during normalization:

```js
function normalizeData(o) {
    const logs = (o && Array.isArray(o.logs) ? o.logs : [])
        .map(normLog)
        .filter(Boolean);

    const seen = new Set();
    logs.forEach(l => {
        while (seen.has(l.id)) l.id = uid();
        seen.add(l.id);
    });

    return {
        plan: normPlan(o && o.plan),
        logs: logs.sort(byDate)
    };
}
```

Apply the same uniqueness check to routine exercise IDs if imported plans can contain duplicates.

### Acceptance

- Duplicate log IDs are regenerated on load or restore.
- Edit opens the intended workout.
- Delete removes only the selected workout.
- Duplicate plan IDs do not merge unrelated progression histories.

---

## 5. Imported `di` can disagree with the workout date

**Priority:** P1
**Where:** `js/app.js:65`

### Problem

`normLog()` preserves any valid integer `di` from `0–6`, even if it does not match `l.date`. The `day` and `year` fields are always derived, so the record becomes internally inconsistent.

### Reproduction

Restore a backup with:

```json
{
  "date": "2026-10-05",
  "di": 3
}
```

2026-10-05 is a Monday, but the saved `di` becomes `3` (Thursday).

### Fix

Always derive the weekday index:

```js
di: wk(l.date)
```

### Acceptance

- `di` always matches the weekday of the date.
- `day` and `year` also remain derived.
- Backups with inconsistent `di` values are normalized on load and restore.

---

## 6. Editing a workout across weekdays changes the routine name but not the exercises

**Priority:** P1
**Where:** `js/app.js:334`

### Problem

`rec.name` is always taken from the selected date’s routine. If a Monday chest workout is moved to Tuesday, it becomes “Back + Biceps” while still containing bench press.

### Reproduction

1. Save a Monday workout containing Bench Press.
2. Edit it.
3. Change the date to Tuesday.
4. Save.

Result: the record is dated Tuesday and named “Back + Biceps,” but the exercises are still the Monday chest exercises.

### Fix

Preserve the original workout name when editing:

```js
const existing = D.editId
    ? S.logs.find(l => l.id === D.editId)
    : null;

const rec = {
    id: D.editId || uid(),
    date,
    day: FULL[di],
    year: +date.slice(0, 4),
    di,
    name: existing ? existing.name : ((S.plan[di] || {}).name || ''),
    ex
};
```

Alternatively, store `D.name` in `fromLog()` and `newDraft()` and use that value on save.

### Acceptance

- New workouts use the selected date’s routine name.
- Edited workouts preserve their original name when moved across weekdays.
- The exercise list and name remain semantically consistent.
- A deliberate rename flow, if added later, has an explicit UI.

---

# Priority 2 — Dead ends, invalid data, and security

## 7. Weekday chips bypass the edit-date conflict check

**Priority:** P2
**Where:** `js/app.js:311-317`, compared with `js/app.js:387-390` and `js/app.js:332`

### Problem

While editing, clicking a weekday chip changes `D.date` even if another workout already exists on that date. The date picker blocks this immediately, and Finish blocks it later, but the chip leaves the user in a dead end.

### Reproduction

1. Have workouts on Monday and Tuesday.
2. Edit the Monday workout.
3. Click the Tuesday weekday chip.

Result: the draft date changes to Tuesday. The conflict is only reported when Finish is pressed.

### Fix

Extract the existing conflict check into a helper:

```js
function dateTaken(date) {
    return S.logs.some(
        l => l.id !== (D.editId || '_new_') && l.date === date
    );
}
```

Use it in the weekday-chip handler when `D.editId` is set:

```js
if (D.editId) {
    if (dateTaken(nv)) {
        alert('Another workout already exists on ' + nv + '. Choose another date or cancel the edit.');
        return;
    }
    D.date = nv;
    D.di = wk(nv);
    // save draft
}
```

Use the same helper in the date input and Finish paths to avoid duplicated logic.

### Acceptance

- Weekday chips behave like the date picker during editing.
- The user is told immediately about a conflict.
- No dead-end state is created.
- New drafts can still open an existing date for editing.

---

## 8. Added exercises display a malformed target range

**Priority:** P2
**Where:** `js/app.js:199`, with `addx` at `js/app.js:325`

### Problem

`addx` creates `smin: 3, rmin: '', rmax: ''`, and the label condition only checks `e.smin`. The UI displays:

> `3-3 sets × - reps`

### Reproduction

1. Add a custom exercise.
2. Look at its target line.

### Fix

Build the label from only the ranges that exist:

```js
const parts = [];
if (e.smin) parts.push(`${e.smin}-${e.smax} sets`);
if (e.rmin) parts.push(`${e.rmin}-${e.rmax} reps`);
const target = parts.length ? parts.join(' × ') : 'Extra exercise';
```

Combined with item 2, pass empty ranges for unknown custom exercises so they show “Extra exercise.”

### Acceptance

- Custom exercises without rep targets show “Extra exercise.”
- Partially configured exercises show only the configured range.
- Routine exercises with full ranges keep their current label.

---

## 9. Routine names and ranges are not validated

**Priority:** P2
**Where:** `js/app.js:354` (`padd`), `js/app.js:289-291` (routine inputs)

### Problem

- `padd` adds an exercise with an empty name.
- Range fields can be blank, negative, or inverted.
- Partial values produce labels such as `3- sets × 6-10 reps`.
- A workout can be saved with an empty exercise name.

### Fix

Add `min="1"` to all four range inputs and normalize values before use or save:

- Require a non-empty exercise name before Finish.
- Ensure `smax >= smin` and `rmax >= rmin`.
- Default missing values to sensible numbers, or ignore incomplete rows.
- Skip exercises with blank names during workout saving.

Example normalization helper:

```js
function normalizeRange(min, max, fallbackMin, fallbackMax) {
    const a = Math.max(1, Math.floor(+min || fallbackMin));
    const b = Math.max(a, Math.floor(+max || fallbackMax));
    return [a, b];
}
```

Call it when routine fields change or before constructing a draft.

### Acceptance

- Blank routine names cannot produce saved blank exercises.
- Minimums cannot exceed maximums.
- Partial ranges do not render malformed labels.
- Existing valid routines are unchanged.

---

## 10. Restore clears an unsaved draft without warning

**Priority:** P2
**Where:** `js/app.js:365`

### Problem

Restore replaces `S`, sets `D = null`, and clears the draft. The paste prompt is explicit, but it does not warn that unsaved workout data is being discarded.

### Reproduction

1. Enter a partial workout.
2. Go to Routine.
3. Restore a backup.
4. Observe that the partial workout is gone.

### Fix

After validation and before replacing state:

```js
if (!mayDiscard()) return;
```

Then proceed with normalization and replacement.

### Acceptance

- Restore with a clean draft proceeds.
- Restore with a dirty draft asks first.
- Cancelling leaves both the current data and draft unchanged.
- Confirming performs the replacement.

---

## 11. Stored values are inserted into HTML without escaping

**Priority:** P2 (self-XSS hardening)
**Where:** `js/app.js:204-205`, `js/app.js:297`

### Problem

Two confirmed injection paths through tampered `localStorage`:

- Draft `s.w` / `s.r` are inserted into `value="..."` directly.
- The theme label is inserted directly into generated HTML.

Example payload for a draft weight:

```text
"><img src=x onerror=alert(1)>
```

The generated input breaks out of the attribute and creates an image element.

Example payload for a theme value:

```text
"><img src=x onerror=alert(2)>
```

### Fix

Escape both draft values:

```html
value="${esc(s.w)}"
value="${esc(s.r)}"
```

Escape the theme label and validate the stored theme:

```js
const stored = Store.loadTheme();
let theme = THEMES.includes(stored) ? stored : 'system';
```

```js
Theme: ${esc(themeLabel(theme))}
```

Make `applyTheme()` fall back to `system` for unrecognized values.

### Acceptance

- Injected HTML remains literal text.
- Invalid stored themes fall back to `system`.
- Valid theme labels still render normally.
- Routine/log names and muscle groups remain escaped.

---

# Priority 3 — Quick UI and reliability fixes

## 12. Disabled future-day chips look enabled

**Priority:** P3
**Where:** `css/style.css:104-117`

### Problem

The author styles for `.chip` override the browser’s disabled appearance, so future days look clickable even though they are disabled.

### Fix

```css
.chip:disabled {
    opacity: .4;
    cursor: not-allowed;
}
```

### Acceptance

- Future day chips are visibly disabled.
- Existing enabled and selected chip styles are unchanged.

---

## 13. Native controls stay light in dark mode

**Priority:** P3
**Where:** `css/style.css:1-30`

### Problem

Date pickers, selects, and scrollbars do not follow the dark theme because `color-scheme` is not set.

### Fix

```css
:root {
    color-scheme: light dark;
}

:root[data-theme="light"] {
    color-scheme: light;
}

:root[data-theme="dark"] {
    color-scheme: dark;
}
```

### Acceptance

- Native controls follow the explicit light/dark theme.
- System mode follows the OS preference.
- No visual regression in existing custom controls.

---

## 14. “Log / edit a past day” does not actually choose a past day

**Priority:** P3
**Where:** `js/app.js:222`, `js/app.js:343`

### Problem

The History button only switches to the Today view. It shows whatever draft is already there, which is usually today’s draft.

### Fix

Immediate low-risk option: relabel it to **“Go to Today”**.

If a real past-day flow is desired:

```js
else if (a === 'past') {
    if (!mayDiscard()) { render(); return; }
    // Prompt for or choose a past date, then openDate(date)
    tab = 'today';
}
```

### Acceptance

- The button label matches its behavior.
- Or: the button actually opens a past-date entry flow.
- Dirty drafts are protected.

---

## 15. Boot-time and theme saves fail silently

**Priority:** P3
**Where:** `js/app.js:124`, `js/app.js:138`

### Problem

The initial normalized-data save and theme save return a boolean, but the result is ignored. If storage is blocked or full, the app appears to work until a later edit fails.

### Fix

Check the return values:

```js
if (boot.persist && !save()) Store.notifyStorageFailure();
```

```js
if (!Store.saveTheme(t)) Store.notifyStorageFailure();
```

Also make `recoverCopy()` report whether the recovery write actually succeeded instead of always saying a copy was kept.

### Acceptance

- A blocked initial save produces a warning.
- A failed theme save produces a warning.
- A successful recovery copy is reported accurately.
- A failed recovery copy is reported accurately.
- The warning remains throttled.

> **Follow-up note:** checking the boot save result does not address the first-run case where `boot.persist` is `false` and the default plan is never saved. See item **19**.

---

## 16. Plain-object maps can collide with prototype keys

**Priority:** P3
**Where:** `js/app.js:75`, `js/app.js:176`, `js/app.js:241`, `js/app.js:251`

### Problem

`byName`, `allEx()`, `planName`, and `labelCount` use `{}`. Exercise names such as `constructor`, `toString`, or `__proto__` can resolve inherited properties, producing wrong muscle fallbacks, labels, or duplicate-label counts.

This is also a crash, not only a display bug: a routine exercise named `toString` or `constructor` makes `backfillXids()` evaluate `byName[e.n]` as an inherited function and then call `.add(...)` on it. That throws during boot or restore.

### Fix

Use null-prototype objects:

```js
const byName = Object.create(null);
const m = Object.create(null);
const planName = Object.create(null);
const labelCount = Object.create(null);
```

Or use `Map` consistently.

### Acceptance

- Exercise names that match prototype property names behave like normal strings.
- Progress labels and muscle fallbacks remain correct.
- Boot and restore do not throw for such names.
- A regression test covers `toString`, `constructor`, and `__proto__`.

---

# Documentation

## 17. README has stale claims

**Priority:** Documentation
**Where:** `README.md:16`, `README.md:65`, `README.md:75`, `README.md:139`

### Problems

- `README.md:65` says the “full app state” is serialized. The backup contains only `plan` and `logs`; theme and draft are excluded.
- `README.md:16` says the app works offline after the first load. There is no service worker, so offline behavior in a served environment is not guaranteed.
- `README.md:75` says a malformed or incompatible backup is rejected and current data is left untouched. The validator currently accepts malformed log exercises/sets and then silently drops them (item **22**), so a “successful” restore can lose data.
- `README.md:139` says unreadable stored data falls back to defaults. For structurally invalid data, boot currently normalizes to a blank or partial plan instead of loading `def()` (item **21**), and then persists it.

### Fix

- Change “full app state” to “routine and workout history.”
- Clarify that the app has no external dependencies but should be served locally for reliable `localStorage` and clipboard behavior.
- Keep the existing note that data is browser-local and can be lost if storage is cleared.
- Rewrite the backup-validation and recovery claims to match the actual fallback and drop behavior, or fix the code so the claims are true.
- Note the PRD contradiction between “stable random IDs” (`docs/PRD.md:693`) and “do not immediately persist defaults” (`docs/PRD.md:878`); see item **19**.

### Acceptance

- README matches the actual backup payload.
- README does not promise offline behavior the app does not guarantee.
- README does not claim malformed backups are rejected while the validator silently drops data.
- README accurately describes the recovery fallback.
- The PRD and README do not contradict each other.

---

# Test Coverage

## 18. Add regression tests for the fixes above

**Priority:** Tests
**Where:** `tests/run-tests.mjs`

### Missing coverage

Add tests for:

1. Restore with a dirty draft prompts and preserves the draft on cancel.
2. Custom exercise identity:
   - Known routine exercise reuses `xid`.
   - Prefill is bounded by the selected date.
   - Saving does not create a duplicate Progress entry.
3. Negative weights are clamped.
4. Duplicate log IDs are regenerated.
5. Inconsistent `di` values are derived from the date.
6. Editing a workout across weekdays preserves the original routine name.
7. Weekday-chip date conflict while editing is blocked immediately.
8. Draft and theme injection payloads remain escaped.
9. Invalid theme values fall back to `system`.
10. Routine validation rejects blank names and inverted ranges.
11. Disabled future-day chips are rendered as disabled.
12. First boot followed by a reload with only `gym_draft` preserves plan/log identities and does not split Progress.
13. Structurally invalid boot data yields the documented fallback (defaults) and does not silently persist a blank plan.
14. Backup validation rejects or reports malformed log exercises and set entries instead of silently dropping them.
15. Restore and boot reject future-dated workouts.
16. Adding the same exercise twice in one workout does not create duplicate cards, doubled volume, or duplicate Progress entries.
17. Imported duplicate dates do not make both records uneditable.
18. Deleting the currently edited workout with dirty changes warns before discarding the draft.
19. Blank routine names do not blank out a recorded Progress label, and duplicate-label suffixes preserve muscle information.
20. Editing a legacy ambiguous-name exercise does not arbitrarily assign one routine identity.
21. A valid backup whose write fails reports a storage failure, not an invalid backup.
22. A huge imported/routine `smin` is rejected or capped rather than allocating an unbounded set array.
23. Invalid stored JSON does not create a new recovery copy on every reload, and a corrupt draft is reported instead of silently overwritten.
24. Boot and restore do not crash for prototype-key names (`toString`, `constructor`, `__proto__`).

### Acceptance

- Each new test fails before the corresponding fix and passes after it.
- The full suite remains green.
- Test names describe the behavior, not the implementation detail.

---

# Follow-up Review — Additional Bugs (19–33)

These findings were added after the original 18. They were reproduced by driving the app's own handlers with fixed dates, so the test suite's existing green status does not cover them.

---

## 19. First-run plan IDs change on reload, orphaning the saved draft's identities

**Priority:** P1
**Where:** `js/app.js:32-39` (`def`), `js/app.js:109-124` (`bootState`/boot), `js/app.js:163` (`newDraft`), `js/app.js:192` (automatic today draft)

### Problem

On a fresh installation, `def()` generates a default plan with random exercise IDs, but `bootState()` returns `persist: false` when `gym_data` is absent. The Today view then immediately creates and saves a draft containing those IDs.

If the user reloads before finishing the workout or editing the Routine, `gym_data` still does not exist, so boot generates a **new default plan with different IDs**. The restored draft still contains the old IDs. Finishing it saves a log whose `xid`s no longer match the current plan. Future workouts use the new IDs, so Progress splits the same exercise into two identities.

### Reproduction

1. Start with no `gym_data` in a fresh browser profile.
2. Open the app; the Today draft is auto-created and saved.
3. Reload before finishing or changing the routine.
4. Complete and save the restored draft.
5. Log the same exercise again on a later date.
6. Open Progress.

Result: the saved log `xid` differs from the current plan exercise ID, and Progress shows entries such as `Lat Pulldown · Back` and `Lat Pulldown (2)`.

`backfillXids()` does not repair this because it only fills empty `xid`s; it does not remap non-empty IDs that vanished from the plan.

### Fix

- Persist the default plan on first boot, or persist `S` before saving a draft that references its IDs.
- Alternatively, reconcile draft/log `xid`s against the current plan when IDs change, and update `D.base` along with the draft.
- Ensure the fix preserves stable identities across reloads and does not remap intentionally deleted/re-added exercises by name.

### Acceptance

- A first boot followed by a reload keeps plan and draft identities aligned.
- Finishing a restored first-run draft produces a log whose `xid` exists in the current plan.
- The same exercise does not split into two Progress entries.
- The PRD's “stable random IDs” claim and the “do not immediately persist defaults” boot step are reconciled.

---

## 20. After today is saved, choosing a past day moves today's workout; there is no new-past-workout path

**Priority:** P1
**Where:** `js/app.js:192` (`openDate(today())`), `js/app.js:175` (`openDate`), `js/app.js:382-392` (date input), `js/app.js:311-317` (weekday chips), `js/app.js:332-338` (record ID/date update), `js/app.js:343` (`past`)

### Problem

Once today has a saved workout, opening Today auto-loads that workout as an edit draft (`D.editId` is set). The History button “Log / edit a past day” only switches to Today. If the user then picks an empty past date, the app is still in edit mode, so it changes the existing workout's date instead of creating a new one. Finish updates/moves the original record.

### Reproduction

1. Save today's workout.
2. Click **History → + Log / edit a past day**.
3. Choose an empty past date, such as last Monday.
4. Enter data and press **Update**.

Result: today's workout is moved to Monday. No new Monday workout is created, and no warning is shown. I verified the saved record keeps its original ID but changes date.

This is related to item **14**, but it is more severe than a mislabeled button: while today's workout exists, the UI has no reachable state for starting a new workout on a past date. Relabeling the button to “Go to Today” would leave that workflow broken, and the date picker/chips still move the existing workout.

### Fix

- Add an explicit **Start new workout / Log past day** flow that clears `editId` and calls `newDraft()`/`openDate()` after `mayDiscard()`.
- In edit mode, distinguish “move this workout” from “start/open another workout”; make date changes explicit.
- Add a Cancel Edit action so an edit can be abandoned without moving or deleting the record.
- Update the #14 fix so it creates a new draft rather than only switching tabs.

### Acceptance

- After saving today's workout, the user can create a separate workout on a past date.
- Choosing a past date during an edit does not silently move today's record.
- The user is warned before any destructive date move.
- There is a clear cancel path for an edit.

---

## 21. Structurally invalid stored data becomes a blank or partial plan instead of defaults

**Priority:** P2
**Where:** `js/app.js:105-116` (`recoverCopy`/`bootState`), `js/app.js:67-69` (`normalizeData`), `js/app.js:124` (boot save); `README.md:139`

### Problem

Invalid JSON loads `def()` as the alert claims. A parsed but structurally invalid object follows a different path:

```js
recoverCopy(rawStr, 'missing or malformed fields');
return { S: normalizeData(raw), persist: true };
```

`normalizeData({})` produces seven blank routine days with no exercises, and `persist: true` immediately saves that blank plan. The alert still says “default data has been loaded.”

Also, a payload such as `{ plan: "bad", logs: [validLog] }` keeps the logs but replaces the entire routine with blank days.

### Reproduction

1. Seed `gym_data` with `{}` or with a missing/invalid `plan`.
2. Open the app.
3. Observe the recovery alert saying defaults were loaded.
4. Check the Routine tab and Today draft.

Result: `plan[0]` is `{ "name": "", "ex": [] }`, the draft has zero exercises, and `gym_data` is rewritten with the blank plan.

### Fix

- On structural validation failure, load `def()` for invalid/missing plan sections, or otherwise fill missing routines with defaults.
- Do not persist a partial blank state without telling the user exactly what was lost.
- Make the recovery alert and `README.md:139` match the actual fallback.
- Consider preserving structurally valid logs while restoring a default plan, and expose a recovery-copy restore path.

### Acceptance

- A corrupt/empty `gym_data` does not silently erase the default routine.
- The alert accurately states whether defaults or normalized partial data were loaded.
- Boot does not persist a blank plan after a structural validation failure.
- A regression test starts from `gym_data = "{}"` and asserts the default exercises exist.

---

## 22. Backup/boot validation silently drops malformed log exercises and sets; empty workouts are accepted

**Priority:** P2
**Where:** `js/app.js:81-101` (`validateBackup`), `js/app.js:58-62` (`normLogEx`), `js/app.js:63-66` (`normLog`), `js/app.js:124` (boot save), `js/app.js:356-365` (restore)

### Problem

`validateBackup` checks that a log exercise is an object and that `sets` is an array, but it does not check:

- that the exercise has a non-empty string name;
- that each set entry is an object;
- that a set contains usable repetitions;
- that the workout contains at least one exercise.

The normalizer then discards malformed pieces silently.

### Reproduction

- Restoring `{plan:{},logs:[{date:"2026-10-13",ex:[{sets:[{w:10,r:5}]}]}]}` shows **“Backup restored.”** but saves a workout with `ex: []`.
- Booting with `{n:"Squat",m:"Legs",sets:[{w:60,r:8},null,{w:70}]}` produces no warning and saves only the first set.
- Restoring a log with `ex: []` is accepted, even though the UI's Finish action prevents creating empty workouts.

### Fix

- Require each log exercise to have a non-empty string name and at least one structurally valid set.
- Require each set entry to be an object with finite numeric weight/reps values (or explicitly documented repair rules).
- Reject empty workouts on import and boot, or report how many records were dropped.
- Add a boot-time warning when normalization drops log data, and use the same behavior for restore.

### Acceptance

- A backup containing a nameless exercise is rejected with a specific error, or its dropped records are reported.
- Null/partial set entries are not silently discarded without feedback.
- Empty workouts are not importable.
- Boot and restore use the same validation/reporting rules.

---

## 23. Future-dated workouts are accepted on restore and boot

**Priority:** P2
**Where:** `js/app.js:93` (`validateBackup` only checks `isDate`), `js/app.js:63-66` (`normLog`), `js/app.js:331` (Finish rejects future dates)

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
**Where:** `js/app.js:323-326` (`addx`), `js/app.js:214-216` (Add exercise fields)

### Problem

`addx` does not check whether the draft already contains the exercise. Adding “Bench Press” to a workout that already has Bench Press creates a second card. On save, History shows both entries and training volume counts both.

Until reload, the added entry also has `xid: ""`, which can produce a separate Progress group (related to item **2**). After item **2**'s identity fix, the identities may merge, but the duplicate rows and doubled volume remain.

The name/muscle inputs are not cleared after adding, and any re-render (Skip, +Set, tab switch) wipes text that has not been added yet, making accidental duplicates easy.

### Reproduction

1. Open a routine day containing “Bench Press”.
2. Add “Bench Press” again via the add-exercise form.
3. Complete a set in both cards and finish.
4. Check History and Progress.

Result: two Bench Press entries in History and doubled volume; Progress may show duplicates before reload.

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
**Where:** `js/app.js:332` (Finish conflict check), `js/app.js:175` (`openDate` picks the first), `js/app.js:342` (Edit by ID)

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
**Where:** `js/app.js:344-350` (`dl`)

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
**Where:** `js/app.js:250` (`planName[g.xid] != null`), `js/app.js:255-258` (duplicate labels)

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
**Where:** `js/app.js:168` (`fromLog` name fallback)

### Problem

`fromLog` falls back to `pl.find(x => x.n === e.n)` and then sets `xid` to the first match when the log has no identity. If several routine exercises share that name, the edit arbitrarily binds the legacy log to one of them — even though `backfillXids()` deliberately refuses ambiguous names.

### Reproduction

1. Have two routine exercises named “Bench Press” with different IDs.
2. Have a legacy log exercise named “Bench Press” with no `xid`.
3. Edit that log and save.

Result: the draft receives the first matching identity and the workout is assigned to it arbitrarily.

### Fix

- Use a unique-name lookup (the helper proposed in item **2**).
- Assign an identity only when exactly one routine exercise matches the normalized name.
- Otherwise leave `xid` blank so the exercise remains name-based.

### Acceptance

- Ambiguous legacy names are not auto-assigned.
- A unique name match still upgrades the legacy log correctly.
- Progress does not merge unrelated histories through an arbitrary edit.

---

## 30. A valid restore whose write fails is reported as “Invalid backup”

**Priority:** P3
**Where:** `js/app.js:364`

### Problem

After validation succeeds, a failed storage write produces:

> Invalid backup: could not write to storage.

The backup was valid; the storage write failed. This sends the user toward checking the backup instead of freeing storage or unblocking persistence.

### Reproduction

1. Validate and restore a structurally valid backup.
2. Make the storage write fail (quota exceeded or blocked storage).

Result: the app reports an invalid backup rather than a storage failure.

### Fix

- Use a distinct message for write failures, for example “Backup is valid, but it could not be saved to this browser's storage.”
- Reuse the throttled storage-failure notification where appropriate.
- Keep validation errors separate from write errors.

### Acceptance

- Invalid backups and storage-write failures produce different messages.
- A write failure preserves the previous in-memory state.
- The user is told the backup itself was valid.

---

## 31. Unbounded set counts can freeze or crash the app

**Priority:** P3
**Where:** `js/app.js:160` (`mk` / `Array.from`), `js/app.js:290` (routine range inputs), `js/app.js:81-101` (import validation)

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
**Where:** `js/app.js:105-108` (`recoverCopy`), `js/app.js:109-114` (boot), `js/app.js:122`, `js/app.js:192`, `js/store.js:11`, `js/store.js:25`

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
**Where:** `index.html:14-15` (deferred scripts), `js/app.js:138` (`applyTheme`), `css/style.css:14-30`

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

# Verification Checklist

After applying the fixes, verify:

- [ ] `node tests/run-tests.mjs` → `182 passed, 0 failed` plus new tests.
- [ ] No HTML/CSS/JS file was changed unintentionally by documentation edits.
- [ ] Restore with a dirty draft prompts.
- [ ] Adding a known routine exercise prefills correctly and does not duplicate Progress.
- [ ] Adding a custom exercise while logging a past date does not prefill from a later workout.
- [ ] Negative weights are rejected or clamped.
- [ ] Duplicate restored IDs are repaired.
- [ ] `di` matches the date after restore.
- [ ] Moving an edited workout to another weekday keeps a consistent name and exercise list.
- [ ] Weekday chips block occupied dates immediately while editing.
- [ ] Extra exercises show “Extra exercise” instead of `3-3 sets × - reps`.
- [ ] Blank routine exercises cannot silently enter saved workouts.
- [ ] Injected draft/theme payloads render as text.
- [ ] Invalid theme values fall back to `system`.
- [ ] Disabled future-day chips are visually distinct.
- [ ] Native controls follow dark mode.
- [ ] Storage failures are reported on boot and theme changes.
- [ ] README matches the updated PRD.
- [ ] First boot followed by reload keeps draft and plan identities aligned.
- [ ] After today is saved, a separate past-day workout can be created without moving today's record.
- [ ] Corrupt/empty `gym_data` does not silently erase the default routine.
- [ ] Malformed imported exercises/sets are rejected or reported, not silently dropped.
- [ ] Future-dated workouts cannot enter through restore or boot.
- [ ] Adding the same exercise twice does not double volume or create duplicate Progress entries.
- [ ] Duplicate imported dates are rejected or remain editable.
- [ ] Deleting a dirty workout that is open in the draft warns before discarding edits.
- [ ] Blank routine names never blank out recorded Progress labels; duplicate suffixes keep muscle context.
- [ ] Ambiguous legacy names are not arbitrarily assigned an identity.
- [ ] A valid backup that fails to write reports a storage failure, not an invalid backup.
- [ ] Huge set counts are rejected or capped.
- [ ] Repeated reloads do not accumulate recovery copies, and corrupt drafts are reported.
- [ ] The saved theme is applied before the first visible paint.

---

# Related Known Limitations Not Scheduled as Immediate Fixes

These are documented in `docs/PRD.md` but are larger or lower-priority changes:

- Multiple tabs are not coordinated; the last tab to write wins.
- Duplicate workout dates and duplicate routine IDs from imported backups are not fully rejected (see item **26** for the edit-blocking consequence).
- A failed draft clear after a successful save can leave a stale draft that reappears after reload.
- There is no schema version or migration framework.
- There is no service worker or installable offline package.
- Recovery copies are not pruned automatically (see item **32**).
- The selected Progression exercise is not persisted across reloads.
- The chart has no axes, tooltips, or date labels.
- Routine exercises cannot be reordered.
- There is no undo for deleted workouts, removed exercises, or removed sets.
- Accessibility is basic: placeholder-only labels, small icon targets, no custom focus styles, and no ARIA live region.
- There is no multi-device synchronization or automatic backup.
