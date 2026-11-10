/*
 * Dependency-free regression tests for Gym Progression Tracker.
 * Loads js/app.js and runs it inside a Node vm
 * context with a stubbed DOM/localStorage/navigator, then drives the app's
 * own click/input/change handlers to verify the documented bug fixes.
 *
 * Run with: node tests/run-tests.mjs
 * Does not touch real browser data (storage is in-memory only).
 */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
// Load the storage adapter first so `Store` exists when app.js runs.
let src =
  readFileSync(join(__dir, '..', 'js', 'store.js'), 'utf8') + '\n' +
  readFileSync(join(__dir, '..', 'js', 'app.js'), 'utf8');
src += `
;globalThis.__api = {
  normalizeData, validateBackup, bootState, normDraft, normLog, normLogEx,
  dateForWeekday, isCompleted, draftHasData, isDate, byDate, remapDraftXids,
  getS: () => S, getD: () => D, getTab: () => tab,
};`;

function makeEl(props = {}) {
  const e = {
    dataset: {},
    value: '',
    checked: false,
    innerHTML: '',
    style: {},
    closest(sel) { return (this.dataset.a && sel === '[data-a]') ? this : null; },
  };
  return Object.assign(e, props);
}

// Fixed reference "now" for every app instance. The suite asserts concrete
// dates (e.g. Tue 13-10-2026), so the clock must not follow the wall clock.
const FIXED_NOW = '2026-10-13T12:00:00';

function app({ seed = {}, failWrites = false, controls = {}, now = FIXED_NOW } = {}) {
  const store = new Map(Object.entries(seed));
  const listeners = { click: [], input: [], change: [] };
  const alerts = [], confirms = [], prompts = [];
  const ctl = { confirm: true, prompt: null, ...controls };
  const elements = new Map();
  const docEl = {
    dataset: {},
    removedAttributes: [],
    removeAttribute(name) {
      this.removedAttributes.push(name);
      if (name === 'data-theme') delete this.dataset.theme;
    },
  };

  const sandbox = {
    console,
    localStorage: {
      getItem: k => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => {
        if (failWrites) { const e = new Error('quota exceeded'); e.name = 'QuotaExceededError'; throw e }
        store.set(k, String(v));
      },
      removeItem: k => store.delete(k),
    },
    navigator: { clipboard: { writeText: async () => { } } },
    alert: a => alerts.push(String(a)),
    confirm: c => { confirms.push(String(c)); return ctl.confirm; },
    prompt: (msg) => { prompts.push(String(msg)); return ctl.prompt; },
    document: {
      documentElement: docEl,
      querySelector: s => { if (!elements.has(s)) elements.set(s, makeEl()); return elements.get(s); },
      addEventListener: (t, fn) => { (listeners[t] = listeners[t] || []).push(fn); },
    },
  };

  vm.createContext(sandbox);
  // Deterministic clock: no-arg `new Date()` / `Date.now()` return the fixed
  // instant, while `new Date(str|Date)` keeps real behavior. Sharing the real
  // prototype keeps the toLocaleDateString stub below effective.
  sandbox.__NOW__ = new Date(now).getTime();
  vm.runInContext(`(function () {
    const RealDate = Date, NOW = __NOW__;
    function FakeDate() { return arguments.length ? new RealDate(...arguments) : new RealDate(NOW) }
    FakeDate.now = function () { return NOW };
    FakeDate.parse = RealDate.parse;
    FakeDate.UTC = RealDate.UTC;
    FakeDate.prototype = RealDate.prototype;
    globalThis.Date = FakeDate;
  })();`, sandbox);
  const runSrc = 'Date.prototype.toLocaleDateString = function () { return "01 Jan 2026" };\n' + src;
  vm.runInContext(runSrc, sandbox);

  const fireClick = dataset => { const t = makeEl({ dataset }); listeners.click.forEach(fn => fn({ target: t })); };
  const fireInput = props => { const t = makeEl(props); listeners.input.forEach(fn => fn({ target: t })); };
  const fireChange = props => { const t = makeEl(props); listeners.change.forEach(fn => fn({ target: t })); };

  return { api: sandbox.__api, store, alerts, confirms, prompts, ctl, dom: elements, docEl, fireClick, fireInput, fireChange };
}

// ---- tiny test runner ----
let pass = 0, fail = 0;
const ok = (name, cond, extra) => {
  if (cond === true) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra !== undefined ? '  ' + JSON.stringify(extra) : '')); }
};
const eq = (name, a, b) => ok(name, JSON.stringify(a) === JSON.stringify(b), { a, b });
const section = n => console.log('\n' + n);

// default app state, generated from a clean boot
const base = app({});
const DEFAULTS = JSON.stringify(base.api.getS());
const DIRTY_DRAFT = JSON.stringify({
  date: '2026-10-13', di: 1,
  ex: [{
    xid: 'xd1', n: 'Bench Press', m: 'Chest', smin: 3, smax: 4, rmin: 6, rmax: 10, on: true,
    sets: [{ w: '60', r: '8', d: true }, { w: '60', r: '8', d: false }, { w: '60', r: '', d: true }]
  }],
});

// =====================================================================
section('Bug 1 — malformed storage must not crash; valid data is preserved');
{
  const c = app({});
  eq('no data -> 7 plan days', Object.keys(c.api.getS().plan).length, 7);
  ok('no data -> empty logs', c.api.getS().logs.length === 0);
  ok('no data -> no recovery copy', ![...c.store.keys()].some(k => k.startsWith('gym_data_recovery_')));
}
{
  const logs = [
    { id: 'b', date: '2026-10-06', day: 'Tuesday', year: 2026, di: 1, name: 'X', ex: [{ n: 'Squat', m: 'Legs', sets: [{ w: 80, r: 5 }] }] },
    { id: 'a', date: '2026-10-05', day: 'Monday', year: 2026, di: 0, name: 'X', ex: [{ n: 'Squat', m: 'Legs', sets: [{ w: 70, r: 5 }] }] },
  ];
  const c = app({ seed: { gym_data: JSON.stringify({ plan: JSON.parse(DEFAULTS).plan, logs }) } });
  eq('valid data preserved, logs sorted by date', c.api.getS().logs.map(l => l.id), ['a', 'b']);
  ok('valid data keeps plan', c.api.getS().plan[0].ex.length === 5);
}
for (const [label, raw] of [
  ['malformed JSON', '{{not json'],
  ['empty object {}', '{}'],
  ['top-level array', '[1,2,3]'],
  ['null logs / null plan', JSON.stringify({ plan: null, logs: null })],
  ['missing logs', JSON.stringify({ plan: JSON.parse(DEFAULTS).plan })],
  ['invalid nested exercises/logs', JSON.stringify({ plan: { 0: { name: 'X', ex: [42, {}, { n: 'Ok', smin: 3 }] } }, logs: [null, { date: 'bad' }, { date: '2026-10-01', ex: [{ n: 'Y', sets: [{ w: 'a', r: 'b' }] }] }] })],
]) {
  const c = app({ seed: { gym_data: raw } });
  ok('does not crash: ' + label, !!c.api.getS() && typeof c.api.getS().plan === 'object');
  ok('plan always has 7 days: ' + label, Object.keys(c.api.getS().plan).length === 7);
  ok('logs is an array: ' + label, Array.isArray(c.api.getS().logs));
}
{
  const c = app({ seed: { gym_data: '{}' } });
  ok('{} -> recovery copy preserved', [...c.store.keys()].some(k => k.startsWith('gym_data_recovery_')));
  ok('{} -> user informed', c.alerts.some(a => a.includes('recovery')));
}
{
  const c = app({ seed: { gym_data: '{{broken', gym_draft: '{"date":"garbage"}' } });
  ok('bad draft -> draft ignored, fresh today draft created', !!c.api.getD() && c.api.getD().date === '2026-10-13' && Array.isArray(c.api.getD().ex));
}

// =====================================================================
section('Bugs 2 & 3 — backup validation + normalization on restore');
{
  const c = app({ seed: { gym_data: DEFAULTS } });
  const before = JSON.stringify(c.api.getS());
  c.ctl.prompt = 'not json{';
  c.fireClick({ a: 'rs' });
  ok('invalid JSON rejected', c.alerts.some(a => a.includes('not valid JSON')));
  eq('state unchanged after invalid JSON', JSON.stringify(c.api.getS()), before);
}
{
  const c = app({ seed: { gym_data: DEFAULTS } });
  const before = JSON.stringify(c.api.getS());
  for (const bad of [
    JSON.stringify({ logs: [] }),
    JSON.stringify({ plan: {}, logs: 'x' }),
    JSON.stringify({ plan: { 0: 'garbage' }, logs: [] }),
    JSON.stringify({ plan: { 0: { name: 'X', ex: [7] } }, logs: [] }),
    JSON.stringify({ plan: {}, logs: [{ date: 'yesterday' }] }),
  ]) {
    c.ctl.prompt = bad;
    c.fireClick({ a: 'rs' });
    ok('invalid backup rejected: ' + bad.slice(0, 40), c.alerts.some(a => a.startsWith('Invalid backup')));
  }
  eq('state unchanged after all invalid backups', JSON.stringify(c.api.getS()), before);
}
{
  const c = app({ seed: { gym_data: DEFAULTS } });
  const legacy = {
    plan: { 0: { name: 'Routine A', ex: [{ n: 'Squat', m: 'Legs', smin: 3, smax: 4, rmin: 6, rmax: 10 }] }, 3: { name: 'Rest', ex: [] } },
    logs: [{ id: 'L1', date: '2026-10-05', ex: [{ n: 'Squat', sets: [{ w: 80, r: 5 }] }] }], // no year/day/di/xid
  };
  c.ctl.prompt = JSON.stringify(legacy);
  c.fireClick({ a: 'rs' });
  ok('legacy backup restored with feedback', c.alerts.some(a => a.includes('Backup restored')));
  const l = c.api.getS().logs[0];
  eq('legacy log year derived', l.year, 2026);
  eq('legacy log day derived', l.day, 'Monday');
  eq('legacy log di derived (wk of date)', l.di, 0);
  ok('legacy log has routine name/plan', typeof c.api.getS().plan[0].name === 'string');
}

