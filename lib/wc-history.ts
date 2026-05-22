export interface WCHistory {
  titles: number;
  best: string;
  appearances: number; // up to and including 2022
  debut?: number; // year if first WC is 2026
}

const WC_HISTORY: Record<string, WCHistory> = {
  // Champions
  'Brazil':              { titles: 5,  best: 'Winners (1958, 1962, 1970, 1994, 2002)', appearances: 22 },
  'Germany':             { titles: 4,  best: 'Winners (1954, 1974, 1990, 2014)',        appearances: 20 },
  'Italy':               { titles: 4,  best: 'Winners (1934, 1938, 1982, 2006)',        appearances: 18 },
  'Argentina':           { titles: 3,  best: 'Winners (1978, 1986, 2022)',              appearances: 18 },
  'France':              { titles: 2,  best: 'Winners (1998, 2018)',                    appearances: 15 },
  'Uruguay':             { titles: 2,  best: 'Winners (1930, 1950)',                    appearances: 14 },
  'England':             { titles: 1,  best: 'Winners (1966)',                          appearances: 16 },
  'Spain':               { titles: 1,  best: 'Winners (2010)',                          appearances: 16 },

  // Runners-up / podium finishers
  'Netherlands':         { titles: 0,  best: 'Runner-up (1974, 1978, 2010)',            appearances: 11 },
  'Croatia':             { titles: 0,  best: 'Runner-up (2018)',                        appearances: 6  },
  'Sweden':              { titles: 0,  best: 'Runner-up (1958)',                        appearances: 12 },
  'Hungary':             { titles: 0,  best: 'Runner-up (1938, 1954)',                  appearances: 9  },
  'Portugal':            { titles: 0,  best: '3rd place (1966)',                        appearances: 8  },
  'Belgium':             { titles: 0,  best: '3rd place (2018)',                        appearances: 14 },
  'Poland':              { titles: 0,  best: '3rd place (1974, 1982)',                  appearances: 9  },
  'Austria':             { titles: 0,  best: '3rd place (1954)',                        appearances: 7  },
  'Türkiye':             { titles: 0,  best: '3rd place (2002)',                        appearances: 2  },
  'United States':       { titles: 0,  best: '3rd place (1930)',                        appearances: 11 },
  'Chile':               { titles: 0,  best: '3rd place (1962)',                        appearances: 9  },
  'Morocco':             { titles: 0,  best: '4th place (2022)',                        appearances: 6  },
  'South Korea':         { titles: 0,  best: '4th place (2002)',                        appearances: 11 },

  // Regular qualifiers
  'Mexico':              { titles: 0,  best: 'Quarter-finals (1970, 1986)',             appearances: 17 },
  'Switzerland':         { titles: 0,  best: 'Quarter-finals (1934, 1938, 1954)',       appearances: 12 },
  'Senegal':             { titles: 0,  best: 'Quarter-finals (2002)',                   appearances: 3  },
  'Colombia':            { titles: 0,  best: 'Quarter-finals (2014)',                   appearances: 6  },
  'Paraguay':            { titles: 0,  best: 'Quarter-finals (1930, 2010)',             appearances: 9  },
  'Japan':               { titles: 0,  best: 'Round of 16 (2002, 2010, 2018, 2022)',   appearances: 7  },
  'Australia':           { titles: 0,  best: 'Round of 16 (2006, 2022)',               appearances: 6  },
  'Norway':              { titles: 0,  best: 'Quarter-finals (1938)',                   appearances: 3  },
  'Ecuador':             { titles: 0,  best: 'Round of 16 (2006)',                      appearances: 4  },
  'Algeria':             { titles: 0,  best: 'Round of 16 (2014)',                      appearances: 4  },
  'Iran':                { titles: 0,  best: 'Group stage',                             appearances: 6  },
  'Saudi Arabia':        { titles: 0,  best: 'Round of 16 (1994)',                      appearances: 6  },
  'Tunisia':             { titles: 0,  best: 'Group stage',                             appearances: 6  },
  'Ghana':               { titles: 0,  best: 'Quarter-finals (2010)',                   appearances: 4  },
  'Denmark':             { titles: 0,  best: 'Quarter-finals (1998)',                   appearances: 6  },
  'Ivory Coast':         { titles: 0,  best: 'Group stage (2006, 2010, 2014)',          appearances: 3  },
  'Scotland':            { titles: 0,  best: 'Group stage (8 appearances)',             appearances: 8  },
  'Egypt':               { titles: 0,  best: 'Group stage',                             appearances: 3  },
  'South Africa':        { titles: 0,  best: 'Group stage (hosts 2010)',                appearances: 3  },
  'Canada':              { titles: 0,  best: 'Group stage (1986)',                      appearances: 2  },
  'New Zealand':         { titles: 0,  best: 'Group stage',                             appearances: 2  },
  'Bosnia and Herzegovina': { titles: 0, best: 'Group stage (2014)',                   appearances: 1  },
  'Haiti':               { titles: 0,  best: 'Group stage (1974)',                      appearances: 1  },
  'Panama':              { titles: 0,  best: 'Group stage (2018)',                      appearances: 1  },
  'Qatar':               { titles: 0,  best: 'Group stage (hosts 2022)',                appearances: 1  },
  'Czechia':             { titles: 0,  best: 'Group stage (as Czech Republic)',         appearances: 3  },
  'DR Congo':            { titles: 0,  best: 'Group stage (as Zaire 1974)',             appearances: 1  },

  // 2026 debutants
  'Curaçao':             { titles: 0,  best: '2026 debut',                              appearances: 0, debut: 2026 },
  'Uzbekistan':          { titles: 0,  best: '2026 debut',                              appearances: 0, debut: 2026 },
  'Jordan':              { titles: 0,  best: '2026 debut',                              appearances: 0, debut: 2026 },
  'Cape Verde':          { titles: 0,  best: '2026 debut',                              appearances: 0, debut: 2026 },
};

export function getWCHistory(teamName: string): WCHistory | null {
  return WC_HISTORY[teamName] ?? null;
}
