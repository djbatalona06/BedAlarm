import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/', label: 'Alarm', icon: '⏰', end: true },
  { to: '/routines', label: 'Routines', icon: '🧩' },
  { to: '/history', label: 'History', icon: '📈' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function TabBar() {
  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.end} className="tabbar__link">
          <span className="tabbar__icon" aria-hidden="true">
            {t.icon}
          </span>
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}
