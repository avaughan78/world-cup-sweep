export interface WCHistory {
  titles: number;
  best: string;
  appearances: number; // up to and including 2022
  debut?: number; // year if first WC is 2026
  note?: string;    // fun/interesting fact
  legends?: string[]; // 1-2 famous players
}

const WC_HISTORY: Record<string, WCHistory> = {
  // Champions
  'Brazil':              { titles: 5,  best: 'Winners (1958, 1962, 1970, 1994, 2002)', appearances: 22,
    legends: ['Pelé', 'Ronaldo'],
    note: 'The only team to have played in every single World Cup — all 22 editions since 1930' },

  'Germany':             { titles: 4,  best: 'Winners (1954, 1974, 1990, 2014)',        appearances: 20,
    legends: ['Franz Beckenbauer', 'Gerd Müller'],
    note: 'Reached the final in 8 World Cups — more than any other nation' },

  'Italy':               { titles: 4,  best: 'Winners (1934, 1938, 1982, 2006)',        appearances: 18,
    legends: ['Paolo Maldini', 'Roberto Baggio'],
    note: 'Missed the 2018 World Cup entirely despite winning in 2006 — the biggest qualifying shock in history' },

  'Argentina':           { titles: 3,  best: 'Winners (1978, 1986, 2022)',              appearances: 18,
    legends: ['Diego Maradona', 'Lionel Messi'],
    note: "Maradona's Hand of God goal in 1986; Messi finally won it in Qatar 2022 at the age of 35" },

  'France':              { titles: 2,  best: 'Winners (1998, 2018)',                    appearances: 15,
    legends: ['Zinedine Zidane', 'Kylian Mbappé'],
    note: 'Won on home soil in 1998 then lost the 2006 final on penalties after Zidane headbutted Materazzi' },

  'Uruguay':             { titles: 2,  best: 'Winners (1930, 1950)',                    appearances: 14,
    legends: ['Luis Suárez', 'Diego Forlán'],
    note: 'Won the first ever World Cup in 1930 as hosts, then stunned Brazil in the 1950 final in Rio' },

  'England':             { titles: 1,  best: 'Winners (1966)',                          appearances: 16,
    legends: ['Bobby Moore', 'Gary Lineker'],
    note: 'Invented the game but have only won it once — at home at Wembley in 1966. Still waiting since.' },

  'Spain':               { titles: 1,  best: 'Winners (2010)',                          appearances: 16,
    legends: ['Xavi Hernández', 'Andrés Iniesta'],
    note: 'Won three consecutive major tournaments in 2008, 2010 and 2012 with their iconic tiki-taka style' },

  // Runners-up / podium finishers
  'Netherlands':         { titles: 0,  best: 'Runner-up (1974, 1978, 2010)',            appearances: 11,
    legends: ['Johan Cruyff', 'Arjen Robben'],
    note: 'Three World Cup finals, zero wins — Robben had a one-on-one with Casillas in extra time in 2010 that could have won it' },

  'Croatia':             { titles: 0,  best: 'Runner-up (2018)',                        appearances: 6,
    legends: ['Luka Modrić', 'Davor Šuker'],
    note: 'A nation of just 4 million people reached the semi-finals in 1998 and the final in 2018 — extraordinary for a country their size' },

  'Sweden':              { titles: 0,  best: 'Runner-up (1958)',                        appearances: 12,
    legends: ['Zlatan Ibrahimović', 'Henrik Larsson'],
    note: 'Lost the 1958 final as hosts to Brazil — a 17-year-old Pelé scored twice in that match' },

  'Hungary':             { titles: 0,  best: 'Runner-up (1938, 1954)',                  appearances: 9,
    legends: ['Ferenc Puskás', 'Sándor Kocsis'],
    note: 'The 1954 "Mighty Magyars" were unbeaten for 4 years yet lost the World Cup final to West Germany' },

  'Portugal':            { titles: 0,  best: '3rd place (1966)',                        appearances: 8,
    legends: ['Eusébio', 'Cristiano Ronaldo'],
    note: 'Eusébio was top scorer at the 1966 World Cup; the modern era has been entirely defined by Ronaldo' },

  'Belgium':             { titles: 0,  best: '3rd place (2018)',                        appearances: 14,
    legends: ['Kevin De Bruyne', 'Eden Hazard'],
    note: "The so-called Golden Generation of De Bruyne, Hazard and Lukaku peaked at 3rd in 2018 and then fell apart" },

  'Poland':              { titles: 0,  best: '3rd place (1974, 1982)',                  appearances: 9,
    legends: ['Robert Lewandowski', 'Grzegorz Lato'],
    note: 'Grzegorz Lato was top scorer with 7 goals in 1974; Lewandowski leads the modern era' },

  'Austria':             { titles: 0,  best: '3rd place (1954)',                        appearances: 7,
    legends: ['Hans Krankl', 'Ernst Happel'],
    note: "Austria's 1978 team thrashed West Germany 3-2 in the famous 'Miracle of Córdoba' — yet Argentina lifted the trophy that year" },

  'Türkiye':             { titles: 0,  best: '3rd place (2002)',                        appearances: 2,
    legends: ['Hakan Şükür', 'Burak Yılmaz'],
    note: 'Hakan Şükür scored the fastest ever World Cup goal — 11 seconds into the 2002 third-place match vs South Korea' },

  'United States':       { titles: 0,  best: '3rd place (1930)',                        appearances: 11,
    legends: ['Landon Donovan', 'Christian Pulisic'],
    note: 'Hosted the 1994 World Cup and are co-hosting 2026 — the 1994 tournament averaged 69,000 fans per game' },

  'Chile':               { titles: 0,  best: '3rd place (1962)',                        appearances: 9,
    legends: ['Alexis Sánchez', 'Carlos Caszely'],
    note: 'Hosted the 1962 World Cup despite a devastating earthquake just two years before the tournament' },

  'Morocco':             { titles: 0,  best: '4th place (2022)',                        appearances: 6,
    legends: ['Achraf Hakimi', 'Hakim Ziyech'],
    note: 'First African and Arab team to reach a World Cup semi-final — knocking out Spain and Portugal in Qatar 2022' },

  'South Korea':         { titles: 0,  best: '4th place (2002)',                        appearances: 11,
    legends: ['Park Ji-sung', 'Son Heung-min'],
    note: 'Co-hosts in 2002, they stunned Italy and Spain to reach the semi-finals in one of the greatest underdog runs ever' },

  // Regular qualifiers
  'Mexico':              { titles: 0,  best: 'Quarter-finals (1970, 1986)',             appearances: 17,
    legends: ['Hugo Sánchez', 'Javier Hernández'],
    note: 'Qualified for every World Cup from 1994 to 2022 — eight in a row — but have never gone further than the quarter-finals' },

  'Switzerland':         { titles: 0,  best: 'Quarter-finals (1934, 1938, 1954)',       appearances: 12,
    legends: ['Xherdan Shaqiri', 'Granit Xhaka'],
    note: 'Beat France on penalties at Euro 2020 in one of the great tournament shocks; consistently punch above their weight' },

  'Senegal':             { titles: 0,  best: 'Quarter-finals (2002)',                   appearances: 3,
    legends: ['El Hadji Diouf', 'Sadio Mané'],
    note: 'As complete debutants in 2002, they beat France (the defending world champions) on their very first match' },

  'Colombia':            { titles: 0,  best: 'Quarter-finals (2014)',                   appearances: 6,
    legends: ['Carlos Valderrama', 'James Rodríguez'],
    note: "James Rodríguez's volley vs Uruguay in 2014 was voted the greatest World Cup goal of that tournament" },

  'Paraguay':            { titles: 0,  best: 'Quarter-finals (1930, 2010)',             appearances: 9,
    legends: ['José Luis Chilavert', 'Roque Santa Cruz'],
    note: 'Goalkeeper Chilavert was famous for scoring free-kicks and penalties — he scored 8 international goals' },

  'Japan':               { titles: 0,  best: 'Round of 16 (2002, 2010, 2018, 2022)',   appearances: 7,
    legends: ['Hidetoshi Nakata', 'Shinji Kagawa'],
    note: 'Became the first Asian team to top a World Cup group containing Germany and Spain in 2022' },

  'Australia':           { titles: 0,  best: 'Round of 16 (2006, 2022)',               appearances: 6,
    legends: ['Tim Cahill', 'Harry Kewell'],
    note: "Tim Cahill's overhead kick vs Netherlands in 2014 was voted one of the greatest World Cup goals of the decade" },

  'Norway':              { titles: 0,  best: 'Quarter-finals (1938)',                   appearances: 3,
    legends: ['Ole Gunnar Solskjær', 'Erling Haaland'],
    note: 'In 1998 they famously beat Brazil 2-1 in the group stage — Erling Haaland now leads them back to the World Cup' },

  'Ecuador':             { titles: 0,  best: 'Round of 16 (2006)',                      appearances: 4,
    legends: ['Antonio Valencia', 'Enner Valencia'],
    note: 'Enner Valencia scored three goals at the 2014 World Cup and was disqualified from celebrating one of them by his own linesman' },

  'Algeria':             { titles: 0,  best: 'Round of 16 (2014)',                      appearances: 4,
    legends: ['Rabah Madjer', 'Riyad Mahrez'],
    note: 'In 1982 they beat West Germany 2-1 but were controversially eliminated by the "Disgrace of Gijón" — a suspected fix' },

  'Iran':                { titles: 0,  best: 'Group stage',                             appearances: 6,
    legends: ['Ali Daei', 'Mehdi Taremi'],
    note: 'Ali Daei was the first footballer to score 100 international goals — a record later beaten only by Ronaldo and Messi' },

  'Saudi Arabia':        { titles: 0,  best: 'Round of 16 (1994)',                      appearances: 6,
    legends: ['Sami Al-Jaber', 'Salem Al-Dawsari'],
    note: 'Beat defending champions Argentina 2-1 in the 2022 group stage — widely considered one of the biggest upsets ever' },

  'Tunisia':             { titles: 0,  best: 'Group stage',                             appearances: 6,
    legends: ['Wahbi Khazri', 'Hassen'],
    note: 'In 1978 they became the first African nation to win a World Cup match, defeating Mexico 3-1' },

  'Ghana':               { titles: 0,  best: 'Quarter-finals (2010)',                   appearances: 4,
    legends: ['Abedi Pelé', 'Asamoah Gyan'],
    note: 'Asamoah Gyan missed a last-minute penalty in 2010 that would have sent Ghana to the semi-finals' },

  'Denmark':             { titles: 0,  best: 'Quarter-finals (1998)',                   appearances: 6,
    legends: ['Peter Schmeichel', 'Michael Laudrup'],
    note: "Didn't even qualify for Euro 92 but were called up late as replacements for Yugoslavia — and won the whole thing" },

  'Ivory Coast':         { titles: 0,  best: 'Group stage (2006, 2010, 2014)',          appearances: 3,
    legends: ['Didier Drogba', 'Yaya Touré'],
    note: 'In 2006 they were drawn into the same group as Argentina and Netherlands — possibly the toughest group ever assembled' },

  'Scotland':            { titles: 0,  best: 'Group stage (8 appearances)',             appearances: 8,
    legends: ['Kenny Dalglish', 'Denis Law'],
    note: 'Qualified 8 times but have never progressed beyond the group stage — once eliminated on goal difference from Peru in 1978' },

  'Egypt':               { titles: 0,  best: 'Group stage',                             appearances: 3,
    legends: ['Mohamed Salah', 'Hossam Hassan'],
    note: 'Hossam Hassan scored 69 international goals — an African record that stood for over 20 years' },

  'South Africa':        { titles: 0,  best: 'Group stage (hosts 2010)',                appearances: 3,
    legends: ['Benni McCarthy', 'Steven Pienaar'],
    note: 'Hosted the first ever African World Cup in 2010 but became the first host nation to be eliminated in the group stage' },

  'Canada':              { titles: 0,  best: 'Group stage (1986)',                      appearances: 2,
    legends: ['Alphonso Davies', 'Jonathan David'],
    note: "Didn't score a single goal at their 1986 debut; qualified 36 years later for 2022 as CONCACAF's top team" },

  'New Zealand':         { titles: 0,  best: 'Group stage',                             appearances: 2,
    legends: ['Ryan Nelsen', 'Chris Wood'],
    note: 'At the 2010 World Cup they drew all three group games without losing a single match — and still went home' },

  'Bosnia and Herzegovina': { titles: 0, best: 'Group stage (2014)',                   appearances: 1,
    legends: ['Edin Džeko', 'Miralem Pjanić'],
    note: 'The country declared independence in 1992; they qualified for the World Cup just 22 years later' },

  'Haiti':               { titles: 0,  best: 'Group stage (1974)',                      appearances: 1,
    legends: ['Emmanuel Sanon', 'Guy Saint-Vil'],
    note: 'Emmanuel Sanon scored vs Italy in 1974 to end goalkeeper Dino Zoff\'s 1,143-minute unbeaten run' },

  'Panama':              { titles: 0,  best: 'Group stage (2018)',                      appearances: 1,
    legends: ['Román Torres', 'Armando Cooper'],
    note: 'Félipe Baloy scored their first ever World Cup goal in the 78th minute of a 6-1 defeat to England' },

  'Qatar':               { titles: 0,  best: 'Group stage (hosts 2022)',                appearances: 1,
    legends: ['Al-Moez Ali', 'Akram Afif'],
    note: 'The only host nation ever to be eliminated in the group stage without winning a single match' },

  'Czechia':             { titles: 0,  best: 'Group stage (as Czech Republic)',         appearances: 3,
    legends: ['Pavel Nedvěd', 'Petr Čech'],
    note: 'As Czechoslovakia they reached the 1934 and 1962 World Cup finals — and lost both on both occasions' },

  'DR Congo':            { titles: 0,  best: 'Group stage (as Zaire 1974)',             appearances: 1,
    legends: ['Mulamba Ndaye', 'Dieumerci Mbokani'],
    note: 'As Zaire in 1974, defender Mwepu Ilunga famously ran out of the wall to kick away a Brazilian free-kick' },

  // 2026 debutants
  'Curaçao':             { titles: 0,  best: '2026 debut',                              appearances: 0, debut: 2026,
    legends: ['Leandro Bacuna', 'Cuco Martina'],
    note: 'With a population of around 150,000, Curaçao is one of the smallest nations ever to qualify for a World Cup' },

  'Uzbekistan':          { titles: 0,  best: '2026 debut',                              appearances: 0, debut: 2026,
    legends: ['Eldor Shomurodov', 'Jaloliddin Masharipov'],
    note: 'Making their World Cup debut in 2026 — a historic moment for football in Central Asia and their 35 million people' },

  'Jordan':              { titles: 0,  best: '2026 debut',                              appearances: 0, debut: 2026,
    legends: ['Ahmad Hayel', 'Baha Faisal'],
    note: 'Jordan qualified for their first World Cup via the Asian play-off — a historic landmark for football in the Middle East' },

  'Cape Verde':          { titles: 0,  best: '2026 debut',                              appearances: 0, debut: 2026,
    legends: ['Ryan Mendes', 'Garry Rodrigues'],
    note: 'An island archipelago of just 500,000 people in the Atlantic Ocean, making their first World Cup appearance' },
};

export function getWCHistory(teamName: string): WCHistory | null {
  return WC_HISTORY[teamName] ?? null;
}
