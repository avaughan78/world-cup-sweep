// Mexico vs South Africa, 11 Jun 2026 20:00 BST (19:00 UTC)
export const TOURNAMENT_START = new Date('2026-06-11T19:00:00Z');

// Group stage ends 2 Jul; Round of 32 begins 4 Jul 2026
export const KNOCKOUT_START = new Date('2026-07-04T00:00:00Z');

// The 32 teams that qualified from the group stage into the Round of 32.
// Used for bracket slot assignment and group-table qualification highlighting.
export const R32_TEAMS = new Set([
  'Germany', 'Paraguay',
  'France', 'Sweden',
  'South Africa', 'Canada',
  'Netherlands', 'Morocco',
  'Portugal', 'Croatia',
  'Spain', 'Austria',
  'United States', 'Bosnia and Herzegovina',
  'Belgium', 'Senegal',
  'Brazil', 'Japan',
  'Ivory Coast', 'Norway',
  'Mexico', 'Ecuador',
  'England', 'DR Congo',
  'Argentina', 'Cape Verde',
  'Australia', 'Egypt',
  'Switzerland', 'Algeria',
  'Colombia', 'Ghana',
]);

// 2026 FIFA World Cup groups — team names match the normalised spreadsheet values
export const GROUPS_2026: Record<string, string[]> = {
  A: ['Mexico', 'South Africa', 'South Korea', 'Czechia'],
  B: ['Canada', 'Bosnia and Herzegovina', 'Qatar', 'Switzerland'],
  C: ['Brazil', 'Morocco', 'Haiti', 'Scotland'],
  D: ['United States', 'Paraguay', 'Australia', 'Türkiye'],
  E: ['Germany', 'Curaçao', 'Ivory Coast', 'Ecuador'],
  F: ['Netherlands', 'Japan', 'Sweden', 'Tunisia'],
  G: ['Belgium', 'Egypt', 'Iran', 'New Zealand'],
  H: ['Spain', 'Cape Verde', 'Saudi Arabia', 'Uruguay'],
  I: ['France', 'Senegal', 'Iraq', 'Norway'],
  J: ['Argentina', 'Algeria', 'Austria', 'Jordan'],
  K: ['Portugal', 'DR Congo', 'Uzbekistan', 'Colombia'],
  L: ['England', 'Croatia', 'Ghana', 'Panama'],
};
