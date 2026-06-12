export interface StaticCountryData {
  capital: string;
  population: number;
  area: number;
  currency: string;
}

export const COUNTRY_DATA: Record<string, StaticCountryData> = {
  // Group A
  'Mexico':               { capital: 'Mexico City',    population: 130_000_000, area: 1_964_375, currency: 'Mexican peso' },
  'South Africa':         { capital: 'Pretoria',        population:  60_600_000, area: 1_221_037, currency: 'South African rand' },
  'South Korea':          { capital: 'Seoul',           population:  51_700_000, area:    100_339, currency: 'South Korean won' },
  'Czechia':              { capital: 'Prague',          population:  10_900_000, area:     78_866, currency: 'Czech koruna' },
  // Group B
  'Canada':               { capital: 'Ottawa',          population:  38_250_000, area: 9_984_670, currency: 'Canadian dollar' },
  'Bosnia and Herzegovina': { capital: 'Sarajevo',      population:   3_300_000, area:     51_197, currency: 'Convertible mark' },
  'Qatar':                { capital: 'Doha',            population:   2_930_000, area:     11_586, currency: 'Qatari riyal' },
  'Switzerland':          { capital: 'Bern',            population:   8_700_000, area:     41_285, currency: 'Swiss franc' },
  // Group C
  'Brazil':               { capital: 'Brasília',        population: 215_000_000, area: 8_515_767, currency: 'Brazilian real' },
  'Morocco':              { capital: 'Rabat',           population:  37_500_000, area:    710_850, currency: 'Moroccan dirham' },
  'Haiti':                { capital: 'Port-au-Prince',  population:  11_400_000, area:     27_750, currency: 'Haitian gourde' },
  'Scotland':             { capital: 'Edinburgh',       population:   5_500_000, area:     77_933, currency: 'Pound sterling' },
  // Group D
  'United States':        { capital: 'Washington D.C.', population: 331_000_000, area: 9_833_517, currency: 'US dollar' },
  'Paraguay':             { capital: 'Asunción',        population:   7_400_000, area:    406_752, currency: 'Paraguayan guaraní' },
  'Australia':            { capital: 'Canberra',        population:  25_900_000, area: 7_692_024, currency: 'Australian dollar' },
  'Türkiye':              { capital: 'Ankara',          population:  85_000_000, area:    783_562, currency: 'Turkish lira' },
  // Group E
  'Germany':              { capital: 'Berlin',          population:  83_200_000, area:    357_114, currency: 'Euro' },
  'Curaçao':              { capital: 'Willemstad',      population:     160_000, area:        444, currency: 'Antillean guilder' },
  'Ivory Coast':          { capital: 'Yamoussoukro',    population:  27_500_000, area:    322_463, currency: 'West African CFA franc' },
  'Ecuador':              { capital: 'Quito',           population:  18_000_000, area:    283_561, currency: 'US dollar' },
  // Group F
  'Netherlands':          { capital: 'Amsterdam',       population:  17_900_000, area:     41_543, currency: 'Euro' },
  'Japan':                { capital: 'Tokyo',           population: 125_700_000, area:    377_975, currency: 'Japanese yen' },
  'Sweden':               { capital: 'Stockholm',       population:  10_500_000, area:    450_295, currency: 'Swedish krona' },
  'Tunisia':              { capital: 'Tunis',           population:  12_000_000, area:    163_610, currency: 'Tunisian dinar' },
  // Group G
  'Belgium':              { capital: 'Brussels',        population:  11_600_000, area:     30_528, currency: 'Euro' },
  'Egypt':                { capital: 'Cairo',           population: 104_000_000, area:  1_001_449, currency: 'Egyptian pound' },
  'Iran':                 { capital: 'Tehran',          population:  86_800_000, area:  1_648_195, currency: 'Iranian rial' },
  'New Zealand':          { capital: 'Wellington',      population:   5_100_000, area:    268_021, currency: 'New Zealand dollar' },
  // Group H
  'Spain':                { capital: 'Madrid',          population:  47_400_000, area:    505_990, currency: 'Euro' },
  'Cape Verde':           { capital: 'Praia',           population:     560_000, area:      4_033, currency: 'Cape Verdean escudo' },
  'Saudi Arabia':         { capital: 'Riyadh',          population:  35_000_000, area:  2_149_690, currency: 'Saudi riyal' },
  'Uruguay':              { capital: 'Montevideo',      population:   3_500_000, area:    176_215, currency: 'Uruguayan peso' },
  // Group I
  'France':               { capital: 'Paris',           population:  67_900_000, area:    551_695, currency: 'Euro' },
  'Senegal':              { capital: 'Dakar',           population:  17_200_000, area:    196_722, currency: 'West African CFA franc' },
  'Iraq':                 { capital: 'Baghdad',         population:  41_200_000, area:    438_317, currency: 'Iraqi dinar' },
  'Norway':               { capital: 'Oslo',            population:   5_400_000, area:    385_207, currency: 'Norwegian krone' },
  // Group J
  'Argentina':            { capital: 'Buenos Aires',   population:  45_600_000, area:  2_780_400, currency: 'Argentine peso' },
  'Algeria':              { capital: 'Algiers',         population:  44_700_000, area:  2_381_741, currency: 'Algerian dinar' },
  'Austria':              { capital: 'Vienna',          population:   9_100_000, area:     83_871, currency: 'Euro' },
  'Jordan':               { capital: 'Amman',           population:  10_200_000, area:     89_342, currency: 'Jordanian dinar' },
  // Group K
  'Portugal':             { capital: 'Lisbon',          population:  10_300_000, area:     92_212, currency: 'Euro' },
  'DR Congo':             { capital: 'Kinshasa',        population:  99_000_000, area:  2_344_858, currency: 'Congolese franc' },
  'Uzbekistan':           { capital: 'Tashkent',        population:  35_300_000, area:    448_978, currency: 'Uzbekistani som' },
  'Colombia':             { capital: 'Bogotá',          population:  51_900_000, area:  1_141_748, currency: 'Colombian peso' },
  // Group L
  'England':              { capital: 'London',          population:  56_500_000, area:    130_279, currency: 'Pound sterling' },
  'Croatia':              { capital: 'Zagreb',          population:   3_900_000, area:     56_594, currency: 'Euro' },
  'Ghana':                { capital: 'Accra',           population:  32_400_000, area:    238_533, currency: 'Ghanaian cedi' },
  'Panama':               { capital: 'Panama City',     population:   4_400_000, area:     75_417, currency: 'Panamanian balboa' },
};
