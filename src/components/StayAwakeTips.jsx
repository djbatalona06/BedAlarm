/** The things only you can do on your phone to make sure the screen stays on. */
export default function StayAwakeTips() {
  return (
    <ul className="plain small">
      <li>🔌 Keep it plugged in. A screen that is on all night uses a lot of battery.</li>
      <li>📱 Leave BedAlarm open on screen. If you switch apps or lock the phone, the alarm can’t ring.</li>
      <li>🍎 iPhone: Settings → Display &amp; Brightness → Auto-Lock → Never. Turn off Low Power Mode.</li>
      <li>🤖 Android: Settings → Display → Screen timeout → the longest time. Turn off Battery Saver.</li>
      <li>⏰ Set a backup alarm in your phone’s clock app too.</li>
    </ul>
  );
}
