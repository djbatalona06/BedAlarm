import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ExerciseStep from '../components/ExerciseStep.jsx';
import BreathingOrb from '../components/BreathingOrb.jsx';
import TaskPicker from '../components/TaskPicker.jsx';
import { useHistoryStore } from '../store/historyStore.js';
import { useAlarmStore } from '../store/alarmStore.js';
import { useSettingsStore } from '../store/settingsStore.js';
import { currentStep, recordProgress, pickStep, leaveStep, addExtraStep, isStepDone } from '../routine/runner.js';
import { EXERCISES } from '../routine/exercises.js';
import { silence, ring, disarmBedside } from '../platform/alarm.js';
import { unlockAudio, playSuccess } from '../platform/sound.js';
import * as haptics from '../platform/haptics.js';
import { say } from '../platform/speech.js';

// If the alarm is still "on" and you stop moving for this long, it rings again.
const IDLE_RERING_MS = 60000;

export default function RoutineRun() {
  const navigate = useNavigate();
  const session = useHistoryStore((s) => s.active);
  const settings = useSettingsStore((s) => s.settings);
  const ringing = useAlarmStore((s) => s.ringing);
  const [started, setStarted] = useState(false);
  const lastProgress = useRef(Date.now());
  const step = session ? currentStep(session) : null;

  useEffect(() => {
    if (!session) navigate('/', { replace: true });
    else if (session.status === 'complete') navigate('/results', { replace: true });
  }, [session, navigate]);

  // Silence while you're moving; ring again if you go back to bed.
  useEffect(() => {
    if (!ringing) return undefined;
    silence();
    lastProgress.current = Date.now();
    let reRinging = false;
    const t = setInterval(() => {
      const idle = Date.now() - lastProgress.current > IDLE_RERING_MS;
      if (idle && !reRinging) {
        reRinging = true;
        ring({ sound: settings.sound, vibrate: settings.haptics });
        say('Still there? Keep going to stop the alarm.');
      } else if (!idle && reRinging) {
        reRinging = false;
        silence();
      }
    }, 1000);
    return () => {
      clearInterval(t);
      silence();
    };
  }, [ringing, settings.sound, settings.haptics]);

  // Each new step starts with its intro card.
  useEffect(() => setStarted(false), [session?.stepIndex]);

  if (!session) return null;
  const ex = step ? EXERCISES[step.kind] : null;

  const save = (next) => useHistoryStore.getState().update(next);
  const pick = (i) => save(pickStep(useHistoryStore.getState().active, i));
  const backToMenu = () => save(leaveStep(useHistoryStore.getState().active));
  const addExtra = (kind) => save(addExtraStep(useHistoryStore.getState().active, kind, 5));

  async function progress(done) {
    lastProgress.current = Date.now();
    const next = recordProgress(useHistoryStore.getState().active, done);
    await useHistoryStore.getState().update(next); // saved after every rep
    if (next.status === 'complete') {
      silence();
      if (settings.sound) playSuccess();
      if (settings.haptics) haptics.success();
      await useAlarmStore.getState().dismiss();
      await disarmBedside();
      navigate('/results', { replace: true });
    }
  }

  function begin() {
    unlockAudio();
    lastProgress.current = Date.now();
    setStarted(true);
  }

  return (
    <main className="screen screen--camera run">
      <ol className="run__dots" aria-label={`${session.steps.filter(isStepDone).length} of ${session.steps.length} tasks done`}>
        {session.steps.map((s, i) => (
          <li key={i} className={isStepDone(s) ? 'is-done' : i === session.stepIndex ? 'is-now' : ''} />
        ))}
      </ol>

      {step && (
        <button type="button" className="btn btn--small btn--ghost run__tasks" onClick={backToMenu}>
          ☰ Tasks
        </button>
      )}

      {!step ? (
        <div className="run__picker">
          <TaskPicker session={session} onPick={pick} onAdd={addExtra} />
        </div>
      ) : !started ? (
        <section className="run__intro card">
          <p className="run__icon" aria-hidden="true">
            {ex.icon}
          </p>
          <h1>
            {step.target} {ex.name}
            {step.bonus && <span className="tag">bonus</span>}
          </h1>
          <p className="muted">{ex.tip}</p>
          {ex.camera && <p className="muted small">💡 Good light helps. Fitted clothes help the camera see your joints.</p>}
          <button className="btn btn--primary btn--big" onClick={begin} autoFocus>
            Start
          </button>
        </section>
      ) : ex.camera ? (
        <ExerciseStep key={session.stepIndex} step={step} onProgress={progress} />
      ) : (
        <div className="run__breath">
          <p className="hud__reps">
            <span className="hud__count">{step.done}</span>
            <span className="hud__target">/{step.target}</span>
          </p>
          <BreathingOrb
            key={session.stepIndex}
            target={step.target}
            done={step.done}
            inSeconds={settings.breathIn}
            outSeconds={settings.breathOut}
            onBreath={progress}
          />
        </div>
      )}
    </main>
  );
}
