import { FALLBACK_EXTRA_SQUATS } from './defaults.js';

// A "session" is one run through a routine. These are pure functions so the
// app can save the session after every rep and resume it after a reload.

let counter = 0;
export const newId = (prefix) => `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}`;

export function startSession(routine, { now = Date.now(), alarmId = null } = {}) {
  return {
    id: newId('session'),
    routineId: routine.id,
    routineName: routine.name,
    alarmId,
    startedAt: now,
    finishedAt: null,
    scan: routine.objectId ? 'pending' : 'none', // 'pending' | 'object' | 'fallback' | 'none'
    stepIndex: 0,
    steps: routine.steps.map((s) => ({ kind: s.kind, target: s.target, done: 0, startedAt: null, finishedAt: null })),
    status: 'in_progress',
  };
}

export const currentStep = (session) => session.steps[session.stepIndex] ?? null;
export const isComplete = (session) => session.status === 'complete';

/** The object was scanned (or skipped via the fallback, which adds squats). */
export function resolveScan(session, method) {
  if (method === 'fallback') {
    return {
      ...session,
      scan: 'fallback',
      steps: [{ kind: 'squat', target: FALLBACK_EXTRA_SQUATS, done: 0, startedAt: null, finishedAt: null, bonus: true }, ...session.steps],
    };
  }
  return { ...session, scan: method };
}

/** Set progress on the current step; auto-advances when the target is hit. */
export function recordProgress(session, done, now = Date.now()) {
  const step = currentStep(session);
  if (!step || isComplete(session)) return session;
  const clamped = Math.max(0, Math.min(done, step.target));
  const steps = session.steps.slice();
  steps[session.stepIndex] = { ...step, done: clamped, startedAt: step.startedAt ?? now };
  const next = { ...session, steps };
  return clamped >= step.target ? completeStep(next, now) : next;
}

export function completeStep(session, now = Date.now()) {
  const step = currentStep(session);
  if (!step) return session;
  const steps = session.steps.slice();
  steps[session.stepIndex] = { ...step, done: step.target, startedAt: step.startedAt ?? now, finishedAt: now };
  const stepIndex = session.stepIndex + 1;
  const finished = stepIndex >= steps.length;
  return {
    ...session,
    steps,
    stepIndex,
    status: finished ? 'complete' : 'in_progress',
    finishedAt: finished ? now : null,
  };
}

/** Totals for the results screen and history. */
export function summarize(session) {
  const totals = { squat: 0, pushup: 0, breathe: 0 };
  for (const s of session.steps) totals[s.kind] = (totals[s.kind] || 0) + s.done;
  const durationMs = session.finishedAt ? session.finishedAt - session.startedAt : null;
  return { totals, durationMs };
}

/** "Small wins": compare with the last finished session of the same routine. */
export function smallWins(session, history) {
  const prev = history
    .filter((h) => h.id !== session.id && h.routineId === session.routineId && h.status === 'complete')
    .sort((a, b) => b.finishedAt - a.finishedAt)[0];
  const wins = [];
  const { totals, durationMs } = summarize(session);
  const reps = totals.squat + totals.pushup;
  wins.push(`${reps} reps and ${totals.breathe} breaths done before breakfast.`);
  if (prev) {
    const p = summarize(prev);
    const prevReps = p.totals.squat + p.totals.pushup;
    if (reps > prevReps) wins.push(`+${reps - prevReps} reps vs last time.`);
    if (durationMs && p.durationMs && durationMs < p.durationMs) {
      wins.push(`${Math.round((p.durationMs - durationMs) / 1000)}s quicker than last time.`);
    }
  } else {
    wins.push('First time with this routine — that counts!');
  }
  const mornings = history.filter((h) => h.status === 'complete').length + (history.some((h) => h.id === session.id) ? 0 : 1);
  wins.push(`${mornings} ${mornings === 1 ? 'morning' : 'mornings'} completed in total.`);
  return wins;
}