// =====================================================================
section('Bugs.md 10 — restore warns before discarding an unsaved draft');
const cleanBackup = () => JSON.stringify({
  plan: { 0: { name: 'Restored Plan', ex: [] } },
  logs: [{ id: 'r1', date: '2026-10-05', ex: [{ n: 'Squat', m: 'Legs', sets: [{ w: 80, r: 5 }] }] }],
});
{
  const c = app({ seed: { gym_data: DEFAULTS } });
  c.ctl.prompt = cleanBackup();
  c.fireClick({ a: 'rs' });
  eq('clean restore -> no discard prompt', c.confirms.length, 0);
  eq('clean restore replaces the plan', c.api.getS().plan[0].name, 'Restored Plan');
  eq('clean restore replaces history', c.api.getS().logs.map(l => l.id), ['r1']);
  ok('clean restore confirms success', c.alerts.some(a => a.includes('Backup restored')));
  eq('clean restore clears the draft', c.api.getD(), null);
  eq('clean restore clears stored draft', c.store.get('gym_draft'), 'null');
}
{
  const c = app({ seed: { gym_data: DEFAULTS, gym_draft: DIRTY_DRAFT } });
  const beforeS = JSON.stringify(c.api.getS());
  const beforeD = JSON.stringify(c.api.getD());
  const storedS = c.store.get('gym_data');
  const storedD = c.store.get('gym_draft');
  c.ctl.prompt = cleanBackup();
  c.ctl.confirm = false;
  c.fireClick({ a: 'rs' });
  eq('dirty restore asks before discarding', c.confirms.length, 1);
  ok('dirty restore prompt mentions the loss', /unsaved|discard/i.test(c.confirms[0]));
  eq('cancelled restore leaves plan and history', JSON.stringify(c.api.getS()), beforeS);
  eq('cancelled restore leaves the draft', JSON.stringify(c.api.getD()), beforeD);
  eq('cancelled restore does not write data', c.store.get('gym_data'), storedS);
  eq('cancelled restore does not write the draft', c.store.get('gym_draft'), storedD);
  ok('cancelled restore has no success message', !c.alerts.some(a => a.includes('Backup restored')));
}
{
  const c = app({ seed: { gym_data: DEFAULTS, gym_draft: DIRTY_DRAFT } });
  c.ctl.prompt = cleanBackup();
  c.ctl.confirm = true;
  c.fireClick({ a: 'rs' });
  eq('confirmed dirty restore prompts once', c.confirms.length, 1);
  eq('confirmed dirty restore replaces history', c.api.getS().logs.map(l => l.id), ['r1']);
  eq('confirmed dirty restore clears the draft', c.api.getD(), null);
  eq('confirmed dirty restore clears stored draft', c.store.get('gym_draft'), 'null');
  eq('confirmed dirty restore returns to history', c.api.getTab(), 'history');
  ok('confirmed dirty restore reports success', c.alerts.some(a => a.includes('Backup restored')));
}
{
  const c = app({ seed: { gym_data: DEFAULTS, gym_draft: DIRTY_DRAFT } });
  const beforeS = JSON.stringify(c.api.getS());
  const beforeD = JSON.stringify(c.api.getD());
  c.ctl.prompt = 'not json{';
  c.ctl.confirm = true;
  c.fireClick({ a: 'rs' });
  eq('invalid backup does not ask about the draft', c.confirms.length, 0);
  eq('invalid backup leaves state untouched', JSON.stringify(c.api.getS()), beforeS);
  eq('invalid backup leaves the draft untouched', JSON.stringify(c.api.getD()), beforeD);
  ok('invalid backup still reports invalidity', c.alerts.some(a => a.includes('not valid JSON')));
}

// =====================================================================
section('Bugs.md 11 — stored draft and theme values are escaped');
const INJECT = '"><img src=x onerror=alert(1)>';
const injectDraft = (field, value) => JSON.stringify({
  date: '2026-10-13', di: 1, editId: '',
  ex: [{
    xid: '', n: 'Bench Press', m: 'Chest', smin: 3, smax: 4, rmin: 6, rmax: 10, on: true,
    sets: [{ w: field === 'w' ? value : '60', r: field === 'r' ? value : '8', d: false }],
  }],
});
{
  const c = app({ seed: { gym_data: DEFAULTS, gym_draft: injectDraft('w', INJECT) } });
  const html = c.dom.get('#v').innerHTML;
  ok('draft weight payload is escaped', html.includes('&quot;&gt;&lt;img') && !html.includes('<img'));
}
{
  const c = app({ seed: { gym_data: DEFAULTS, gym_draft: injectDraft('r', INJECT) } });
  const html = c.dom.get('#v').innerHTML;
  ok('draft reps payload is escaped', html.includes('&quot;&gt;&lt;img') && !html.includes('<img'));
}
{
  const c = app({ seed: { gym_data: DEFAULTS, gym_draft: injectDraft('w', '62.5') } });
  const html = c.dom.get('#v').innerHTML;
  ok('normal draft weight still renders', html.includes('value="62.5"'));
}
{
  const c = app({ seed: { gym_data: DEFAULTS, gym_theme: JSON.stringify(INJECT) } });
  eq('invalid stored theme is rewritten to system', c.store.get('gym_theme'), JSON.stringify('system'));
  eq('invalid theme removes data-theme', c.docEl.removedAttributes.includes('data-theme'), true);
  c.fireClick({ a: 'tab', t: 'routine' });
  const html = c.dom.get('#v').innerHTML;
  ok('invalid theme payload never reaches the page', !html.includes('<img') && html.includes('Theme: System'));
}
{
  const c = app({ seed: { gym_data: DEFAULTS, gym_theme: JSON.stringify('neon') } });
  eq('unknown stored theme falls back to system', c.store.get('gym_theme'), JSON.stringify('system'));
}
{
  const c = app({ seed: { gym_data: DEFAULTS, gym_theme: JSON.stringify('dark') } });
  eq('valid dark theme is kept', c.store.get('gym_theme'), JSON.stringify('dark'));
  eq('valid dark theme is applied', c.docEl.dataset.theme, 'dark');
  c.fireClick({ a: 'tab', t: 'routine' });
  ok('valid dark theme label renders', c.dom.get('#v').innerHTML.includes('Theme: Dark'));
}
{
  const c = app({ seed: { gym_data: DEFAULTS, gym_theme: JSON.stringify('light') } });
  eq('valid light theme is applied', c.docEl.dataset.theme, 'light');
  c.fireClick({ a: 'tab', t: 'routine' });
  ok('valid light theme label renders', c.dom.get('#v').innerHTML.includes('Theme: Light'));
}
{
  const c = app({ seed: { gym_data: DEFAULTS, gym_theme: JSON.stringify('system') } });
  eq('system theme removes data-theme', c.docEl.removedAttributes.includes('data-theme'), true);
  c.fireClick({ a: 'tab', t: 'routine' });
  ok('system theme label renders', c.dom.get('#v').innerHTML.includes('Theme: System'));
}
{
  const c = app({ seed: { gym_data: DEFAULTS } });
  c.fireClick({ a: 'theme' }); // default system -> light
  eq('theme cycle still starts at light', c.store.get('gym_theme'), JSON.stringify('light'));
  eq('theme cycle applies light', c.docEl.dataset.theme, 'light');
}

// =====================================================================
section('Import integrity — di is always derived from the workout date');
const weekdayIndex = s => (new Date(s + 'T00:00:00').getDay() + 6) % 7;
const inconsistentLog = di => ({
  id: 'di1', date: '2026-10-05', day: 'Thursday', year: 1999, di, name: 'A',
  ex: [{ n: 'Squat', m: 'Legs', sets: [{ w: 80, r: 5 }] }],
});
{
  const c = app({ seed: { gym_data: JSON.stringify({ plan: JSON.parse(DEFAULTS).plan, logs: [inconsistentLog(3)] }) } });
  const l = c.api.getS().logs[0];
  eq('boot derives di from date', l.di, weekdayIndex('2026-10-05'));
  eq('boot derives day from date', l.day, 'Monday');
  eq('boot derives year from date', l.year, 2026);
  eq('boot persists corrected di', JSON.parse(c.store.get('gym_data')).logs[0].di, 0);
}
{
  const c = app({ seed: { gym_data: DEFAULTS } });
  c.ctl.prompt = JSON.stringify({ plan: JSON.parse(DEFAULTS).plan, logs: [inconsistentLog(3)] });
  c.fireClick({ a: 'rs' });
  ok('restore accepts the backup', c.alerts.some(a => a.includes('Backup restored')));
  eq('restore derives di from date', c.api.getS().logs[0].di, weekdayIndex('2026-10-05'));
  eq('restore persists corrected di', JSON.parse(c.store.get('gym_data')).logs[0].di, 0);
}
for (const di of [7, -1, '3', 1.5, null]) {
  const c = app({ seed: { gym_data: JSON.stringify({ plan: JSON.parse(DEFAULTS).plan, logs: [inconsistentLog(di)] }) } });
  const l = c.api.getS().logs[0];
  eq('invalid di ' + JSON.stringify(di) + ' -> derived', l.di, weekdayIndex('2026-10-05'));
  ok('invalid di ' + JSON.stringify(di) + ' -> day/year consistent', l.day === 'Monday' && l.year === 2026);
}

// =====================================================================
section('Bug 4 — only checked sets with reps are saved');
{
  const c = app({ seed: { gym_data: DEFAULTS, gym_draft: DIRTY_DRAFT } });
  c.fireClick({ a: 'fin' });
  const saved = c.api.getS().logs[0];
  ok('workout saved', !!(saved && saved.ex && saved.ex[0]));
  eq('only checked set with reps saved', saved.ex[0].sets.map(s => s.r), [8]);
  eq('unchecked set excluded', saved.ex[0].sets.length, 1);
  eq('empty set excluded', saved.ex[0].sets.length, 1);
  eq('tab moved to history', c.api.getTab(), 'history');
  eq('draft cleared', c.store.get('gym_draft'), 'null');
}
{
  const c = app({ seed: { gym_data: DEFAULTS } });
  c.fireInput({ dataset: { f: 'r', i: '0', j: '0' }, value: '5' }); // reps but never checked
  c.fireClick({ a: 'fin' });
  ok('workout with no checked set is NOT saved', c.api.getS().logs.length === 0);
  ok('user warned', c.alerts.some(a => a.includes('Mark at least one set as completed')));
}

// =====================================================================
section('Bug 5 — edit keeps identity; date conflicts are blocked');
{
  const seedLog = { id: 'a1', date: '2026-10-12', day: 'Monday', year: 2026, di: 0, name: 'Routine A', ex: [{ n: 'Bench Press', m: 'Chest', xid: '', sets: [{ w: 60, r: 8 }] }] };
  const plan = JSON.parse(DEFAULTS).plan;
  const seed = JSON.stringify({ plan, logs: [seedLog] });
  const c = app({ seed: { gym_data: seed } });
  c.fireClick({ a: 'edit', id: 'a1' });
  c.fireClick({ a: 'fin' });
  eq('edit without date change updates same record', c.api.getS().logs.map(l => l.id), ['a1']);
  eq('date unchanged', c.api.getS().logs[0].date, '2026-10-12');
}
{
  const seedLog = { id: 'a1', date: '2026-10-12', day: 'Monday', year: 2026, di: 0, name: 'Routine A', ex: [{ n: 'Bench Press', m: 'Chest', xid: '', sets: [{ w: 60, r: 8 }] }] };
  const plan = JSON.parse(DEFAULTS).plan;
  const c = app({ seed: { gym_data: JSON.stringify({ plan, logs: [seedLog] }) } });
  c.fireClick({ a: 'edit', id: 'a1' });
  c.fireChange({ id: 'dt', value: '2026-10-13' });
  eq('editing keeps identity across date change', c.api.getD().editId, 'a1');
  c.fireClick({ a: 'fin' });
  eq('date change updates the SAME record (no duplicate)', c.api.getS().logs.map(l => l.id), ['a1']);
  eq('record moved to new date', c.api.getS().logs[0].date, '2026-10-13');
}
{
  const logs = [
    { id: 'a1', date: '2026-10-12', day: 'Monday', year: 2026, di: 0, name: 'Routine A', ex: [{ n: 'Bench Press', m: 'Chest', xid: '', sets: [{ w: 60, r: 8 }] }] },
    { id: 'b1', date: '2026-10-13', day: 'Tuesday', year: 2026, di: 1, name: 'Routine B', ex: [{ n: 'Lat Pulldown', m: 'Back', xid: '', sets: [{ w: 40, r: 10 }] }] },
  ];
  const c = app({ seed: { gym_data: JSON.stringify({ plan: JSON.parse(DEFAULTS).plan, logs }) } });
  c.fireClick({ a: 'edit', id: 'a1' });
  c.fireChange({ id: 'dt', value: '2026-10-13' });
  ok('conflict blocked with message', c.alerts.some(a => a.includes('Another workout already exists')));
  eq('original edit date preserved', c.api.getD().date, '2026-10-12');
  c.fireClick({ a: 'fin' });
  eq('both records intact after conflict', c.api.getS().logs.map(l => l.id).sort(), ['a1', 'b1']);
  ok('conflicting record not overwritten', c.api.getS().logs.find(l => l.id === 'b1').date === '2026-10-13');
}

