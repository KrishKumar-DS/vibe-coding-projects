# Gym Progression Tracker — Bugs and Immediate Fixes

**Date:** 2026-10-27
**Baseline:** `docs/PRD.md` updated to match the current implementation
**Test status:** `node tests/run-tests.mjs` → **151 passed, 0 failed**
**Scope of this document:** code quality, correctness, data integrity, UX, security, documentation, and test gaps

> The existing regression suite passes, so these are uncovered issues rather than failing tests.
> The PRD now documents many of them under Known Limitations, but the code still needs the fixes.
> Line numbers refer to the current implementation and may shift after edits.

---

## Summary

| # | Priority | Area | Issue |
|---|----------|------|-------|
| 1 | P1 | Draft safety | History → Edit silently discards an unsaved draft |
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

### Recommended patch order

1. Items **1–3** — data loss, incorrect saved data, and wrong prefill.
2. Items **4–6** — import integrity and edit semantics.
3. Items **7–11** — dead ends, invalid data, and escaping.
4. Items **12–16** — quick UI/reliability improvements.
5. Items **17–18** — documentation and regression coverage.

---

# Priority 1 — Data loss or incorrect saved data

## 1. History → Edit silently discards an unsaved draft

**Priority:** P1
**Where:** `js/app.js:342`

### Problem

The Edit action calls `fromLog(l)`, which immediately replaces the current draft. `mayDiscard()` is only used when changing the date or weekday, so this path loses a dirty draft without asking.

### Reproduction

1. Open the Today view.
2. Enter repetitions for any set.
3. Switch to History.
4. Click **Edit** on an old workout.

Result: the unsaved draft is replaced with the saved workout. No confirmation is shown.

### Fix

Guard the edit action before replacing `D`:

```js
else if (a === 'edit') {
    const l = S.logs.find(x => x.id === b.dataset.id);
    if (l) {
        if (!mayDiscard()) { render(); return; }
        fromLog(l);
        tab = 'today';
    }
}
```

### Acceptance

- Editing while the draft is clean proceeds immediately.
- Editing while the draft is dirty prompts first.
- Cancelling the prompt leaves the draft unchanged.
- Confirming opens the selected workout for editing.

---

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

---

## 16. Plain-object maps can collide with prototype keys

**Priority:** P3
**Where:** `js/app.js:75`, `js/app.js:176`, `js/app.js:241`, `js/app.js:251`

### Problem

`byName`, `allEx()`, `planName`, and `labelCount` use `{}`. Exercise names such as `constructor`, `toString`, or `__proto__` can resolve inherited properties, producing wrong muscle fallbacks, labels, or duplicate-label counts.

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

---

# Documentation

## 17. README has stale claims

**Priority:** Documentation
**Where:** `README.md:16`, `README.md:65`

### Problems

- `README.md:65` says the “full app state” is serialized. The backup contains only `plan` and `logs`; theme and draft are excluded.
- `README.md:16` says the app works offline after the first load. There is no service worker, so offline behavior in a served environment is not guaranteed.

### Fix

- Change “full app state” to “routine and workout history.”
- Clarify that the app has no external dependencies but should be served locally for reliable `localStorage` and clipboard behavior.
- Keep the existing note that data is browser-local and can be lost if storage is cleared.

### Acceptance

- README matches the actual backup payload.
- README does not promise offline behavior the app does not guarantee.
- The PRD and README do not contradict each other.

---

# Test Coverage

## 18. Add regression tests for the fixes above

**Priority:** Tests
**Where:** `tests/run-tests.mjs`

### Missing coverage

Add tests for:

1. History → Edit with a dirty draft prompts and preserves the draft on cancel.
2. Restore with a dirty draft prompts and preserves the draft on cancel.
3. Custom exercise identity:
   - Known routine exercise reuses `xid`.
   - Prefill is bounded by the selected date.
   - Saving does not create a duplicate Progress entry.
4. Negative weights are clamped.
5. Duplicate log IDs are regenerated.
6. Inconsistent `di` values are derived from the date.
7. Editing a workout across weekdays preserves the original routine name.
8. Weekday-chip date conflict while editing is blocked immediately.
9. Draft and theme injection payloads remain escaped.
10. Invalid theme values fall back to `system`.
11. Routine validation rejects blank names and inverted ranges.
12. Disabled future-day chips are rendered as disabled.

### Acceptance

- Each new test fails before the corresponding fix and passes after it.
- The full suite remains green.
- Test names describe the behavior, not the implementation detail.

---

# Verification Checklist

After applying the fixes, verify:

- [ ] `node tests/run-tests.mjs` → `151 passed, 0 failed` plus new tests.
- [ ] No HTML/CSS/JS file was changed unintentionally by documentation edits.
- [ ] History → Edit with a dirty draft prompts.
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

---

# Related Known Limitations Not Scheduled as Immediate Fixes

These are documented in `docs/PRD.md` but are larger or lower-priority changes:

- Multiple tabs are not coordinated; the last tab to write wins.
- Duplicate workout dates and duplicate routine IDs from imported backups are not fully rejected.
- A failed draft clear after a successful save can leave a stale draft that reappears after reload.
- There is no schema version or migration framework.
- There is no service worker or installable offline package.
- Recovery copies are not pruned automatically.
- The selected Progression exercise is not persisted across reloads.
- The chart has no axes, tooltips, or date labels.
- Routine exercises cannot be reordered.
- There is no undo for deleted workouts, removed exercises, or removed sets.
- Accessibility is basic: placeholder-only labels, small icon targets, no custom focus styles, and no ARIA live region.
- There is no multi-device synchronization or automatic backup.
