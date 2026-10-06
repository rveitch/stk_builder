export const padRows = [[2, 4, 6, 8, 10, 12, 14], [1, 3, 5, 7, 9, 11, 13, 15]] as const;

/** Suggested roles from the Rock kit layout; samples can occupy any slot. */
export const suggestedPadTypes: Readonly<Record<number, string>> = {
  1: 'Kick 1',
  2: 'Kick 2',
  3: 'Snare 1',
  4: 'Snare 2',
  5: 'Rimshot',
  6: 'Tom 1',
  7: 'HH',
  8: 'Tom 2',
  9: 'HH Open',
  10: 'Tom 3',
  11: 'Clap',
  12: 'Tom 4',
  13: 'Crash 1',
  14: 'Crash 2',
  15: 'Ride',
};