// =====================================================================
section('Bugs.md 7 — weekday chips block occupied dates while editing');
{
  const logs = [
    { id: 'mon', date: '2026-10-12', day: 'Monday', year: 2026, di: 0, name: 'Routine A', ex: [{ n: 'Bench Press', m: 'Chest', xid: '', sets: [{ w: 60, r: 8 }] }] },
    { id: 'tue', date: '2026-10-13', day: 'Tuesday', year: 2026, di: 1, name: 'Routine B', ex: [{ n: 'Lat Pulldown', m: 'Back', xid: '', sets: [{ w: 40, r: 10 }] }] },
  ];
  const c = app({ seed: { gym_data: JSON.stringify({ plan: JSON.parse(DEFAULTS).plan, logs }) } });
  c.fireClick({ a: 'edit', id: 'mon' });
  c.fireClick({ a: 'day', i: '1' });
  ok('occupied chip is blocked with a message', c.alerts.some(a => a.includes('Another workout already exists')));
  eq('occupied chip keeps the edit date', c.api.getD().date, '2026-10-12');
  eq('occupied chip keeps the weekday index', c.api.getD().di, 0);
  eq('occupied chip leaves both workouts intact', c.api.getS().logs.map(l => l.id).sort(), ['mon', 'tue']);
  c.fireClick({ a: 'fin' });
  eq('blocked chip still allows saving the original workout', c.api.getS().logs.find(l => l.id === 'mon').date, '2026-10-12');
}
{
  const logs = [
    { id: 'wed', date: '2026-10-07', day: 'Wednesday', year: 2026, di: 2, name: 'Routine C', ex: [{ n: 'Squat', m: 'Legs', xid: '', sets: [{ w: 80, r: 5 }] }] },
  ];
  const c = app({ seed: { gym_data: JSON.stringify({ plan: JSON.parse(DEFAULTS).plan, logs }) } });
  c.fireClick({ a: 'edit', id: 'wed' });
  c.fireClick({ a: 'day', i: '1' });
  eq('free chip moves the edit date', c.api.getD().date, '2026-10-06');
  eq('free chip updates the weekday index', c.api.getD().di, 1);
}
{
  const logs = [
    { id: 'mon', date: '2026-10-12', day: 'Monday', year: 2026, di: 0, name: 'Routine A', ex: [{ n: 'Bench Press', m: 'Chest', xid: '', sets: [{ w: 60, r: 8 }] }] },
  ];
  const c = app({ seed: { gym_data: JSON.stringify({ plan: JSON.parse(DEFAULTS).plan, logs }) } });
  ok('new draft starts without an edit identity', !c.api.getD().editId);
  c.fireClick({ a: 'day', i: '0' });
  eq('occupied chip from a new draft opens the workout for editing', c.api.getD().editId, 'mon');
  eq('occupied chip from a new draft loads its date', c.api.getD().date, '2026-10-12');
}

// =====================================================================
section('Bugs.md 6 — edited workout keeps its routine name across weekdays');
const NAME_PLAN = JSON.parse(DEFAULTS).plan;
const mondayLog = (name = 'Routine A') => ({
  id: 'a1', date: '2026-10-12', day: 'Monday', year: 2026, di: 0, name,
  ex: [{ n: 'Bench Press', m: 'Chest', xid: '', sets: [{ w: 60, r: 8 }] }],
});
{
  const c = app({ seed: { gym_data: JSON.stringify({ plan: NAME_PLAN, logs: [mondayLog()] }) } });
  c.fireClick({ a: 'edit', id: 'a1' });
  c.fireChange({ id: 'dt', value: '2026-10-13' }); // Tuesday
  const html = c.dom.get('#v').innerHTML;
  ok('edit header keeps the original routine name', html.includes('Routine A'));
  ok('edit header does not adopt the destination routine name', !html.includes('Back + Biceps'));
  c.fireClick({ a: 'fin' });
  const rec = c.api.getS().logs[0];
  eq('date moved to Tuesday', rec.date, '2026-10-13');
  eq('record name preserved', rec.name, 'Routine A');
  eq('original exercises preserved', rec.ex.map(e => e.n), ['Bench Press']);
  eq('same record updated', c.api.getS().logs.map(l => l.id), ['a1']);
}
{
  const c = app({ seed: { gym_data: JSON.stringify({ plan: NAME_PLAN, logs: [mondayLog()] }) } });
  c.fireClick({ a: 'edit', id: 'a1' });
  c.fireClick({ a: 'day', i: '1' }); // Tuesday chip
  eq('chip moves edit to Tuesday', c.api.getD().date, '2026-10-13');
  c.fireClick({ a: 'fin' });
  const rec = c.api.getS().logs[0];
  eq('chip path preserves the record name', rec.name, 'Routine A');
  eq('chip path preserves the exercises', rec.ex.map(e => e.n), ['Bench Press']);
}
{
  const c = app({ seed: { gym_data: JSON.stringify({ plan: NAME_PLAN, logs: [mondayLog('')] }) } });
  c.fireClick({ a: 'edit', id: 'a1' });
  c.fireChange({ id: 'dt', value: '2026-10-13' });
  c.fireClick({ a: 'fin' });
  eq('a blank original name stays blank', c.api.getS().logs[0].name, '');
}
{
  const c = app({});
  c.fireClick({ a: 'day', i: '1' }); // fresh Tuesday draft
  c.fireInput({ dataset: { f: 'w', i: '0', j: '0' }, value: '40' });
  c.fireInput({ dataset: { f: 'r', i: '0', j: '0' }, value: '10' });
  c.fireInput({ dataset: { f: 'd', i: '0', j: '0' }, checked: true });
  c.fireClick({ a: 'fin' });
  eq('new workout still uses the selected day routine name', c.api.getS().logs[0].name, c.api.getS().plan[1].name);
}

// =====================================================================
section('Dirty draft — unsaved-changes warning on day switch');
{
  const c = app({});
  c.fireClick({ a: 'day', i: '0' });
  ok('clean switch -> no prompt', c.confirms.length === 0);
  eq('draft moved to Mon', c.api.getD().di, 0);
  eq('clean switch -> selects this week Monday', c.api.getD().date, '2026-10-12');
}
{
  const c = app({});
  const before = c.api.getD().date;
  c.fireInput({ dataset: { f: 'r', i: '0', j: '0' }, value: '5' });
  c.ctl.confirm = false;
  c.fireClick({ a: 'day', i: '0' });
  eq('dirty switch + cancel -> prompt asked', c.confirms.length, 1);
  eq('dirty switch + cancel -> date unchanged', c.api.getD().date, before);
}
{
  const c = app({});
  c.fireInput({ dataset: { f: 'r', i: '0', j: '0' }, value: '5' });
  c.ctl.confirm = true;
  c.fireClick({ a: 'day', i: '0' });
  eq('dirty switch + confirm -> moved to Mon', c.api.getD().di, 0);
  ok('dirty switch + confirm -> prompt shown', c.confirms.length === 1);
}

// =====================================================================
section('Bug A1 — discard prompt only fires after real edits (baseline diff)');
const HISTORY_PLAN = { 0: { name: 'Push', ex: [{ id: 'bx', n: 'Bench Press', m: 'Chest', smin: 3, smax: 4, rmin: 6, rmax: 10 }] } };
const HISTORY_LOGS = [{ id: 'l1', date: '2026-10-05', ex: [{ n: 'Bench Press', m: 'Chest', xid: 'bx', sets: [{ w: 100, r: 8 }] }] }];
const historySeed = () => ({ gym_data: JSON.stringify({ plan: HISTORY_PLAN, logs: HISTORY_LOGS }) });
{
  // the reported repro: weights auto-filled from history, user types nothing
  const c = app({ seed: historySeed() });
  c.fireClick({ a: 'day', i: '0' }); // open a fresh Monday
  eq('prefill still applied', String(c.api.getD().ex[0].sets[0].w), '100');
  ok('untouched prefilled draft is not dirty', c.api.draftHasData(c.api.getD()) === false);
  c.fireClick({ a: 'day', i: '1' }); // switch away -> must not warn
  eq('untouched prefilled switch -> no prompt', c.confirms.length, 0);
  eq('untouched prefilled switch -> moved to Tue', c.api.getD().date, '2026-10-13');
}
{
  // a weight-only edit IS the user's work and must still count as dirty
  const c = app({ seed: historySeed() });
  c.fireClick({ a: 'day', i: '0' });
  c.fireInput({ dataset: { f: 'w', i: '0', j: '0' }, value: '105' });
  ok('weight-only edit is dirty', c.api.draftHasData(c.api.getD()) === true);
  c.ctl.confirm = false;
  c.fireClick({ a: 'day', i: '1' });
  eq('dirty switch + cancel -> prompt asked', c.confirms.length, 1);
  eq('dirty switch + cancel -> date unchanged', c.api.getD().date, '2026-10-12');
}
{
  // structural edits count, and reverting them back to the baseline is clean again
  const c = app({ seed: historySeed() });
  c.fireClick({ a: 'day', i: '0' });
  ok('baseline draft clean', c.api.draftHasData(c.api.getD()) === false);
  c.fireClick({ a: 'as', i: '0' });
  ok('added set is dirty', c.api.draftHasData(c.api.getD()) === true);
  c.fireClick({ a: 'ds', i: '0', j: '2' });
  ok('reverted to baseline -> clean again', c.api.draftHasData(c.api.getD()) === false);
  c.fireClick({ a: 'tog', i: '0' });
  ok('skip toggle is dirty', c.api.draftHasData(c.api.getD()) === true);
}
{
  // the baseline survives a save -> reload round trip (normDraft carries base)
  const c = app({ seed: historySeed() });
  c.fireClick({ a: 'day', i: '0' });
  ok('draft persisted with baseline', !!c.store.get('gym_draft'));
  const c2 = app({ seed: { gym_data: c.store.get('gym_data'), gym_draft: c.store.get('gym_draft') }, now: '2026-10-12T12:00:00' });
  ok('reloaded untouched draft still clean', c2.api.draftHasData(c2.api.getD()) === false);
  c2.fireInput({ dataset: { f: 'r', i: '0', j: '0' }, value: '9' });
  ok('reloaded draft still detects edits', c2.api.draftHasData(c2.api.getD()) === true);
}
{
  // edit sessions use the baseline too: untouched opens are clean, edits are not
  const c = app({ seed: historySeed() });
  c.fireClick({ a: 'edit', id: 'l1' });
  ok('untouched edit session is clean', c.api.draftHasData(c.api.getD()) === false);
  c.fireInput({ dataset: { f: 'r', i: '0', j: '0' }, value: '9' });
  ok('modified edit session is dirty', c.api.draftHasData(c.api.getD()) === true);
}
{
  // legacy draft without a baseline: weight-only can't be trusted (auto-fill is
  // indistinguishable from typing), but reps/completed still flag dirty
  const legacy = sets => JSON.stringify({
    date: '2026-10-13', di: 1, editId: '',
    ex: [{ xid: '', n: 'Extra', m: '', smin: '', smax: '', rmin: '', rmax: '', on: true, sets }],
  });
  const cW = app({ seed: { gym_data: DEFAULTS, gym_draft: legacy([{ w: '50', r: '', d: false }]) } });
  ok('legacy weight-only draft -> no false dirty', cW.api.draftHasData(cW.api.getD()) === false);
  const cR = app({ seed: { gym_data: DEFAULTS, gym_draft: legacy([{ w: '50', r: '5', d: false }]) } });
  ok('legacy reps draft -> dirty', cR.api.draftHasData(cR.api.getD()) === true);
}

