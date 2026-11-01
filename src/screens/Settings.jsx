import { useSettingsStore } from '../store/settingsStore.js';
import { storage } from '../store/storage.js';
import { hydrateAll } from '../store/hydrate.js';
import { unlockAudio, startAlarmSound, stopAlarmSound } from '../platform/sound.js';
import { say } from '../platform/speech.js';
import Stepper from '../components/Stepper.jsx';

function Toggle({ label, hint, checked, onChange }) {
  return (
    <label className="toggle">
      <span>
        <span className="toggle__label">{label}</span>
        {hint && <span className="muted small toggle__hint">{hint}</span>}
      </span>
      <span className="switch">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="switch__track" aria-hidden="true" />
      </span>
    </label>
  );
}

const SCALES = [1, 1.25, 1.5, 2];

export default function Settings() {
  const { settings, update } = useSettingsStore();

  async function testSound() {
    await unlockAudio();
    startAlarmSound();
    setTimeout(stopAlarmSound, 2500);
  }

  async function wipe() {
    if (!window.confirm('Delete all alarms, routines, objects and history from this device?')) return;
    await storage.clear();
    await hydrateAll();
  }

  return (
    <main className="screen">
      <header className="topbar">
        <h1 className="topbar__title">Settings</h1>
      </header>

      <section className="card">
        <h2>Sound & feel</h2>
        <Toggle label="Alarm & rep sounds" checked={settings.sound} onChange={(v) => update({ sound: v })} />
        <Toggle label="Vibration" hint="Not supported on iPhone browsers." checked={settings.haptics} onChange={(v) => update({ haptics: v })} />
        <Toggle label="Voice coach" checked={settings.voice} onChange={(v) => update({ voice: v })} />
        <div className="row">
          <button className="btn btn--small" onClick={testSound}>
            🔔 Test alarm sound
          </button>
          <button className="btn btn--small btn--ghost" onClick={() => say('Good morning! Five squats to go.')}>
            🗣 Test voice
          </button>
        </div>
      </section>

      <section className="card">
        <h2>Accessibility</h2>
        <Toggle label="Captions for voice cues" checked={settings.captions} onChange={(v) => update({ captions: v })} />
        <Toggle
          label="Colour-blind friendly"
          hint="Blue/orange instead of green/red, plus shapes for good/fix form."
          checked={settings.colorBlind}
          onChange={(v) => update({ colorBlind: v })}
        />
        <Toggle
          label="Tap to count reps"
          hint="Adds a big +1 button. Helpful for seated or adapted exercises."
          checked={settings.allowTapCount}
          onChange={(v) => update({ allowTapCount: v })}
        />
        <fieldset className="field">
          <legend className="field__label">Text size</legend>
          <div className="chips">
            {SCALES.map((s) => (
              <button key={s} className={`chip ${settings.textScale === s ? 'chip--on' : ''}`} aria-pressed={settings.textScale === s} onClick={() => update({ textScale: s })}>
                {Math.round(s * 100)}%
              </button>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="card">
        <h2>Breathing pace</h2>
        <div className="toggle">
          <span className="toggle__label">Breathe in (seconds)</span>
          <Stepper value={settings.breathIn} min={2} max={10} label="seconds in" onChange={(v) => update({ breathIn: v })} />
        </div>
        <div className="toggle">
          <span className="toggle__label">Breathe out (seconds)</span>
          <Stepper value={settings.breathOut} min={2} max={12} label="seconds out" onChange={(v) => update({ breathOut: v })} />
        </div>
      </section>

      <section className="card">
        <h2>Privacy</h2>
        <ul className="plain small">
          <li>🔒 Pose and object detection run on this device (WebAssembly/GPU).</li>
          <li>🚫 No video, photos or body data are ever uploaded.</li>
          <li>👤 No account, no ads, no analytics.</li>
          <li>📷 The camera turns on only when you start a scan or exercise.</li>
        </ul>
        <button className="btn btn--danger btn--small" onClick={wipe}>
          Delete all my data
        </button>
      </section>

      <section className="card">
        <h2>Install</h2>
        <p className="muted small">
          Add BedAlarm to your home screen for a full-screen app that works offline. iPhone: Share → Add to Home Screen.
          Android: menu → Install app.
        </p>
        <p className="muted small">
          Web apps can’t ring a locked phone, so BedAlarm uses bedside mode. A native version with lock-screen alarms is
          planned.
        </p>
      </section>
    </main>
  );
}
