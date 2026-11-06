import { useEffect, useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { hydrateAll } from './store/hydrate.js';
import { useSettingsStore } from './store/settingsStore.js';
import { useAlarmStore } from './store/alarmStore.js';
import { startScheduler, stopScheduler, ring, notify } from './platform/alarm.js';
import { applyTheme, subscribeSystemTheme } from './platform/theme.js';
import TabBar from './components/TabBar.jsx';
import Captions from './components/Captions.jsx';
import Home from './screens/Home.jsx';
import AlarmEdit from './screens/AlarmEdit.jsx';
import Night from './screens/Night.jsx';
import Ringing from './screens/Ringing.jsx';
import Scan from './screens/Scan.jsx';
import Pair from './screens/Pair.jsx';
import RoutineRun from './screens/RoutineRun.jsx';
import Results from './screens/Results.jsx';
import Routines from './screens/Routines.jsx';
import RoutineEdit from './screens/RoutineEdit.jsx';
import History from './screens/History.jsx';
import Settings from './screens/Settings.jsx';

// Full-screen moments hide the tab bar (progressive disclosure: one job per screen).
const FOCUS_ROUTES = ['/night', '/ring', '/scan', '/pair', '/run', '/results'];
// These always use the dark palette, even in Light mode: a bright bedside clock or
// camera screen at 6am would hurt your eyes. (Ringing + Results follow your theme.)
const FORCE_DARK_ROUTES = ['/night', '/scan', '/pair', '/run'];

export default function App() {
  const [ready, setReady] = useState(false);
  const settings = useSettingsStore((s) => s.settings);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    hydrateAll().finally(() => setReady(true));
  }, []);

  // Global alarm watcher: runs on every screen.
  useEffect(() => {
    if (!ready) return undefined;
    startScheduler(
      () => useAlarmStore.getState().alarms,
      (alarm, now) => {
        useAlarmStore.getState().startRinging(alarm, now);
        const s = useSettingsStore.getState().settings;
        ring({ sound: s.sound, vibrate: s.haptics });
        if (document.visibilityState !== 'visible') notify('BedAlarm', 'Time to get up! Open BedAlarm to start your routine.');
        navigate('/ring');
      },
    );
    return stopScheduler;
  }, [ready, navigate]);

  // Apply accessibility settings to the whole page.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--text-scale', String(settings.textScale));
    root.dataset.colorblind = settings.colorBlind ? 'on' : 'off';
  }, [settings.textScale, settings.colorBlind]);

  const forceDark = FORCE_DARK_ROUTES.some((r) => location.pathname.startsWith(r));

  // Light / dark theme. Waits for `ready` so the default setting can't overwrite the
  // saved choice (index.html already applied the saved choice before first paint).
  useEffect(() => {
    if (!ready) return undefined;
    const apply = () => applyTheme(settings.theme, { forceDark });
    apply();
    return subscribeSystemTheme(apply); // phone switched Light/Dark while in "System"
  }, [ready, settings.theme, forceDark]);

  if (!ready) {
    return (
      <main className="screen screen--center">
        <p className="muted">Loading…</p>
      </main>
    );
  }

  const focus = FOCUS_ROUTES.some((r) => location.pathname.startsWith(r));
  return (
    <div className={`app ${focus ? 'app--focus' : ''}`} data-force-dark={forceDark ? '' : undefined}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/alarms/:id" element={<AlarmEdit />} />
        <Route path="/night" element={<Night />} />
        <Route path="/ring" element={<Ringing />} />
        <Route path="/scan" element={<Scan />} />
        <Route path="/pair" element={<Pair />} />
        <Route path="/run" element={<RoutineRun />} />
        <Route path="/results" element={<Results />} />
        <Route path="/routines" element={<Routines />} />
        <Route path="/routines/:id" element={<RoutineEdit />} />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Home />} />
      </Routes>
      <Captions />
      {!focus && <TabBar />}
    </div>
  );
}