// =====================================================================
section('Bug 1 — History Edit warns before discarding a dirty draft');
{
  // clean draft: opening another workout must not prompt
  const c = app({ seed: historySeed() });
  c.fireClick({ a: 'day', i: '0' }); // Monday draft with a baseline
  c.fireClick({ a: 'edit', id: 'l1' });
  eq('clean draft -> no prompt', c.confirms.length, 0);
  eq('clean draft -> selected workout opens', c.api.getD().editId, 'l1');
  eq('clean draft -> switched to today', c.api.getTab(), 'today');
}
{
  // dirty draft + cancel: prompt first, draft and stored copy untouched
  const c = app({ seed: historySeed() });
  c.fireClick({ a: 'day', i: '0' });
  c.fireInput({ dataset: { f: 'r', i: '0', j: '0' }, value: '5' });
  ok('typed reps make the draft dirty', c.api.draftHasData(c.api.getD()) === true);
  c.fireClick({ a: 'tab', t: 'history' });
  const draftBefore = c.store.get('gym_draft');
  const dateBefore = c.api.getD().date;
  c.ctl.confirm = false;
  c.fireClick({ a: 'edit', id: 'l1' });
  eq('dirty draft -> prompt asked', c.confirms.length, 1);
  ok('cancel -> selected workout not opened', c.api.getD().editId !== 'l1');
  eq('cancel -> draft date unchanged', c.api.getD().date, dateBefore);
  eq('cancel -> typed reps preserved', c.api.getD().ex[0].sets[0].r, '5');
  eq('cancel -> stored draft unchanged', c.store.get('gym_draft'), draftBefore);
  eq('cancel -> stays on history', c.api.getTab(), 'history');
}
{
  // dirty draft + confirm: the selected workout replaces the draft
  const c = app({ seed: historySeed() });
  c.fireClick({ a: 'day', i: '0' });
  c.fireInput({ dataset: { f: 'r', i: '0', j: '0' }, value: '5' });
  c.fireClick({ a: 'tab', t: 'history' });
  c.ctl.confirm = true;
  c.fireClick({ a: 'edit', id: 'l1' });
  eq('dirty draft + confirm -> prompt asked', c.confirms.length, 1);
  eq('dirty draft + confirm -> selected workout opens', c.api.getD().editId, 'l1');
  eq('dirty draft + confirm -> workout date loaded', c.api.getD().date, '2026-10-05');
  eq('dirty draft + confirm -> switched to today', c.api.getTab(), 'today');
}

const twoLogSeed = () => ({
  gym_data: JSON.stringify({
    plan: HISTORY_PLAN,
    logs: [
      { id: 'l1', date: '2026-10-05', ex: [{ n: 'Bench Press', m: 'Chest', xid: 'bx', sets: [{ w: 100, r: 8 }] }] },
      { id: 'l2', date: '2026-10-12', ex: [{ n: 'Bench Press', m: 'Chest', xid: 'bx', sets: [{ w: 95, r: 8 }] }] },
    ],
  }),
});
{
  // a date-only move is unsaved work too (date picker path)
  const c = app({ seed: twoLogSeed() });
  c.fireClick({ a: 'edit', id: 'l1' });
  c.fireChange({ id: 'dt', value: '2026-10-06' });
  ok('date-only move makes the edit draft dirty', c.api.draftHasData(c.api.getD()) === true);
  c.fireClick({ a: 'tab', t: 'history' });
  c.ctl.confirm = false;
  c.fireClick({ a: 'edit', id: 'l2' });
  eq('date-only move + cancel -> prompt asked', c.confirms.length, 1);
  eq('date-only move + cancel -> other workout not opened', c.api.getD().editId, 'l1');
  eq('date-only move + cancel -> moved date preserved', c.api.getD().date, '2026-10-06');
}
{
  // confirming discards the pending move and opens the chosen workout
  const c = app({ seed: twoLogSeed() });
  c.fireClick({ a: 'edit', id: 'l1' });
  c.fireChange({ id: 'dt', value: '2026-10-06' });
  c.fireClick({ a: 'tab', t: 'history' });
  c.ctl.confirm = true;
  c.fireClick({ a: 'edit', id: 'l2' });
  eq('date-only move + confirm -> prompt asked', c.confirms.length, 1);
  eq('date-only move + confirm -> other workout opens', c.api.getD().editId, 'l2');
  eq('date-only move + confirm -> other workout date loaded', c.api.getD().date, '2026-10-12');
}
{
  // reverting the date makes the draft clean again
  const c = app({ seed: twoLogSeed() });
  c.fireClick({ a: 'edit', id: 'l1' });
  c.fireChange({ id: 'dt', value: '2026-10-06' });
  ok('date-only move is dirty before revert', c.api.draftHasData(c.api.getD()) === true);
  c.fireChange({ id: 'dt', value: '2026-10-05' });
  ok('date reverted to baseline -> clean again', c.api.draftHasData(c.api.getD()) === false);
}
{
  // the weekday-chip path while editing must also mark the draft dirty
  const c = app({ seed: twoLogSeed() });
  c.fireClick({ a: 'edit', id: 'l1' });
  c.fireClick({ a: 'day', i: '1' }); // Monday 10-05 -> Tuesday 10-06
  eq('chip move while editing -> date changed', c.api.getD().date, '2026-10-06');
  ok('chip move while editing -> draft dirty', c.api.draftHasData(c.api.getD()) === true);
}
{
  // the date baseline and dirty state survive a reload
  const c = app({ seed: twoLogSeed() });
  c.fireClick({ a: 'edit', id: 'l1' });
  c.fireChange({ id: 'dt', value: '2026-10-06' });
  const c2 = app({ seed: { gym_data: c.store.get('gym_data'), gym_draft: c.store.get('gym_draft') } });
  eq('reload keeps moved date', c2.api.getD().date, '2026-10-06');
  eq('reload keeps date baseline', c2.api.getD().baseDate, '2026-10-05');
  ok('reload keeps date dirty', c2.api.draftHasData(c2.api.getD()) === true);
}
{
  // drafts from before baseDate existed upgrade on load without a false dirty
  const c0 = app({ seed: historySeed() });
  c0.fireClick({ a: 'edit', id: 'l1' });
  const legacy = JSON.parse(c0.store.get('gym_draft'));
  delete legacy.baseDate;
  const c = app({ seed: { gym_data: c0.store.get('gym_data'), gym_draft: JSON.stringify(legacy) }, now: '2026-10-05T12:00:00' });
  ok('legacy baseline draft loads clean', c.api.draftHasData(c.api.getD()) === false);
  eq('legacy baseline draft upgrades baseDate', c.api.getD().baseDate, c.api.getD().date);
  c.fireChange({ id: 'dt', value: '2026-10-04' });
  ok('upgraded legacy draft detects a date move', c.api.draftHasData(c.api.getD()) === true);
}

// =====================================================================
section('Date selector — future weekdays disabled, correct weekday mapping');
{
  const c = app({});
  const d = c.api.getD();
  ok('boots on today (Tue 13-10-2026)', d.date === '2026-10-13' && d.di === 1);
  const chips = c.dom.get('#v').innerHTML;
  ok('Wed chip (tomorrow) rendered disabled', chips.includes('data-i="2" disabled'));
  ok('Sun chip rendered disabled', chips.includes('data-i="6" disabled'));
  ok('Mon chip rendered enabled', !chips.includes('data-i="0" disabled'));
  ok('today chip not disabled', !chips.includes('data-i="1" disabled'));
  // defense-in-depth: clicking a future weekday does nothing even if the click fires
  const before = c.api.getD().date;
  c.fireClick({ a: 'day', i: '2' });
  eq('clicking Wed (tomorrow) leaves date unchanged', c.api.getD().date, before);
  // past weekday chip still works and never goes into the future
  c.fireClick({ a: 'day', i: '0' });
  eq('clicking Mon selects this week Monday', c.api.getD().date, '2026-10-12');
}
{
  // editing a past week: later weekdays of that week are still past -> selectable
  const log = { id: 'x', date: '2026-10-05', day: 'Monday', year: 2026, di: 0, name: 'A', ex: [{ n: 'Bench Press', m: 'Chest', xid: '', sets: [{ w: 60, r: 8 }] }] };
  const c = app({ seed: { gym_data: JSON.stringify({ plan: JSON.parse(DEFAULTS).plan, logs: [log] }) } });
  c.fireClick({ a: 'edit', id: 'x' });
  c.fireClick({ a: 'day', i: '2' });
  eq('editing past week -> Wed chip selects past Wed (10-07)', c.api.getD().date, '2026-10-07');
}

// =====================================================================
section('Bugs.md 12 — disabled future-day chips are visually distinct');
{
  const css = readFileSync(join(__dir, '..', 'css', 'style.css'), 'utf8');
  const rule = css.match(/\.chip:disabled\s*\{([^}]*)\}/);
  ok('chip disabled rule exists', !!rule);
  ok('disabled chips are dimmed', !!rule && /opacity\s*:\s*\.4\b/.test(rule[1]));
  ok('disabled chips show a not-allowed cursor', !!rule && /cursor\s*:\s*not-allowed\b/.test(rule[1]));
}

// =====================================================================
section('Bugs.md 13 — native controls follow the light/dark/system theme');
{
  const css = readFileSync(join(__dir, '..', 'css', 'style.css'), 'utf8');
  const rule = sel => css.match(new RegExp(sel + '\\s*\\{([^}]*)\\}'));
  const root = rule(':root');
  const light = rule(':root\\[data-theme="light"\\]');
  const dark = rule(':root\\[data-theme="dark"\\]');
  ok('system mode advertises light and dark native controls', !!root && /color-scheme\s*:\s*light dark\b/.test(root[1]));
  ok('light theme opts into light native controls', !!light && /color-scheme\s*:\s*light\b/.test(light[1]));
  ok('dark theme opts into dark native controls', !!dark && /color-scheme\s*:\s*dark\b/.test(dark[1]));
}

