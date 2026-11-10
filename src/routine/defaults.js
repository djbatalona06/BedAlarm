// The "minimum viable morning": tiny enough to finish on your worst day.
export const DEFAULT_ROUTINE_ID = 'routine-wake-up';

export function defaultRoutines() {
  return [
    {
      id: DEFAULT_ROUTINE_ID,
      name: 'Tiny wake-up',
      objectId: null,
      steps: [
        { id: 's1', kind: 'squat', target: 5 },
        { id: 's2', kind: 'breathe', target: 3 },
      ],
    },
    {
      id: 'routine-full',
      name: 'Full morning',
      objectId: null,
      steps: [
        { id: 's1', kind: 'squat', target: 10 },
        { id: 's2', kind: 'pushup', target: 10 },
        { id: 's3', kind: 'breathe', target: 5 },
      ],
    },
  ];
}

export const DEFAULT_SETTINGS = {
  onboarded: false,
  colorBlind: false,
  theme: 'system', // 'system' | 'light' | 'dark'
  voice: true,
  captions: true,
  haptics: true,
  sound: true,
  keepScreenOn: true, // bedside mode: ask the phone to keep the screen on
  keepAliveAudio: true, // bedside mode: silent looping sound as a backup
  textScale: 1,
  allowTapCount: false,
  breathIn: 4,
  breathOut: 6,
};

export const FALLBACK_EXTRA_SQUATS = 2;
