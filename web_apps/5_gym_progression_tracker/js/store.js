// js/store.js — Storage adapter layer.
// Phase 1: LocalAdapter only (browser localStorage).
// A FileAdapter (fetch → local Node server) is added in a later phase.
//
// The app keeps working against a single `Store` object so the rest of
// app.js never needs to know whether data lives in localStorage or a file.
const Store = (() => {
    let storageWarned = false;

    function readRaw(k) { try { return localStorage.getItem(k) } catch (e) { return null } }
    function ld(k) { const r = readRaw(k); if (r == null) return null; try { return JSON.parse(r) } catch (e) { return null } }
    function notifyStorageFailure() {
        if (storageWarned) return;
        storageWarned = true;
        alert('Some changes could not be saved to this browser\'s storage (it may be full or blocked). They may be lost if you reload.');
    }
    function sv(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); storageWarned = false; return true } catch (e) { return false } }

    return {
        mode: 'local',
        ready: true,
        // Probe + initial load. Resolves once data + draft are ready.
        init() { return Promise.resolve(); },
        loadData() { return ld('gym_data'); },
        loadDraft() { return ld('gym_draft'); },
        saveData(S) { return sv('gym_data', S); },
        saveDraft(D) { return sv('gym_draft', D); },
        loadTheme() { return ld('gym_theme') || 'system'; },
        saveTheme(t) { return sv('gym_theme', t); },
        flush() { return Promise.resolve(); },
        online() { return true; },
        // Exposed for gradual migration: app.js still calls these directly
        // in a few spots while the full FileAdapter lands.
        readRaw,
        ld,
        sv,
        notifyStorageFailure,
    };
})();