// =====================================================================
section('Draft rollover — reopening on a later day opens today, not the stale draft');
{
  // clean auto-created draft from Mon 12 Oct, reopened Tue 3 Nov
  const mon = app({ seed: { gym_data: DEFAULTS }, now: '2026-10-12T12:00:00' });
  eq('Mon boot creates a Mon draft', mon.api.getD().date, '2026-10-12');
  const tue = app({ seed: { gym_data: DEFAULTS, gym_draft: mon.store.get('gym_draft') }, now: '2026-11-03T12:00:00' });
  eq('clean stale draft rolls to today', tue.api.getD().date, '2026-11-03');
  eq('rollover uses today\'s weekday', tue.api.getD().di, 1);
  eq('rollover persists the new draft', JSON.parse(tue.store.get('gym_draft')).date, '2026-11-03');
  tue.fireClick({ a: 'day', i: '0' });
  eq('Mon chip after rollover selects this week Monday', tue.api.getD().date, '2026-11-02');
}
{
  // a workout entered after the rollover must be saved to today
  const mon = app({ seed: { gym_data: DEFAULTS }, now: '2026-10-12T12:00:00' });
  const tue = app({ seed: { gym_data: DEFAULTS, gym_draft: mon.store.get('gym_draft') }, now: '2026-11-03T12:00:00' });
  tue.fireInput({ dataset: { f: 'w', i: '0', j: '0' }, value: '60' });
  tue.fireInput({ dataset: { f: 'r', i: '0', j: '0' }, value: '8' });
  tue.fireInput({ dataset: { f: 'd', i: '0', j: '0' }, checked: true });
  tue.fireClick({ a: 'fin' });
  eq('workout after rollover saves to today', tue.api.getS().logs[0].date, '2026-11-03');
}
{
  // dirty drafts are not silently discarded; they are flagged with a Start today action
  const mon = app({ seed: { gym_data: DEFAULTS }, now: '2026-10-12T12:00:00' });
  mon.fireInput({ dataset: { f: 'r', i: '0', j: '0' }, value: '8' });
  const tue = app({ seed: { gym_data: DEFAULTS, gym_draft: mon.store.get('gym_draft') }, now: '2026-11-03T12:00:00' });
  eq('dirty stale draft keeps its date', tue.api.getD().date, '2026-10-12');
  ok('dirty stale draft is flagged', tue.dom.get('#v').innerHTML.includes('Unfinished workout from'));
  ok('flagged draft offers Start today', tue.dom.get('#v').innerHTML.includes('data-a="gotoday"'));
  tue.ctl.confirm = false;
  tue.fireClick({ a: 'gotoday' });
  eq('cancel keeps the unfinished workout', tue.api.getD().date, '2026-10-12');
  tue.ctl.confirm = true;
  tue.fireClick({ a: 'gotoday' });
  eq('confirm starts today', tue.api.getD().date, '2026-11-03');
  ok('start today clears the old edit link', !tue.api.getD().editId);
}
{
  // a past date chosen in this session is intentional, not a stale-draft warning
  const c = app({});
  c.fireClick({ a: 'day', i: '0' });
  ok('deliberate past-date draft is not flagged', !c.dom.get('#v').innerHTML.includes('Unfinished workout from'));
  c.fireInput({ dataset: { f: 'r', i: '0', j: '0' }, value: '8' });
  c.fireClick({ a: 'tab', t: 'today' });
  ok('entered data on a chosen past date is not flagged', !c.dom.get('#v').innerHTML.includes('Unfinished workout from'));
}
{
  // a clean edit session from an earlier day also rolls forward
  const seed = { gym_data: JSON.stringify({ plan: NAME_PLAN, logs: [mondayLog()] }) };
  const mon = app({ seed, now: '2026-10-12T12:00:00' });
  eq('opening a saved workout creates an untouched edit draft', mon.api.getD().editId, 'a1');
  const tue = app({ seed: { ...seed, gym_draft: mon.store.get('gym_draft') }, now: '2026-11-03T12:00:00' });
  eq('clean stale edit draft rolls to today', tue.api.getD().date, '2026-11-03');
  ok('rollover leaves edit mode', !tue.api.getD().editId);
}
{
  // a dirty edit session is preserved with its edit link
  const seed = { gym_data: JSON.stringify({ plan: NAME_PLAN, logs: [mondayLog()] }) };
  const mon = app({ seed, now: '2026-10-12T12:00:00' });
  mon.fireInput({ dataset: { f: 'r', i: '0', j: '0' }, value: '9' });
  const tue = app({ seed: { ...seed, gym_draft: mon.store.get('gym_draft') }, now: '2026-11-03T12:00:00' });
  eq('dirty edit draft keeps its date', tue.api.getD().date, '2026-10-12');
  eq('dirty edit draft keeps its edit link', tue.api.getD().editId, 'a1');
  ok('dirty edit draft is flagged', tue.dom.get('#v').innerHTML.includes('Unfinished workout from'));
}

// =====================================================================
section('Bug 7 — routine identity is synchronized with the date');
{
  const c = app({});
  c.fireClick({ a: 'day', i: '0' });
  eq('chip -> di == weekday of date', c.api.getD().di, 0);
  ok('chip -> date is a Monday', c.api.getD().date === '2026-10-12');
  // record a completed set and save
  c.fireInput({ dataset: { f: 'w', i: '0', j: '0' }, value: '60' });
  c.fireInput({ dataset: { f: 'r', i: '0', j: '0' }, value: '8' });
  c.fireInput({ dataset: { f: 'd', i: '0', j: '0' }, checked: true });
  c.fireClick({ a: 'fin' });
  const rec = c.api.getS().logs[0];
  eq('record date', rec.date, '2026-10-12');
  eq('record day == weekday(rec.date)', rec.day, 'Monday');
  eq('record di == weekday(rec.date)', rec.di, 0);
  ok('record name matches routine', rec.name === c.api.getS().plan[0].name);
}
{
  const c = app({});
  c.fireChange({ id: 'dt', value: '2026-10-06' }); // a Tuesday
  eq('date change -> di follows weekday', c.api.getD().di, 1);
  ok('future dates blocked', c.api.getD().date === '2026-10-06');
  c.fireChange({ id: 'dt', value: '2099-01-01' });
  ok('future date rejected with message', c.alerts.some(a => a.includes('Future dates')));
  eq('date unchanged after future rejection', c.api.getD().date, '2026-10-06');
}

// =====================================================================
section('Bug 8 — exercise identity is stable; no cross-exercise history');
{
  const plan = JSON.parse(DEFAULTS).plan;
  plan[0].ex = [{ id: 'sp1', n: 'Shoulder Press', m: 'Shoulders', smin: 3, smax: 4, rmin: 8, rmax: 12 }];
  plan[1].ex = [{ id: 'sp2', n: 'Shoulder Press', m: 'Shoulders', smin: 3, smax: 4, rmin: 8, rmax: 12 }];
  const logs = [
    { id: 'l1', date: '2026-10-05', year: 2026, day: 'Monday', di: 0, name: 'A', ex: [{ n: 'Shoulder Press', m: 'Shoulders', xid: '', sets: [{ w: 100, r: 8 }] }] },
    { id: 'l2', date: '2026-10-06', year: 2026, day: 'Tuesday', di: 1, name: 'B', ex: [{ n: 'Shoulder Press', m: 'Shoulders', xid: '', sets: [{ w: 200, r: 8 }] }] },
  ];
  const c = app({ seed: { gym_data: JSON.stringify({ plan, logs }) } });
  // ambiguous legacy names stay unassigned -> no wrong prefill
  ok('ambiguous legacy name not backfilled', c.api.getS().logs.every(l => l.ex[0].xid === ''));
  // fresh draft on a free Monday (28 Sep 2026): legacy history is ambiguous -> no prefill
  c.fireClick({ a: 'tab', t: 'today' });
  c.fireChange({ id: 'dt', value: '2026-09-28' });
  eq('legacy ambiguous -> no prefill', String(c.api.getD().ex[0].sets[0].w), '');
  // record a set, save -> gets xid sp1
  c.fireInput({ dataset: { f: 'w', i: '0', j: '0' }, value: '120' });
  c.fireInput({ dataset: { f: 'r', i: '0', j: '0' }, value: '8' });
  c.fireInput({ dataset: { f: 'd', i: '0', j: '0' }, checked: true });
  c.fireClick({ a: 'fin' });
  eq('saved exercise carries xid', c.api.getS().logs.find(l => l.id !== 'l1' && l.id !== 'l2').ex[0].xid, 'sp1');
  // fresh draft on a free Tuesday: day 1 must NOT see day 0's history
  c.fireClick({ a: 'tab', t: 'today' });
  c.fireChange({ id: 'dt', value: '2026-09-29' });
  eq('day-1 has no cross-exercise prefill', String(c.api.getD().ex[0].sets[0].w), '');
  // fresh draft on a free Monday AFTER the 09-28 save: prefills from sp1 only
  c.fireChange({ id: 'dt', value: '2026-10-12' });
  eq('day-0 prefill uses its own history (120)', String(c.api.getD().ex[0].sets[0].w), '120');
  // rename keeps identity: rename plan day 0 exercise via routine tab
  c.fireClick({ a: 'tab', t: 'routine' });
  c.fireClick({ a: 'pd', i: '0' });
  c.fireInput({ dataset: { p: 'n', i: '0' }, value: 'S Press' });
  eq('rename preserved id', c.api.getS().plan[0].ex[0].n, 'S Press');
  // renamed exercise still prefills from same id
  c.fireClick({ a: 'tab', t: 'today' });
  c.fireChange({ id: 'dt', value: '2026-10-13' }); // fresh Tuesday draft
  c.fireChange({ id: 'dt', value: '2026-10-12' }); // fresh Monday draft again
  eq('renamed exercise still prefills from same id', String(c.api.getD().ex[0].sets[0].w), '120');
}

// =====================================================================
section('Bug 9 — storage write failures are surfaced');
{
  const seed = { gym_data: DEFAULTS, gym_draft: DIRTY_DRAFT };
  const beforeLogs = seed.gym_data;
  const c = app({ seed, failWrites: true });
  c.fireClick({ a: 'fin' });
  ok('failure surfaced to user', c.alerts.some(a => a.includes('Could not save')));
  eq('no fake navigation to history', c.api.getTab(), 'today');
  ok('draft preserved after failure', c.api.getD() !== null);
  eq('log not written to storage', c.store.get('gym_data'), beforeLogs);
  ok('draft storage not destroyed', c.store.get('gym_draft') === DIRTY_DRAFT);
}

// =====================================================================
section('Regression — normal create / edit / history / volume');
{
  const c = app({});
  c.fireInput({ dataset: { f: 'w', i: '0', j: '0' }, value: '60' });
  c.fireInput({ dataset: { f: 'r', i: '0', j: '0' }, value: '8' });
  c.fireInput({ dataset: { f: 'd', i: '0', j: '0' }, checked: true });
  c.fireInput({ dataset: { f: 'w', i: '1', j: '0' }, value: '20' });
  c.fireInput({ dataset: { f: 'r', i: '1', j: '0' }, value: '12' });
  c.fireInput({ dataset: { f: 'd', i: '1', j: '0' }, checked: true });
  c.fireClick({ a: 'fin' });
  const one = c.api.getS().logs[0];
  ok('two exercises saved', one.ex.length === 2);
  eq('volume = sum(w*r)', one.ex.reduce((a, e) => a + e.sets.reduce((b, s) => b + s.w * s.r, 0), 0), 60 * 8 + 20 * 12);
  c.fireClick({ a: 'tab', t: 'history' }); // renders without throwing
  c.fireClick({ a: 'tab', t: 'progress' });
  c.fireClick({ a: 'tab', t: 'routine' });
  c.fireInput({ dataset: { p: 'n', i: '0' }, value: 'Bench Press Wide' });
  ok('routine rename persists id', !!c.api.getS().plan[0].ex[0].id);
}

// =====================================================================
section('Unit — weekday-to-date mapping across boundaries (no future clamp)');
{
  const c = app({});
  const f = (i, ref) => c.api.dateForWeekday(String(i), ref);
  // today (Tue 13-10-2026): same-week mapping, Wed stays Wed (future, not clamped back a week)
  eq('Tue -> Mon same week', f(0, '2026-10-13'), '2026-10-12');
  eq('Tue -> today', f(1, '2026-10-13'), '2026-10-13');
  eq('Tue -> Wed same week (not previous week)', f(2, '2026-10-13'), '2026-10-14');
  eq('Tue -> Sun same week', f(6, '2026-10-13'), '2026-10-18');
  // month boundary: Sun 01-03-2026 rolls back into February
  eq('Sun 1 Mar -> Mon in Feb', f(0, '2026-03-01'), '2026-02-23');
  eq('Sun 1 Mar -> Sat of same week', f(5, '2026-03-01'), '2026-02-28');
  eq('Sun 1 Mar -> Sun', f(6, '2026-03-01'), '2026-03-01');
  // leap-year February (Thu 29-02-2024)
  eq('leap Thu 29 Feb -> Mon', f(0, '2024-02-29'), '2024-02-26');
  eq('leap Thu 29 Feb -> Wed', f(2, '2024-02-29'), '2024-02-28');
  // year boundary: Thu 01-01-2026 rolls into 2025
  eq('Thu 1 Jan -> Wed in prev year', f(2, '2026-01-01'), '2025-12-31');
  eq('Thu 1 Jan -> Mon in prev year', f(0, '2026-01-01'), '2025-12-29');
  eq('Thu 1 Jan -> Thu', f(3, '2026-01-01'), '2026-01-01');
  eq('isDate validates format', c.api.isDate('2026-02-30'), false);
  eq('isCompleted rule', [c.api.isCompleted({ d: true, r: 5 }), c.api.isCompleted({ d: false, r: 5 }), c.api.isCompleted({ d: true, r: 0 }), c.api.isCompleted(null)], [true, false, false, false]);
}

