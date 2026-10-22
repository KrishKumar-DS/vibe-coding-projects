const $ = s => document.querySelector(s);
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const pad = n => String(n).padStart(2, '0');
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const safeId = v => (typeof v === 'string' && /^[A-Za-z0-9_-]+$/.test(v)) ? v : uid();


const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const today = () => iso(new Date());
const isDate = s => {
    if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    const d = new Date(s + 'T00:00:00');
    return !isNaN(d.getTime()) && d.getFullYear() === +s.slice(0, 4) && d.getMonth() + 1 === +s.slice(5, 7) && d.getDate() === +s.slice(8, 10);
};
const wk = s => (new Date(s + 'T00:00:00').getDay() + 6) % 7;
const fmt = s => new Date(s + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
const todayIdx = () => wk(today());
const byDate = (a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
function dateForWeekday(idx, refDate) {
    const ref = new Date((isDate(refDate) ? refDate : today()) + 'T00:00:00');
    const cur = (ref.getDay() + 6) % 7;
    const d = new Date(ref); d.setDate(ref.getDate() + (idx - cur));
    return iso(d)
}
const isCompleted = s => !!s && s.d === true && +s.r > 0;


const ex = (n, m, a, b, c, d) => ({ id: uid(), n, m, smin: a, smax: b, rmin: c, rmax: d });
const def = () => ({
    plan: {
        0: { name: 'Chest + Shoulder + Triceps', ex: [ex('Bench Press', 'Chest', 3, 4, 6, 10), ex('Incline DB Press', 'Chest', 3, 3, 8, 12), ex('Shoulder Press', 'Shoulders', 3, 4, 8, 12), ex('Lateral Raise', 'Shoulders', 3, 4, 12, 15), ex('Triceps Pushdown', 'Triceps', 3, 3, 10, 15)] },
        1: { name: 'Back + Biceps', ex: [ex('Lat Pulldown', 'Back', 3, 4, 8, 12), ex('Barbell Row', 'Back', 3, 4, 6, 10), ex('Barbell Curl', 'Biceps', 3, 3, 8, 12)] },
        2: { name: 'Legs', ex: [ex('Squat', 'Quads', 3, 4, 6, 10), ex('Leg Curl', 'Hamstrings', 3, 3, 10, 15), ex('Calf Raise', 'Calves', 4, 4, 12, 20)] },
        3: { name: 'Rest', ex: [] }, 4: { name: '', ex: [] }, 5: { name: '', ex: [] }, 6: { name: 'Rest', ex: [] }
    }, logs: []
});


const num = v => (v === '' || v == null || isNaN(+v)) ? '' : +v;
function normRoutineEx(e) {
    if (!e || typeof e !== 'object') return null;
    const name = e.n ?? e.name;
    if (!('n' in e) && !('name' in e)) return null;
    return { id: (typeof e.id === 'string' && e.id) ? e.id : uid(), n: typeof name === 'string' ? name : '', m: String(e.m ?? e.muscle ?? ''), smin: num(e.smin ?? e.minSets), smax: num(e.smax ?? e.maxSets), rmin: num(e.rmin ?? e.minReps), rmax: num(e.rmax ?? e.maxReps) }
}
function normPlan(plan) {
    const out = {};
    for (let i = 0; i < 7; i++) {
        const src = (plan && typeof plan === 'object') ? (plan[i] ?? plan[FULL[i]]) : null;
        const p = (src && typeof src === 'object') ? src : {};
        out[i] = { name: typeof p.name === 'string' ? p.name : '', ex: Array.isArray(p.ex) ? p.ex.map(normRoutineEx).filter(Boolean) : [] }
    }
    return out
}
function normLogEx(e) {
    if (!e || typeof e !== 'object') return null;
    const name = e.n ?? e.name; if (typeof name !== 'string') return null;
    return { n: name, m: String(e.m ?? e.muscle ?? ''), xid: (typeof e.xid === 'string' && e.xid) ? e.xid : '', sets: Array.isArray(e.sets) ? e.sets.filter(s => s && typeof s === 'object').map(s => ({ w: +s.w || 0, r: +s.r || 0 })).filter(s => s.r > 0) : [] }
}
function normLog(l) {
    if (!l || typeof l !== 'object' || !isDate(l.date)) return null;
    return { id: safeId(l.id), date: l.date, day: FULL[wk(l.date)], year: +l.date.slice(0, 4), di: (Number.isInteger(l.di) && l.di >= 0 && l.di < 7) ? l.di : wk(l.date), name: typeof l.name === 'string' ? l.name : '', ex: Array.isArray(l.ex) ? l.ex.map(normLogEx).filter(Boolean) : [] }
}
function normalizeData(o) {
    return { plan: normPlan(o && o.plan), logs: (o && Array.isArray(o.logs) ? o.logs : []).map(normLog).filter(Boolean).sort(byDate) }
}
function normDraft(d) {
    if (!d || typeof d !== 'object' || !isDate(d.date) || !Array.isArray(d.ex)) return null;
    return { date: d.date, di: wk(d.date), editId: (typeof d.editId === 'string' && d.editId) ? d.editId : '', base: (typeof d.base === 'string') ? d.base : null, ex: d.ex.filter(e => e && typeof e === 'object').map(e => ({ xid: (typeof e.xid === 'string') ? e.xid : '', n: String(e.n ?? ''), m: String(e.m ?? ''), smin: num(e.smin), smax: num(e.smax), rmin: num(e.rmin), rmax: num(e.rmax), on: e.on !== false, sets: Array.isArray(e.sets) ? e.sets.filter(s => s && typeof s === 'object').map(s => ({ w: s.w ?? '', r: s.r ?? '', d: !!s.d })) : [] })) }
}
function backfillXids() {
    const byName = {};
    Object.values(S.plan).forEach(p => p.ex.forEach(e => { (byName[e.n] = byName[e.n] || new Set()).add(e.id) }));
    S.logs.forEach(l => l.ex.forEach(e => { if (e.xid) return; const ids = byName[e.n]; if (ids && ids.size === 1) e.xid = [...ids][0] }));
}


function validateBackup(o) {
    if (!o || typeof o !== 'object' || Array.isArray(o)) return { ok: false, error: 'backup must be a JSON object.' };
    if (!o.plan || typeof o.plan !== 'object' || Array.isArray(o.plan)) return { ok: false, error: 'missing or invalid "plan".' };
    for (const p of Object.values(o.plan)) {
        if (!p || typeof p !== 'object') return { ok: false, error: 'a plan entry is invalid.' };
        if (p.name != null && typeof p.name !== 'string') return { ok: false, error: 'a plan name is invalid.' };
        if (p.ex != null && !Array.isArray(p.ex)) return { ok: false, error: 'a plan exercise list is invalid.' };
        for (const e of (p.ex || [])) { if (!e || typeof e !== 'object' || typeof (e.n ?? e.name) !== 'string') return { ok: false, error: 'a plan exercise is invalid.' } }
    }
    if (!Array.isArray(o.logs)) return { ok: false, error: 'missing or invalid "logs".' };
    for (const l of o.logs) {
        if (!l || typeof l !== 'object') return { ok: false, error: 'a workout entry is invalid.' };
        if (!isDate(l.date)) return { ok: false, error: 'a workout has an invalid date.' };
        if (l.ex != null && !Array.isArray(l.ex)) return { ok: false, error: 'a workout exercise list is invalid.' };
        for (const e of (l.ex || [])) {
            if (!e || typeof e !== 'object') return { ok: false, error: 'a workout exercise is invalid.' };
            if (e.sets != null && !Array.isArray(e.sets)) return { ok: false, error: 'a set list is invalid.' };
        }
    }
    return { ok: true }
}
const isStrict = o => validateBackup(o).ok;


function recoverCopy(rawStr, why) {
    try { localStorage.setItem('gym_data_recovery_' + Date.now(), rawStr) } catch (e) { }
    try { alert('Your saved workout data was unreadable (' + why + '). A recovery copy was kept in this browser, and default data has been loaded.') } catch (e) { }
}
function bootState() {
    const rawStr = Store.readRaw('gym_data');
    if (rawStr == null) return { S: def(), persist: false };
    let raw; try { raw = JSON.parse(rawStr) } catch (e) { recoverCopy(rawStr, 'not valid JSON'); return { S: def(), persist: false } }
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) { recoverCopy(rawStr, 'unexpected structure'); return { S: def(), persist: false } }
    if (!isStrict(raw)) recoverCopy(rawStr, 'missing or malformed fields');
    return { S: normalizeData(raw), persist: true }
}

let S, D, tab = 'today', pick = null, planDay = null;
const save = () => Store.saveData(S), saveD = () => Store.saveDraft(D);
const boot = bootState();
S = boot.S;
D = normDraft(Store.loadDraft());
backfillXids();
if (boot.persist) save();


function canNameMatch(name) {
    const ids = new Set();
    Object.values(S.plan).forEach(p => p.ex.forEach(e => { if (e.n === name) ids.add(e.id) }));
    S.logs.forEach(l => l.ex.forEach(e => { if (e.n === name) ids.add(e.xid || '') }));
    return ids.size === 0 || (ids.size === 1 && ids.has(''))
}
function lastSets(e, date, skip) {
    for (let i = S.logs.length - 1; i >= 0; i--) {
        const L = S.logs[i];
        if (L.id === skip || (date && L.date >= date)) continue;
        let m = null;
        if (e.xid) m = L.ex.find(x => x.xid === e.xid);
        else if (canNameMatch(e.n)) m = L.ex.find(x => (x.xid || '') === '' && x.n === e.n);
        if (m) return m.sets
    }
    return null
}
function mk(e, date, skip) {
    const l = lastSets({ n: e.n, xid: e.id || '' }, date, skip) || [];
    const c = Math.max(1, +e.smin || 3);
    return { xid: e.id || '', n: e.n, m: e.m, smin: e.smin || '', smax: e.smax || '', rmin: e.rmin || '', rmax: e.rmax || '', on: true, sets: Array.from({ length: c }, (_, i) => ({ w: (l[i] || l[l.length - 1] || {}).w ?? '', r: '', d: false })) }
}
function newDraft(di, date = today()) { D = { date, di, ex: (S.plan[di]?.ex || []).map(e => mk(e, date)) }; D.base = JSON.stringify(D.ex); if (!saveD()) Store.notifyStorageFailure() }
function fromLog(l) {
    const di = wk(l.date), pl = S.plan[di]?.ex || [];
    D = {
        date: l.date, di, editId: l.id, ex: l.ex.map(e => {
            const p = (e.xid && pl.find(x => x.id === e.xid)) || pl.find(x => x.n === e.n) || {};
            return { xid: e.xid || p.id || '', n: e.n, m: e.m || p.m || '', smin: p.smin || '', smax: p.smax || '', rmin: p.rmin || '', rmax: p.rmax || '', on: true, sets: e.sets.map(s => ({ w: s.w, r: s.r, d: true })) }
        })
    };
    D.base = JSON.stringify(D.ex); // baseline for draftHasData: the auto-loaded state is not "unsaved work"
    if (!saveD()) Store.notifyStorageFailure()
}
function openDate(date) { const l = S.logs.find(x => x.date === date); l ? fromLog(l) : newDraft(wk(date), date) }
function allEx() { const m = {}; Object.values(S.plan).forEach(p => p.ex.forEach(e => m[e.n] = e.m)); S.logs.forEach(l => l.ex.forEach(e => m[e.n] = m[e.n] || e.m)); return m }
// "Dirty" = differs from the auto-generated baseline that newDraft/fromLog
// snapshot into D.base, so auto-prefilled weights are not unsaved work.
// Legacy drafts saved before base existed can't distinguish auto-fill from
// typing: weight-only is ignored, reps/completed/skip still count.
function draftHasData(d) {
    if (!d) return false;
    if (d.base != null) return JSON.stringify(d.ex) !== d.base;
    return d.ex.some(e => e.on === false || e.sets.some(s => s.d || +s.r > 0))
}
function mayDiscard() {
    if (!draftHasData(D)) return true;
    return confirm('Unsaved changes on this screen will be lost. Continue?')
}

function today_v() {
    if (!D) openDate(today());
    const p = S.plan[D.di] || { name: '', ex: [] };
    let h = `<h2>Workout</h2><div class="card"><div class="row" style="margin:0"><input type="date" id="dt" value="${D.date}" max="${today()}"><b style="flex:none">${FULL[wk(D.date)]} · ${D.date.slice(0, 4)}</b></div>${D.editId ? '<div class="mu" style="margin-top:6px">✏️ Editing a saved workout. Changes update it.</div>' : ''}</div><div class="chips">${DAYS.map((d, i) => `<button class="chip ${i === D.di ? 'on' : ''}" data-a="day" data-i="${i}"${dateForWeekday(i, D.date) > today() ? ' disabled' : ''}>${d}</button>`).join('')}</div>
 <div class="mu" style="margin-bottom:8px">${esc(p.name || 'No routine set')}</div>`;
    D.ex.forEach((e, i) => {
        const l = lastSets(e, D.date, D.editId);
        h += `<div class="card ${e.on ? '' : 'skip'}"><div class="hd"><div><b>${esc(e.n)}</b> <span class="mu">${esc(e.m)}</span>
  <div class="mu">${e.smin ? `${e.smin}-${e.smax} sets × ${e.rmin}-${e.rmax} reps` : 'Extra exercise'}${l ? ` · Last: ${l.map(s => s.w + '×' + s.r).join(', ')}` : ''}</div></div>
  <button class="chip" data-a="tog" data-i="${i}">${e.on ? 'Skip' : 'Include'}</button></div>`;
        if (e.on) {
            e.sets.forEach((s, j) => {
                h += `<div class="row"><span class="n">${j + 1}</span>
   <input type="number" inputmode="decimal" placeholder="kg" value="${s.w}" data-f="w" data-i="${i}" data-j="${j}">
   <input type="number" inputmode="numeric" placeholder="${e.rmin ? e.rmin + '-' + e.rmax : 'reps'}" value="${s.r}" data-f="r" data-i="${i}" data-j="${j}">
   <input type="checkbox" class="ok" ${s.d ? 'checked' : ''} data-f="d" data-i="${i}" data-j="${j}">
   <button class="x" data-a="ds" data-i="${i}" data-j="${j}">✕</button></div>`
            });
            h += `<div class="row"><button class="btn g" data-a="as" data-i="${i}">+ Set</button><button class="btn g" data-a="cp" data-i="${i}">Copy weight to all</button><button class="x" data-a="de" data-i="${i}" title="Remove">🗑</button></div>`
        }
        h += '</div>'
    });
    const known = allEx();
    h += `<div class="card"><b>Add exercise</b><div class="row"><input list="ex" id="nx" placeholder="Exercise name"><input id="nm" placeholder="Muscle" style="max-width:110px"></div>
 <datalist id="ex">${Object.keys(known).map(k => `<option value="${esc(k)}">`).join('')}</datalist>
 <div class="row"><button class="btn g w" data-a="addx">+ Add to today</button></div></div>
 <button class="btn w" data-a="fin">${D.editId ? '✔ Update Workout' : '✔ Finish & Save Workout'}</button>`;
    return h
}

function hist_v() {
    let h = '<h2>History</h2><button class="btn g w" data-a="past" style="margin-bottom:10px">+ Log / edit a past day</button>';
    if (!S.logs.length) return h + '<div class="mu">No workouts saved yet.</div>';
    [...new Set(S.logs.map(l => l.year))].sort((a, b) => b - a).forEach(y => {
        const ls = S.logs.filter(l => l.year === y).reverse();
        h += `<h3 style="margin:14px 0 8px">${y} <span class="mu">${ls.length} workouts</span></h3>`;
        ls.forEach(l => {
            const vol = l.ex.reduce((a, e) => a + e.sets.reduce((b, s) => b + s.w * s.r, 0), 0);
            h += `<details class="card"><summary><b>${fmt(l.date)}</b> · ${esc(l.name || 'Workout')} <span class="mu">${l.ex.length} ex · ${Math.round(vol)} kg vol</span></summary>
   ${l.ex.map(e => `<div style="margin-top:8px"><b>${esc(e.n)}</b> <span class="mu">${esc(e.m)}</span><div class="mu">${e.sets.map(s => s.w + 'kg×' + s.r).join(' · ')}</div></div>`).join('')}
   <div class="row"><button class="btn" data-a="edit" data-id="${esc(l.id)}">Edit</button><button class="btn g" data-a="dl" data-id="${esc(l.id)}">Delete</button></div></details>`
        })
    });
    return h
}

function prog_v() {
    // Group history by stable identity (xid) so renaming a routine exercise
    // never splits its progress; legacy logs without an xid fall back to name.
    const keyOf = e => e.xid ? 'xid:' + e.xid : 'name:' + e.n;
    const planName = {};
    Object.values(S.plan).forEach(p => p.ex.forEach(e => { if (e.id) planName[e.id] = e.n }));
    const groups = [], byKey = new Map();
    S.logs.forEach(l => l.ex.forEach(e => {
        if (!e.sets.length) return;
        const key = keyOf(e), g = byKey.get(key);
        if (g) { g.name = e.n; g.m = e.m || g.m; g.label = e.n } // S.logs is oldest-first: newest name wins
        else { const ng = { key, xid: e.xid || '', name: e.n, m: e.m, label: e.n }; byKey.set(key, ng); groups.push(ng) }
    }));
    groups.forEach(g => { if (g.xid && planName[g.xid] != null) g.label = planName[g.xid] }); // prefer current routine name
    const labelCount = {}; groups.forEach(g => (labelCount[g.label] = (labelCount[g.label] || 0) + 1));
    const usedLabels = new Set();
    groups.forEach(g => {
        let label = g.label;
        if (labelCount[label] > 1) { // different identities share a name: keep the dropdown usable
            label = g.m ? `${label} · ${g.m}` : label;
            let i = 2; while (usedLabels.has(label)) label = `${g.label} (${i++})`
        }
        usedLabels.add(label); g.label = label
    });
    let h = '<h2>Progression</h2>';
    if (!groups.length) return h + '<div class="mu">Save a workout to see progress.</div>';
    const g = groups.find(x => x.key === pick) || groups[0];
    pick = g.key;
    h += `<select id="pk" style="width:100%;margin-bottom:10px">${groups.map(x => `<option value="${esc(x.key)}" ${x.key === pick ? 'selected' : ''}>${esc(x.label)}</option>`).join('')}</select>`;
    const pts = S.logs.map(l => {
        const e = l.ex.find(x => g.xid ? x.xid === g.xid : (!x.xid && x.n === g.name)); if (!e || !e.sets.length) return null;
        const top = e.sets.reduce((a, s) => s.w > a.w || (s.w === a.w && s.r > a.r) ? s : a, e.sets[0]);
        return { d: l.date, w: top.w, r: top.r, rm: Math.max(...e.sets.map(s => s.w * (1 + s.r / 30))) }
    }).filter(Boolean);
    if (!pts.length) return h + '<div class="mu">No completed sets recorded for this exercise yet.</div>';
    const pr = pts.length ? Math.max(...pts.map(p => p.w)) : 0, rm = pts.length ? Math.max(...pts.map(p => p.rm)) : 0;
    h += `<div class="card st"><div><b>${pr}kg</b><span class="mu">Best weight</span></div><div><b>${rm.toFixed(0)}kg</b><span class="mu">Est. 1RM</span></div><div><b>${pts.length}</b><span class="mu">Sessions</span></div></div>`;
    const W = 320, H = 150, P = 24, mx = Math.max(...pts.map(p => p.w)), mn = Math.min(...pts.map(p => p.w)), rg = (mx - mn) || 1;
    const xy = pts.map((p, i) => [P + (pts.length > 1 ? i * (W - 2 * P) / (pts.length - 1) : (W - 2 * P) / 2), H - P - ((p.w - mn) / rg) * (H - 2 * P)]);
    h += `<div class="card"><div class="mu">Top-set weight per session</div><svg viewBox="0 0 ${W} ${H}"><polyline fill="none" stroke="var(--ac)" stroke-width="2" points="${xy.map(a => a.join(',')).join(' ')}"/>
 ${xy.map((a, i) => `<circle cx="${a[0]}" cy="${a[1]}" r="3.5" fill="var(--ac)"/><text x="${a[0]}" y="${a[1] - 8}" font-size="10" text-anchor="middle" fill="var(--mu)">${pts[i].w}</text>`).join('')}</svg></div>`;
    h += [...pts].reverse().map(p => `<div class="card hd"><span>${p.d}</span><b>${p.w}kg × ${p.r}</b></div>`).join('');
    return h
}

function plan_v() {
    if (planDay == null) planDay = todayIdx();
    const p = S.plan[planDay];
    let h = `<h2>Routine</h2><div class="chips">${DAYS.map((d, i) => `<button class="chip ${i === planDay ? 'on' : ''}" data-a="pd" data-i="${i}">${d}</button>`).join('')}</div>
 <input id="pn" value="${esc(p.name)}" placeholder="e.g. Chest + Shoulder + Triceps" style="width:100%;margin-bottom:10px">`;
    p.ex.forEach((e, i) => {
        h += `<div class="card"><div class="hd"><b>Exercise ${i + 1}</b><button class="x" data-a="pdel" data-i="${i}">✕</button></div>
  <div class="pl"><input data-p="n" data-i="${i}" value="${esc(e.n)}" placeholder="Name"><input data-p="m" data-i="${i}" value="${esc(e.m)}" placeholder="Muscle">
  <input type="number" data-p="smin" data-i="${i}" value="${e.smin}" placeholder="Sets min"><input type="number" data-p="smax" data-i="${i}" value="${e.smax}" placeholder="Sets max">
  <input type="number" data-p="rmin" data-i="${i}" value="${e.rmin}" placeholder="Reps min"><input type="number" data-p="rmax" data-i="${i}" value="${e.rmax}" placeholder="Reps max"></div></div>`
    });
    h += `<button class="btn g w" data-a="padd">+ Add exercise to ${DAYS[planDay]}</button>
 <div class="card" style="margin-top:16px"><b>Backup</b><div class="mu">Data is saved in this browser only.</div>
 <div class="row"><button class="btn g" data-a="bk">Copy backup</button><button class="btn g" data-a="rs">Restore</button></div></div>`;
    return h
}

const V = { today: today_v, history: hist_v, progress: prog_v, routine: plan_v };
function render() {
    $('#v').innerHTML = V[tab]();
    $('#nav').innerHTML = [['today', '🏋️ Today'], ['history', '📅 History'], ['progress', '📈 Progress'], ['routine', '⚙️ Routine']].map(([k, t]) => `<button class="${k === tab ? 'on' : ''}" data-a="tab" data-t="${k}">${t}</button>`).join('')
}

document.addEventListener('click', async ev => {
    const b = ev.target.closest('[data-a]'); if (!b) return;
    const a = b.dataset.a, i = +b.dataset.i, j = +b.dataset.j;
    if (a === 'tab') { tab = b.dataset.t }
    else if (a === 'day') {
        const nv = dateForWeekday(i, D.date);
        if (nv > today()) return; // never allow selecting a future date
        if (nv === D.date) return;
        if (D.editId) { D.date = nv; D.di = wk(nv); if (!saveD()) Store.notifyStorageFailure() }
        else { if (!mayDiscard()) { render(); return } openDate(nv) }
    }
    else if (a === 'tog') { D.ex[i].on = !D.ex[i].on; if (!saveD()) Store.notifyStorageFailure() }
    else if (a === 'as') { const s = D.ex[i].sets, l = s[s.length - 1]; s.push({ w: l ? l.w : '', r: '', d: false }); if (!saveD()) Store.notifyStorageFailure() }
    else if (a === 'ds') { D.ex[i].sets.splice(j, 1); if (!saveD()) Store.notifyStorageFailure() }
    else if (a === 'de') { D.ex.splice(i, 1); if (!saveD()) Store.notifyStorageFailure() }
    else if (a === 'cp') { const w = D.ex[i].sets[0]?.w; D.ex[i].sets.forEach(s => s.w = w); if (!saveD()) Store.notifyStorageFailure() }
    else if (a === 'addx') {
        const n = $('#nx').value.trim(), m = $('#nm').value.trim() || allEx()[n] || 'Other'; if (!n) return;
        D.ex.push(mk({ n, m, smin: 3, smax: 3, rmin: '', rmax: '' })); if (!saveD()) Store.notifyStorageFailure()
    }
    else if (a === 'fin') {
        const ex = D.ex.filter(e => e.on).map(e => ({ n: e.n, m: e.m, xid: e.xid || '', sets: e.sets.filter(isCompleted).map(s => ({ w: +s.w || 0, r: +s.r })) })).filter(e => e.sets.length);
        if (!ex.length) { alert('Mark at least one set as completed and enter its repetitions.'); return }
        const date = D.date;
        if (!isDate(date) || date > today()) { alert('Please choose a valid date that is not in the future.'); return }
        { const clash = S.logs.find(l => l.id !== (D.editId || '_new_') && l.date === date); if (clash) { alert('Another workout already exists on ' + date + '. Change the date or cancel the edit.'); return } }
        const di = wk(date);
        const rec = { id: D.editId || uid(), date, day: FULL[di], year: +date.slice(0, 4), di, name: (S.plan[di] || {}).name || '', ex };
        const prevLogs = S.logs;
        S.logs = prevLogs.filter(l => l.id !== rec.id);
        S.logs.push(rec);
        S.logs.sort(byDate);
        if (!save()) { S.logs = prevLogs; alert('Could not save to this browser\'s storage (it may be full or blocked). Your workout is kept on this screen — free up space and try again.'); return }
        D = null; if (!Store.saveDraft(null)) Store.notifyStorageFailure(); tab = 'history'
    }
    else if (a === 'edit') { const l = S.logs.find(x => x.id === b.dataset.id); if (l) { fromLog(l); tab = 'today' } }
    else if (a === 'past') { tab = 'today' }
    else if (a === 'dl') {
        if (confirm('Delete this workout?')) {
            const prev = S.logs;
            S.logs = S.logs.filter(l => l.id !== b.dataset.id);
            if (!save()) { S.logs = prev; alert('Could not update storage; the workout was not deleted.'); return }
            if (D && D.editId === b.dataset.id) { D = null; if (!Store.saveDraft(null)) Store.notifyStorageFailure() }
        }
    }
    else if (a === 'pd') { planDay = i }
    else if (a === 'pdel') { S.plan[planDay].ex.splice(i, 1); if (!save()) Store.notifyStorageFailure() }
    else if (a === 'padd') { S.plan[planDay].ex.push(ex('', '', 3, 4, 8, 12)); if (!save()) Store.notifyStorageFailure() }
    else if (a === 'bk') { const t = JSON.stringify(S); try { await navigator.clipboard.writeText(t); alert('Backup copied.') } catch (e) { prompt('Copy this backup:', t) } return }
    else if (a === 'rs') {
        const t = prompt('Paste backup JSON:'); if (!t) return;
        let o; try { o = JSON.parse(t) } catch (e) { alert('Invalid backup: not valid JSON.'); return }
        const v = validateBackup(o);
        if (!v.ok) { alert('Invalid backup: ' + v.error); return }
        const prev = S;
        S = normalizeData(o);
        backfillXids();
        if (!save()) { S = prev; alert('Invalid backup: could not write to storage.'); return }
        D = null; if (!Store.saveDraft(null)) Store.notifyStorageFailure(); tab = 'history'; alert('Backup restored.')
    }
    render()
});

document.addEventListener('input', ev => {
    const t = ev.target;
    if (t.dataset.f) { const s = D.ex[+t.dataset.i].sets[+t.dataset.j]; s[t.dataset.f] = t.dataset.f === 'd' ? t.checked : t.value; if (!saveD()) Store.notifyStorageFailure() }
    else if (t.dataset.p) { const pi = planDay == null ? todayIdx() : planDay; const e = S.plan[pi].ex[+t.dataset.i], k = t.dataset.p; e[k] = ['n', 'm'].includes(k) ? t.value : t.value === '' ? '' : +t.value; if (!save()) Store.notifyStorageFailure() }
    else if (t.id === 'pn') { S.plan[planDay].name = t.value; if (!save()) Store.notifyStorageFailure() }
});
document.addEventListener('change', ev => {
    if (ev.target.id === 'pk') { pick = ev.target.value; render() }
    if (ev.target.id === 'dt') {
        const v = ev.target.value;
        if (!isDate(v)) { render(); return }
        if (v > today()) { alert('Future dates are not allowed.'); render(); return }
        if (v === D.date) { render(); return }
        if (D.editId) {
            if (S.logs.find(l => l.id !== D.editId && l.date === v)) { alert('Another workout already exists on ' + v + '. Choose another date or cancel the edit.'); render(); return }
            D.date = v; D.di = wk(v); if (!saveD()) Store.notifyStorageFailure()
        }
        else { if (!mayDiscard()) { render(); return } openDate(v) }
        render()
    }
});
render();