// =====================================================================
section('Fix 1 — failed save restores every workout (no stale-index corruption)');
{
  const plan = JSON.parse(DEFAULTS).plan;
  const logs = [
    { id: 'A', date: '2026-10-05', day: 'Monday', year: 2026, di: 0, name: 'RA', ex: [{ n: 'Squat', m: 'Legs', xid: '', sets: [{ w: 70, r: 5 }] }] },
    { id: 'B', date: '2026-10-06', day: 'Tuesday', year: 2026, di: 1, name: 'RB', ex: [{ n: 'Bench Press', m: 'Chest', xid: '', sets: [{ w: 80, r: 5 }] }] },
  ];
  const c = app({ seed: { gym_data: JSON.stringify({ plan, logs }) }, failWrites: true });
  c.fireClick({ a: 'edit', id: 'A' });
  c.fireChange({ id: 'dt', value: '2026-10-12' }); // past, but sorts AFTER B
  c.fireClick({ a: 'fin' });
  eq('rollback keeps both workouts', c.api.getS().logs.map(l => l.id).sort(), ['A', 'B']);
  eq('edited workout keeps its original date after rollback', c.api.getS().logs.find(l => l.id === 'A').date, '2026-10-05');
  ok('other workout untouched after rollback', c.api.getS().logs.find(l => l.id === 'B').date === '2026-10-06');
  ok('storage failure surfaced on finish', c.alerts.some(a => a.includes('Could not save')));
}

// =====================================================================
section('Fix 2 — storage write failures are surfaced for routine and draft edits');
{
  const c = app({ seed: { gym_data: DEFAULTS, gym_draft: DIRTY_DRAFT }, failWrites: true });
  eq('no warning before any failing edit', c.alerts.length, 0);
  c.fireClick({ a: 'tab', t: 'routine' });
  c.fireClick({ a: 'padd' });
  ok('adding a routine exercise warns on failure', c.alerts.some(a => /could not be saved/i.test(a)));
  eq('warning is throttled to once', c.alerts.length, 1);
}
{
  const c = app({ seed: { gym_data: DEFAULTS, gym_draft: DIRTY_DRAFT }, failWrites: true });
  c.fireInput({ dataset: { f: 'r', i: '0', j: '0' }, value: '5' });
  ok('draft edit warns on failure', c.alerts.some(a => /could not be saved/i.test(a)));
  eq('draft edit still applied in memory', c.api.getD().ex[0].sets[0].r, '5');
}
{
  const c = app({ seed: { gym_data: DEFAULTS, gym_draft: DIRTY_DRAFT }, failWrites: true });
  c.fireClick({ a: 'fin' });
  eq('fin failure shows exactly one alert', c.alerts.length, 1);
  ok('fin failure message is the specific one', c.alerts[0].includes('Could not save'));
}

// =====================================================================
section('Fix 3 — progression handles exercises with no completed sets');
{
  const plan = JSON.parse(DEFAULTS).plan;
  const logs = [{ id: 'z', date: '2026-10-05', day: 'Monday', year: 2026, di: 0, name: 'X', ex: [{ n: 'Ghost', m: '', xid: '', sets: [] }] }];
  const c = app({ seed: { gym_data: JSON.stringify({ plan, logs }) } });
  c.fireClick({ a: 'tab', t: 'progress' });
  const html = c.dom.get('#v').innerHTML;
  ok('no -Infinity rendered', !html.includes('-Infinity'));
  ok('no NaN rendered', !html.includes('NaN'));
  ok('friendly empty message shown', html.includes('Save a workout to see progress.'));
}
{
  const plan = JSON.parse(DEFAULTS).plan;
  const logs = [{ id: 'z', date: '2026-10-05', day: 'Monday', year: 2026, di: 0, name: 'X', ex: [{ n: 'Ghost', m: '', sets: [] }, { n: 'Squat', m: 'Legs', sets: [{ w: 100, r: 5 }] }] }];
  const c = app({ seed: { gym_data: JSON.stringify({ plan, logs }) } });
  c.fireClick({ a: 'tab', t: 'progress' });
  const html = c.dom.get('#v').innerHTML;
  ok('valid exercise still charts', html.includes('100') && !html.includes('-Infinity'));
  ok('set-less exercise filtered from selector', !html.includes('Ghost'));
}

// =====================================================================
section('Bug 3 — progression groups by stable identity (xid), not name');
{
  const plan = JSON.parse(DEFAULTS).plan;
  plan[0].ex = [{ id: 'bp1', n: 'Barbell Bench Press', m: 'Chest', smin: 3, smax: 4, rmin: 6, rmax: 10 }];
  const logs = [
    { id: 'l1', date: '2026-10-05', day: 'Monday', year: 2026, di: 0, name: 'A', ex: [{ n: 'Bench Press', m: 'Chest', xid: 'bp1', sets: [{ w: 60, r: 8 }] }] },
    { id: 'l2', date: '2026-10-12', day: 'Monday', year: 2026, di: 0, name: 'A', ex: [{ n: 'Barbell Bench Press', m: 'Chest', xid: 'bp1', sets: [{ w: 70, r: 8 }] }] },
  ];
  const c = app({ seed: { gym_data: JSON.stringify({ plan, logs }) } });
  c.fireClick({ a: 'tab', t: 'progress' });
  const html = c.dom.get('#v').innerHTML;
  const opts = [...html.matchAll(/<option[^>]*value="([^"]*)"[^>]*>([^<]*)<\/option>/g)];
  eq('renamed exercise is a single progression entry', opts.length, 1);
  ok('entry uses the current routine name', opts[0] && opts[0][2] === 'Barbell Bench Press', opts.map(o => o[2]));
  ok('both sessions charted together', html.includes('60') && html.includes('70'));
  ok('stats report two sessions', /<b>2<\/b>/.test(html));
}
{
  const plan = JSON.parse(DEFAULTS).plan;
  plan[0].ex = [{ id: 'sp1', n: 'Shoulder Press', m: 'Shoulders', smin: 3, smax: 4, rmin: 8, rmax: 12 }];
  plan[1].ex = [{ id: 'sp2', n: 'Shoulder Press', m: 'Shoulders', smin: 3, smax: 4, rmin: 8, rmax: 12 }];
  const logs = [
    { id: 'l1', date: '2026-10-05', day: 'Monday', year: 2026, di: 0, name: 'A', ex: [{ n: 'Shoulder Press', m: 'Shoulders', xid: 'sp1', sets: [{ w: 100, r: 8 }] }] },
    { id: 'l2', date: '2026-10-06', day: 'Tuesday', year: 2026, di: 1, name: 'B', ex: [{ n: 'Shoulder Press', m: 'Shoulders', xid: 'sp2', sets: [{ w: 200, r: 8 }] }] },
  ];
  const c = app({ seed: { gym_data: JSON.stringify({ plan, logs }) } });
  c.fireClick({ a: 'tab', t: 'progress' });
  const html = c.dom.get('#v').innerHTML;
  const opts = [...html.matchAll(/<option[^>]*value="([^"]*)"[^>]*>([^<]*)<\/option>/g)];
  eq('distinct identities stay separate', opts.length, 2);
  ok('separate identities have distinct labels', new Set(opts.map(o => o[2])).size === 2, opts.map(o => o[2]));
}
{
  const plan = JSON.parse(DEFAULTS).plan;
  const logs = [
    { id: 'l1', date: '2026-10-05', day: 'Monday', year: 2026, di: 0, name: 'A', ex: [{ n: 'Legacy Lift', m: '', xid: '', sets: [{ w: 50, r: 5 }] }] },
    { id: 'l2', date: '2026-10-12', day: 'Monday', year: 2026, di: 0, name: 'A', ex: [{ n: 'Legacy Lift', m: '', xid: '', sets: [{ w: 55, r: 5 }] }] },
  ];
  const c = app({ seed: { gym_data: JSON.stringify({ plan, logs }) } });
  c.fireClick({ a: 'tab', t: 'progress' });
  const opts = [...c.dom.get('#v').innerHTML.matchAll(/<option[^>]*value="([^"]*)"[^>]*>([^<]*)<\/option>/g)];
  eq('legacy logs without xid still group by name', opts.length, 1);
}

// =====================================================================
section('Bug 2 — add exercise reuses routine identity and bounded prefill');
const addExercise = (c, name) => {
  c.dom.set('#nx', makeEl({ id: 'nx', value: name }));
  c.fireClick({ a: 'addx' });
};
const cableFlyPlan = () => ({
  0: { name: 'Push', ex: [{ id: 'cf', n: 'Cable Fly', m: 'Chest', smin: 4, smax: 5, rmin: 10, rmax: 15 }] },
  1: { name: '', ex: [] },
});
const cableFlyLogs = [
  { id: 'l1', date: '2026-09-21', day: 'Monday', year: 2026, di: 0, name: 'Push', ex: [{ n: 'Cable Fly', m: 'Chest', xid: 'cf', sets: [{ w: 10, r: 12 }] }] },
  { id: 'l2', date: '2026-10-05', day: 'Monday', year: 2026, di: 0, name: 'Push', ex: [{ n: 'Cable Fly', m: 'Chest', xid: 'cf', sets: [{ w: 25, r: 12 }] }] },
  { id: 'l3', date: '2026-10-12', day: 'Monday', year: 2026, di: 0, name: 'Push', ex: [{ n: 'Cable Fly', m: 'Chest', xid: 'cf', sets: [{ w: 30, r: 12 }] }] },
];
{
  // known routine exercise: reuse identity, muscle, and ranges, and prefill only
  // from workouts before the draft date (Tue 29 Sep sees the 21 Sep session only)
  const c = app({ seed: { gym_data: JSON.stringify({ plan: cableFlyPlan(), logs: cableFlyLogs }) } });
  c.fireChange({ id: 'dt', value: '2026-09-29' });
  addExercise(c, 'Cable Fly');
  const added = c.api.getD().ex.at(-1);
  eq('known routine exercise reuses xid', added.xid, 'cf');
  eq('known routine exercise reuses muscle', added.m, 'Chest');
  eq('known routine exercise reuses ranges', [added.smin, added.smax, added.rmin, added.rmax], [4, 5, 10, 15]);
  eq('prefill bounded by selected date (21 Sep, not 12 Oct)', String(added.sets[0].w), '10');
}
{
  // the added exercise saves with the routine identity, so Progress stays merged
  const c = app({ seed: { gym_data: JSON.stringify({ plan: cableFlyPlan(), logs: cableFlyLogs }) } });
  addExercise(c, 'Cable Fly');
  const i = String(c.api.getD().ex.length - 1);
  c.fireInput({ dataset: { f: 'r', i, j: '0' }, value: '8' });
  c.fireInput({ dataset: { f: 'd', i, j: '0' }, checked: true });
  c.fireClick({ a: 'fin' });
  const rec = c.api.getS().logs.find(l => l.date === '2026-10-13');
  ok('added exercise saved', !!rec && rec.ex.length === 1);
  eq('saved added exercise keeps routine xid', rec.ex[0].xid, 'cf');
  c.fireClick({ a: 'tab', t: 'progress' });
  const opts = [...c.dom.get('#v').innerHTML.matchAll(/<option[^>]*value="([^"]*)"[^>]*>([^<]*)<\/option>/g)];
  eq('no temporary duplicate Progress entry', opts.filter(o => o[2].startsWith('Cable Fly')).length, 1);
}
{
  // name-based exercise (not in the routine): stays identity-free but still
  // must not prefill from a workout on or after the selected date
  const plan = { 0: { name: '', ex: [] }, 1: { name: '', ex: [] } };
  const logs = [
    { id: 'h1', date: '2026-09-21', day: 'Monday', year: 2026, di: 0, name: '', ex: [{ n: 'Face Pull', m: 'Rear Delts', xid: '', sets: [{ w: 10, r: 15 }] }] },
    { id: 'h2', date: '2026-10-12', day: 'Monday', year: 2026, di: 0, name: '', ex: [{ n: 'Face Pull', m: 'Rear Delts', xid: '', sets: [{ w: 30, r: 15 }] }] },
  ];
  const c = app({ seed: { gym_data: JSON.stringify({ plan, logs }) } });
  c.fireChange({ id: 'dt', value: '2026-09-29' });
  addExercise(c, 'Face Pull');
  const added = c.api.getD().ex.at(-1);
  eq('name-based exercise stays identity-free', added.xid, '');
  eq('name-based prefill bounded by selected date (21 Sep, not 12 Oct)', String(added.sets[0].w), '10');
}
{
  // ambiguous routine names must never be guessed
  const plan = {
    0: {
      name: 'Push', ex: [
        { id: 'bp1', n: 'Bench Press', m: 'Chest', smin: 3, smax: 4, rmin: 6, rmax: 10 },
        { id: 'bp2', n: 'Bench Press', m: 'Chest', smin: 3, smax: 4, rmin: 6, rmax: 10 },
      ]
    },
    1: { name: '', ex: [] },
  };
  const c = app({ seed: { gym_data: JSON.stringify({ plan, logs: [] }) } });
  addExercise(c, 'Bench Press');
  eq('ambiguous routine name stays name-based', c.api.getD().ex.at(-1).xid, '');
}

// =====================================================================
section('Bugs.md 8 — target labels show only configured ranges');
const targetOf = html => (html.match(/<div class="mu">([^<]*)<\/div>/) || [])[1] || '';
const todayHTML = ranges => app({
  seed: {
    gym_data: JSON.stringify({
      plan: { 1: { name: 'Push', ex: [{ id: 'e1', n: 'Press', m: 'Chest', ...ranges }] } },
      logs: []
    })
  }
}).dom.get('#v').innerHTML;
eq('sets only', targetOf(todayHTML({ smin: 3, smax: 4, rmin: '', rmax: '' })), '3-4 sets');
eq('reps only', targetOf(todayHTML({ smin: '', smax: '', rmin: 6, rmax: 10 })), '6-10 reps');
eq('full ranges', targetOf(todayHTML({ smin: 3, smax: 4, rmin: 6, rmax: 10 })), '3-4 sets × 6-10 reps');
eq('min without max', targetOf(todayHTML({ smin: 3, smax: '', rmin: '', rmax: '' })), '3+ sets');
eq('max without min', targetOf(todayHTML({ smin: '', smax: 4, rmin: '', rmax: '' })), '≤4 sets');
eq('no ranges', targetOf(todayHTML({ smin: '', smax: '', rmin: '', rmax: '' })), 'Extra exercise');
{
  // Unknown custom exercise: addx passes empty ranges, so no targets appear.
  const c = app({ seed: { gym_data: JSON.stringify({ plan: { 1: { name: '', ex: [] } }, logs: [] }) } });
  addExercise(c, 'Cable Fly');
  eq('custom exercise without targets', targetOf(c.dom.get('#v').innerHTML), 'Extra exercise');
}

// =====================================================================
section('Bugs.md 9 — routine names and ranges are validated');
const rangePlan = ranges => ({
  plan: { 1: { name: 'Push', ex: [{ id: 'e1', n: 'Press', m: 'Chest', ...ranges }] } },
  logs: []
});
const rangedApp = ranges => app({ seed: { gym_data: JSON.stringify(rangePlan(ranges)) } });
const planEx = c => c.api.getS().plan[1].ex[0];

{
  const c = rangedApp({ smin: 3, smax: 4, rmin: 6, rmax: 10 });
  c.fireInput({ dataset: { p: 'smin', i: '0' }, value: '-5' });
  eq('negative set minimum becomes blank', planEx(c).smin, '');
}
{
  const c = rangedApp({ smin: 3, smax: 4, rmin: 6, rmax: 10 });
  c.fireInput({ dataset: { p: 'smin', i: '0' }, value: '0' });
  eq('zero set minimum becomes blank', planEx(c).smin, '');
}
{
  const c = rangedApp({ smin: 3, smax: 4, rmin: 6, rmax: 10 });
  c.fireInput({ dataset: { p: 'rmin', i: '0' }, value: '6.9' });
  eq('decimal rep minimum floors to an integer', planEx(c).rmin, 6);
}
{
  const c = rangedApp({ smin: 3, smax: 4, rmin: 6, rmax: 10 });
  c.fireInput({ dataset: { p: 'rmax', i: '0' }, value: '' });
  eq('blank maximum stays blank', planEx(c).rmax, '');
}
{
  const c = rangedApp({ smin: 3, smax: 4, rmin: 6, rmax: 10 });
  c.fireChange({ dataset: { p: 'smax', i: '0' }, value: '2' });
  eq('editing set max below min lowers min', [planEx(c).smin, planEx(c).smax], [2, 2]);
}
{
  const c = rangedApp({ smin: 3, smax: 4, rmin: 6, rmax: 10 });
  c.fireChange({ dataset: { p: 'smin', i: '0' }, value: '8' });
  eq('editing set min above max raises max', [planEx(c).smin, planEx(c).smax], [8, 8]);
}
{
  const c = rangedApp({ smin: 3, smax: 4, rmin: 6, rmax: 10 });
  c.fireChange({ dataset: { p: 'rmax', i: '0' }, value: '5' });
  eq('editing rep max below min lowers min', [planEx(c).rmin, planEx(c).rmax], [5, 5]);
}
{
  const c = rangedApp({ smin: 3, smax: 4, rmin: 6, rmax: 10 });
  c.fireChange({ dataset: { p: 'smin', i: '0' }, value: '3' });
  eq('valid ranges are unchanged', [planEx(c).smin, planEx(c).smax, planEx(c).rmin, planEx(c).rmax], [3, 4, 6, 10]);
}
{
  const c = app({ seed: { gym_data: JSON.stringify(rangePlan({ smin: 8, smax: 4, rmin: -2, rmax: 0 })) } });
  const e = planEx(c);
  eq('boot raises max to min', [e.smin, e.smax], [8, 8]);
  eq('boot drops negative and zero reps', [e.rmin, e.rmax], ['', '']);
}
{
  const c = app({ seed: { gym_data: DEFAULTS } });
  c.ctl.prompt = JSON.stringify({ plan: { 1: { name: 'Push', ex: [{ id: 'e2', n: 'Press', m: 'Chest', smin: 5, smax: 2, rmin: 8, rmax: 4 }] } }, logs: [] });
  c.fireClick({ a: 'rs' });
  const e = c.api.getS().plan[1].ex[0];
  eq('restore raises set max to min', [e.smin, e.smax], [5, 5]);
  eq('restore raises rep max to min', [e.rmin, e.rmax], [8, 8]);
}
{
  const c = app({});
  c.fireClick({ a: 'tab', t: 'routine' });
  const html = c.dom.get('#v').innerHTML;
  for (const k of ['smin', 'smax', 'rmin', 'rmax']) {
    const re = new RegExp(`<input type="number" min="1" step="1" data-p="${k}"`);
    ok(`${k} input enforces min 1 and integer steps`, re.test(html));
  }
}
{
  const c = app({ seed: { gym_data: JSON.stringify({ plan: { 1: { name: 'Push', ex: [{ id: 'bn', n: '   ', m: 'Chest', smin: 3, smax: 4, rmin: 6, rmax: 10 }] } }, logs: [] }) } });
  c.fireInput({ dataset: { f: 'r', i: '0', j: '0' }, value: '8' });
  c.fireInput({ dataset: { f: 'd', i: '0', j: '0' }, checked: true });
  c.fireClick({ a: 'fin' });
  eq('blank-named exercise with completed sets is not saved', c.api.getS().logs.length, 0);
  ok('finish explains the blank name', c.alerts.some(a => /name every exercise/i.test(a)));
}
{
  const c = app({
    seed: {
      gym_data: JSON.stringify({
        plan: {
          1: {
            name: 'Push', ex: [
              { id: 'bn', n: '', m: 'Chest', smin: 3, smax: 4, rmin: 6, rmax: 10 },
              { id: 'ok', n: 'Press', m: 'Chest', smin: 3, smax: 4, rmin: 6, rmax: 10 }
            ]
          }
        }, logs: []
      })
    }
  });
  c.fireInput({ dataset: { f: 'r', i: '1', j: '0' }, value: '8' });
  c.fireInput({ dataset: { f: 'd', i: '1', j: '0' }, checked: true });
  c.fireClick({ a: 'fin' });
  eq('blank row without completed sets does not block save', c.api.getS().logs.length, 1);
  eq('only the named exercise is saved', c.api.getS().logs[0].ex.map(e => e.n), ['Press']);
}

// =====================================================================
section('Bug 3 — negative weights are clamped; zero and decimals stay valid');

// Finish the first set of today's first exercise with the given weight/reps.
const finishSet = (weight, reps, done = true) => {
  const c = app({});
  c.fireInput({ dataset: { f: 'w', i: '0', j: '0' }, value: weight });
  c.fireInput({ dataset: { f: 'r', i: '0', j: '0' }, value: reps });
  c.fireInput({ dataset: { f: 'd', i: '0', j: '0' }, checked: done });
  c.fireClick({ a: 'fin' });
  return c;
};

{
  const c = app({});
  const html = c.dom.get('#v').innerHTML;
  ok('weight input enforces min 0 and decimal steps', html.includes('inputmode="decimal" min="0" step="any"'));
  ok('reps input enforces min 1 integer steps', html.includes('inputmode="numeric" min="1" step="1"'));
}
{
  const c = finishSet('-50', '8');
  const saved = c.api.getS().logs[0].ex[0].sets[0];
  eq('negative weight is clamped to 0 on save', saved.w, 0);
}
{
  const c = finishSet('62.5', '8');
  const saved = c.api.getS().logs[0].ex[0].sets[0];
  eq('decimal weight is preserved', saved.w, 62.5);
}
{
  const c = finishSet('0', '8');
  const saved = c.api.getS().logs[0].ex[0].sets[0];
  ok('zero weight remains valid', saved.w === 0 && saved.r === 8);
}
{
  // isCompleted already requires reps > 0, so a negative-rep set must not save
  const c = finishSet('50', '-5');
  eq('negative reps do not count as completed', c.api.getS().logs.length, 0);
  ok('negative reps produce the expected message', c.alerts.some(a => a.includes('at least one set')));
}
{
  const c = finishSet('50', '8.9');
  const saved = c.api.getS().logs[0].ex[0].sets[0];
  eq('decimal reps are stored as integers', saved.r, 8);
}

// =====================================================================
section('Bug 4 — duplicate workout and exercise IDs are repaired');

const duplicateLogs = () => [
  { id: 'dup', date: '2026-10-05', day: 'Monday', year: 2026, di: 0, name: 'Monday', ex: [{ n: 'Bench Press', m: 'Chest', xid: '', sets: [{ w: 60, r: 8 }] }] },
  { id: 'dup', date: '2026-10-06', day: 'Tuesday', year: 2026, di: 1, name: 'Tuesday', ex: [{ n: 'Lat Pulldown', m: 'Back', xid: '', sets: [{ w: 40, r: 10 }] }] },
];
const duplicateData = () => ({ plan: JSON.parse(DEFAULTS).plan, logs: duplicateLogs() });

{
  const c = app({ seed: { gym_data: JSON.stringify(duplicateData()) } });
  const logs = c.api.getS().logs;
  eq('duplicate workout IDs are repaired on boot', new Set(logs.map(l => l.id)).size, 2);
  eq('both duplicate workouts are kept', logs.length, 2);
  eq('the oldest duplicate keeps its ID', logs[0].id, 'dup');
  ok('the newer duplicate gets a new ID', logs[1].id !== 'dup');
}
{
  const c = app({ seed: { gym_data: DEFAULTS } });
  c.ctl.prompt = JSON.stringify(duplicateData());
  c.fireClick({ a: 'rs' });
  const logs = c.api.getS().logs;
  eq('duplicate workout IDs are repaired on restore', new Set(logs.map(l => l.id)).size, 2);
  ok('restore still reports success', c.alerts.some(a => a.includes('Backup restored')));
}
{
  const c = app({ seed: { gym_data: JSON.stringify(duplicateData()) } });
  const [first, second] = c.api.getS().logs;
  c.fireClick({ a: 'edit', id: second.id });
  eq('Edit opens the clicked duplicate workout', c.api.getD().date, second.date);
  eq('Edit loads the clicked workout exercises', c.api.getD().ex[0].n, second.ex[0].n);
  c.fireClick({ a: 'edit', id: first.id });
  eq('Edit can open the other duplicate workout too', c.api.getD().date, first.date);
}
{
  const c = app({ seed: { gym_data: JSON.stringify(duplicateData()) } });
  const [first, second] = c.api.getS().logs;
  c.fireClick({ a: 'dl', id: second.id });
  eq('Delete removes only the selected duplicate', c.api.getS().logs.map(l => l.id), [first.id]);
  eq('the other duplicate workout is unchanged', c.api.getS().logs[0].date, first.date);
}
{
  const c = app({ seed: { gym_data: JSON.stringify(duplicateData()) } });
  const [first, second] = c.api.getS().logs;
  c.fireClick({ a: 'edit', id: second.id });
  c.fireClick({ a: 'fin' });
  const logs = c.api.getS().logs;
  eq('finishing one duplicate keeps both workouts', logs.length, 2);
  eq('finishing one duplicate leaves the other unchanged', logs.find(l => l.id === first.id).date, first.date);
}
{
  const logs = [
    { id: 'a', date: '2026-10-05', day: 'Monday', year: 2026, di: 0, name: 'A', ex: [{ n: 'Squat', m: 'Legs', xid: '', sets: [{ w: 80, r: 5 }] }] },
    { id: 'b', date: '2026-10-06', day: 'Tuesday', year: 2026, di: 1, name: 'B', ex: [{ n: 'Bench Press', m: 'Chest', xid: '', sets: [{ w: 60, r: 8 }] }] },
  ];
  const c = app({ seed: { gym_data: JSON.stringify({ plan: JSON.parse(DEFAULTS).plan, logs }) } });
  eq('unique workout IDs are left unchanged', c.api.getS().logs.map(l => l.id), ['a', 'b']);
}

const duplicatePlan = () => {
  const plan = JSON.parse(DEFAULTS).plan;
  plan[0] = {
    name: 'Push', ex: [
      { id: 'pid', n: 'Bench Press', m: 'Chest', smin: 3, smax: 4, rmin: 6, rmax: 10 },
      { id: 'pid', n: 'Incline DB Press', m: 'Chest', smin: 3, smax: 3, rmin: 8, rmax: 12 },
    ]
  };
  return plan;
};
const duplicatePlanLogs = (names = ['Bench Press', 'Incline DB Press'], muscles = ['Chest', 'Chest']) => [{
  id: 'l1', date: '2026-10-05', day: 'Monday', year: 2026, di: 0, name: 'Push', ex: [
    { n: names[0], m: muscles[0], xid: 'pid', sets: [{ w: 60, r: 8 }] },
    { n: names[1], m: muscles[1], xid: 'pid', sets: [{ w: 24, r: 10 }] },
  ],
}];
{
  const c = app({ seed: { gym_data: JSON.stringify({ plan: duplicatePlan(), logs: duplicatePlanLogs() }) } });
  const exs = c.api.getS().plan[0].ex;
  eq('duplicate routine exercise IDs are made unique', new Set(exs.map(e => e.id)).size, 2);
  const bench = exs.find(e => e.n === 'Bench Press');
  const incline = exs.find(e => e.n === 'Incline DB Press');
  const log = c.api.getS().logs[0];
  eq('history keeps the matching Bench Press identity', log.ex.find(e => e.n === 'Bench Press').xid, bench.id);
  eq('history keeps the matching Incline identity', log.ex.find(e => e.n === 'Incline DB Press').xid, incline.id);
  c.fireClick({ a: 'tab', t: 'progress' });
  const opts = [...c.dom.get('#v').innerHTML.matchAll(/<option[^>]*value="([^"]*)"[^>]*>([^<]*)<\/option>/g)];
  eq('unrelated exercises stay separate in Progress', opts.length, 2);
}
{
  const plan = duplicatePlan();
  plan[0].ex = [
    { id: 'pid', n: 'Bench Press', m: 'Chest', smin: 3, smax: 4, rmin: 6, rmax: 10 },
    { id: 'pid', n: 'Bench Press', m: 'Back', smin: 3, smax: 4, rmin: 6, rmax: 10 },
  ];
  const logs = duplicatePlanLogs(['Bench Press', 'Bench Press'], ['Back', 'Back']);
  logs[0].ex = [logs[0].ex[0]];
  const c = app({ seed: { gym_data: JSON.stringify({ plan, logs }) } });
  const back = c.api.getS().plan[0].ex.find(e => e.m === 'Back');
  eq('history follows a unique name and muscle match', c.api.getS().logs[0].ex[0].xid, back.id);
}
{
  const plan = duplicatePlan();
  plan[0].ex = [
    { id: 'pid', n: 'Bench Press', m: 'Chest', smin: 3, smax: 4, rmin: 6, rmax: 10 },
    { id: 'pid', n: 'Bench Press', m: 'Chest', smin: 3, smax: 4, rmin: 6, rmax: 10 },
  ];
  const logs = duplicatePlanLogs(['Bench Press', 'Bench Press'], ['Chest', 'Chest']);
  logs[0].ex = [logs[0].ex[0]];
  const c = app({ seed: { gym_data: JSON.stringify({ plan, logs }) } });
  eq('ambiguous history is not assigned to an arbitrary ID', c.api.getS().logs[0].ex[0].xid, '');
}
{
  const plan = JSON.parse(DEFAULTS).plan;
  const before = Object.values(plan).flatMap(p => p.ex.map(e => e.id));
  const c = app({ seed: { gym_data: JSON.stringify({ plan, logs: [] }) } });
  const after = Object.values(c.api.getS().plan).flatMap(p => p.ex.map(e => e.id));
  eq('unique routine exercise IDs are left unchanged', after, before);
}
{
  const draft = { date: '2026-10-06', di: 1, editId: 'dup', ex: [] };
  const c = app({
    seed: {
      gym_data: JSON.stringify(duplicateData()),
      gym_draft: JSON.stringify(draft),
    }, now: '2026-10-06T12:00:00'
  });
  const second = c.api.getS().logs.find(l => l.date === '2026-10-06');
  eq('a draft is relinked to the repaired workout', c.api.getD().editId, second.id);
}
{
  const draft = { date: '2026-10-07', di: 2, editId: 'ghost', ex: [] };
  const c = app({
    seed: {
      gym_data: DEFAULTS,
      gym_draft: JSON.stringify(draft),
    }, now: '2026-10-07T12:00:00'
  });
  eq('a draft with a missing workout is cleared', c.api.getD().editId, '');
}

// =====================================================================
section('Bugs.md 19 — first-run plan identity survives reload');

const planIds = c => new Set(Object.values(c.api.getS().plan).flatMap(p => p.ex.map(e => e.id)));
{
  const c = app({});
  ok('first boot persists the default plan', c.store.has('gym_data'));
  const stored = JSON.parse(c.store.get('gym_data'));
  eq('stored plan IDs match memory', Object.values(stored.plan).flatMap(p => p.ex.map(e => e.id)), [...planIds(c)]);
  ok('first-run draft references persisted IDs', c.api.getD().ex.every(e => planIds(c).has(e.xid)));
}
{
  // reload: stored plan + stored draft must keep the same identities
  const first = app({});
  const idsBefore = [...planIds(first)];
  const draftBefore = first.store.get('gym_draft');
  const second = app({ seed: { gym_data: first.store.get('gym_data'), gym_draft: draftBefore } });
  eq('reload keeps the plan IDs', [...planIds(second)], idsBefore);
  ok('reload draft xids still exist in the plan', second.api.getD().ex.every(e => planIds(second).has(e.xid)));
  ok('reloaded draft is still clean', second.api.draftHasData(second.api.getD()) === false);
}
{
  // upgrade path: only gym_draft survived the old first-run bug
  const first = app({});
  const second = app({ seed: { gym_draft: first.store.get('gym_draft') } });
  ok('draft-only recovery remaps xids to the regenerated plan', second.api.getD().ex.every(e => planIds(second).has(e.xid)));
  ok('repaired draft stays clean', second.api.draftHasData(second.api.getD()) === false);

  second.fireInput({ dataset: { f: 'w', i: '0', j: '0' }, value: '60' });
  second.fireInput({ dataset: { f: 'r', i: '0', j: '0' }, value: '8' });
  second.fireInput({ dataset: { f: 'd', i: '0', j: '0' }, checked: true });
  second.fireClick({ a: 'fin' });
  const log = second.api.getS().logs[0];
  ok('saved log xid exists in the current plan', planIds(second).has(log.ex[0].xid));
  second.fireClick({ a: 'tab', t: 'progress' });
  const opts = [...second.dom.get('#v').innerHTML.matchAll(/<option[^>]*value="([^"]*)"[^>]*>([^<]*)<\/option>/g)];
  eq('progress shows one identity for the exercise', opts.length, 1);
  ok('progress label keeps the exercise name', opts[0][2].includes('Lat Pulldown'));
}
{
  // dirty drafts keep their work (and baseline diff) across the remap
  const first = app({});
  const draft = JSON.parse(first.store.get('gym_draft'));
  draft.ex[0].sets[0].r = '9';
  const second = app({ seed: { gym_draft: JSON.stringify(draft) } });
  ok('dirty draft stays dirty after remap', second.api.draftHasData(second.api.getD()) === true);
  eq('dirty draft keeps its reps', second.api.getD().ex[0].sets[0].r, '9');
}
{
  // a plan loaded from storage is never remapped: removed exercises keep identity
  const plan = JSON.parse(DEFAULTS).plan;
  const removed = plan[1].ex[0];
  plan[1].ex = plan[1].ex.slice(1);
  const draft = { date: '2026-10-13', di: 1, ex: [{ xid: removed.id, n: removed.n, m: removed.m, smin: removed.smin, smax: removed.smax, rmin: removed.rmin, rmax: removed.rmax, on: true, sets: [] }] };
  const c = app({ seed: { gym_data: JSON.stringify({ plan, logs: [] }), gym_draft: JSON.stringify(draft) } });
  eq('stored plan leaves a removed-exercise identity alone', c.api.getD().ex[0].xid, removed.id);
}
{
  // ambiguous matches are not guessed
  const c = app({});
  c.api.getS().plan[1].ex = [
    { id: 'amb-a', n: 'Ambiguous Lift', m: 'Chest', smin: 3, smax: 4, rmin: 6, rmax: 10 },
    { id: 'amb-b', n: 'Ambiguous Lift', m: 'Chest', smin: 3, smax: 4, rmin: 6, rmax: 10 },
  ];
  const d = { ex: [{ xid: 'old', n: 'Ambiguous Lift', m: 'Chest' }], base: null };
  c.api.remapDraftXids(d);
  eq('ambiguous orphan xid is left unchanged', d.ex[0].xid, 'old');
}

// =====================================================================
console.log('\n' + '='.repeat(60));
console.log(`${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);