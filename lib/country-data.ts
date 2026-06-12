export interface StaticCountryData {
  capital: string;
  population: number;
  area: number;
  currency: string;
  image: string;
}

export const COUNTRY_DATA: Record<string, StaticCountryData> = {
  // Group A
  'Mexico':       { capital: 'Mexico City',    population: 130_000_000, area: 1_964_375, currency: 'Mexican peso',            image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Sobrevuelos_CDMX_HJ2A4913_%2825514321687%29_%28cropped%29.jpg/960px-Sobrevuelos_CDMX_HJ2A4913_%2825514321687%29_%28cropped%29.jpg' },
  'South Africa': { capital: 'Pretoria',        population:  60_600_000, area: 1_221_037, currency: 'South African rand',      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Johannesburg_skyline_2017.jpg/960px-Johannesburg_skyline_2017.jpg' },
  'South Korea':  { capital: 'Seoul',           population:  51_700_000, area:   100_339, currency: 'South Korean won',        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/%EC%A4%91%ED%99%94%EC%A0%84%EC%9D%98_%EB%82%AE.jpg/960px-%EC%A4%91%ED%99%94%EC%A0%84%EC%9D%98_%EB%82%AE.jpg' },
  'Czechia':      { capital: 'Prague',          population:  10_900_000, area:    78_866, currency: 'Czech koruna',            image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Prague_%286365119737%29.jpg/960px-Prague_%286365119737%29.jpg' },
  // Group B
  'Canada':                 { capital: 'Ottawa',     population:  38_250_000, area: 9_984_670, currency: 'Canadian dollar',       image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Toronto_Skyline_from_Snake_Island%2C_February_28_2026_%2808%29.jpg/960px-Toronto_Skyline_from_Snake_Island%2C_February_28_2026_%2808%29.jpg' },
  'Bosnia and Herzegovina': { capital: 'Sarajevo',   population:   3_300_000, area:    51_197, currency: 'Convertible mark',      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Sarajevo_City_Panorama.JPG/960px-Sarajevo_City_Panorama.JPG' },
  'Qatar':                  { capital: 'Doha',       population:   2_930_000, area:    11_586, currency: 'Qatari riyal',          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/The_Pearl_Marina_in_Nov_2013.jpg/960px-The_Pearl_Marina_in_Nov_2013.jpg' },
  'Switzerland':            { capital: 'Bern',       population:   8_700_000, area:    41_285, currency: 'Swiss franc',           image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Altstadt_Z%C3%BCrich_2015.jpg/960px-Altstadt_Z%C3%BCrich_2015.jpg' },
  // Group C
  'Brazil':    { capital: 'Brasília',       population: 215_000_000, area: 8_515_767, currency: 'Brazilian real',           image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Cidade_Maravilhosa.jpg/960px-Cidade_Maravilhosa.jpg' },
  'Morocco':   { capital: 'Rabat',          population:  37_500_000, area:   710_850, currency: 'Moroccan dirham',           image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Pavillon_Menarag%C3%A4rten.jpg/960px-Pavillon_Menarag%C3%A4rten.jpg' },
  'Haiti':     { capital: 'Port-au-Prince', population:  11_400_000, area:    27_750, currency: 'Haitian gourde',           image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Ouest_Department%2C_Haiti_-_panoramio_%285%29.jpg/960px-Ouest_Department%2C_Haiti_-_panoramio_%285%29.jpg' },
  'Scotland':  { capital: 'Edinburgh',      population:   5_500_000, area:    77_933, currency: 'Pound sterling',           image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Skyline_of_Edinburgh.jpg/960px-Skyline_of_Edinburgh.jpg' },
  // Group D
  'United States': { capital: 'Washington D.C.', population: 331_000_000, area: 9_833_517, currency: 'US dollar',           image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/View_of_Empire_State_Building_from_Rockefeller_Center_New_York_City_dllu_%28cropped%29.jpg/960px-View_of_Empire_State_Building_from_Rockefeller_Center_New_York_City_dllu_%28cropped%29.jpg' },
  'Paraguay':      { capital: 'Asunción',        population:   7_400_000, area:   406_752, currency: 'Paraguayan guaraní',  image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Palacio_de_Gobierno2.jpg/960px-Palacio_de_Gobierno2.jpg' },
  'Australia':     { capital: 'Canberra',        population:  25_900_000, area: 7_692_024, currency: 'Australian dollar',   image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Sydney_Opera_House_and_Harbour_Bridge_Dusk_%282%29_2019-06-21.jpg/960px-Sydney_Opera_House_and_Harbour_Bridge_Dusk_%282%29_2019-06-21.jpg' },
  'Türkiye':       { capital: 'Ankara',          population:  85_000_000, area:   783_562, currency: 'Turkish lira',        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Historical_peninsula_and_modern_skyline_of_Istanbul.jpg/960px-Historical_peninsula_and_modern_skyline_of_Istanbul.jpg' },
  // Group E
  'Germany':     { capital: 'Berlin',      population:  83_200_000, area:   357_114, currency: 'Euro',                     image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Museumsinsel_Berlin_Juli_2021_1_%28cropped%29_b.jpg/960px-Museumsinsel_Berlin_Juli_2021_1_%28cropped%29_b.jpg' },
  'Curaçao':     { capital: 'Willemstad',  population:     160_000, area:       444, currency: 'Antillean guilder',        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Handelskade_in_Willemstad.jpg/960px-Handelskade_in_Willemstad.jpg' },
  'Ivory Coast': { capital: 'Abidjan',     population:  27_500_000, area:   322_463, currency: 'West African CFA franc',   image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Visite_du_mus%C3%A9e_de_civilisation_de_C%C3%B4te_d%27Ivoire_08.jpg/960px-Visite_du_mus%C3%A9e_de_civilisation_de_C%C3%B4te_d%27Ivoire_08.jpg' },
  'Ecuador':     { capital: 'Quito',       population:  18_000_000, area:   283_561, currency: 'US dollar',               image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/FACHADA_ASAMBLEA_NACIONAL._QUITO%2C_20_DE_FEBRERO_2020._01.jpg/960px-FACHADA_ASAMBLEA_NACIONAL._QUITO%2C_20_DE_FEBRERO_2020._01.jpg' },
  // Group F
  'Netherlands': { capital: 'Amsterdam', population:  17_900_000, area:    41_543, currency: 'Euro',                      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Imagen_de_los_canales_conc%C3%A9ntricos_en_%C3%81msterdam.png/960px-Imagen_de_los_canales_conc%C3%A9ntricos_en_%C3%81msterdam.png' },
  'Japan':       { capital: 'Tokyo',     population: 125_700_000, area:   377_975, currency: 'Japanese yen',              image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Skyscrapers_of_Shinjuku_2009_January.jpg/960px-Skyscrapers_of_Shinjuku_2009_January.jpg' },
  'Sweden':      { capital: 'Stockholm', population:  10_500_000, area:   450_295, currency: 'Swedish krona',             image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Royal_Dramatic_Theatre_Stockholm.jpg/960px-Royal_Dramatic_Theatre_Stockholm.jpg' },
  'Tunisia':     { capital: 'Tunis',     population:  12_000_000, area:   163_610, currency: 'Tunisian dinar',            image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Minaret_et_patio_de_la_mosqu%C3%A9e_Zitouna_au_centre_de_la_M%C3%A9dina_de_Tunis.jpg/960px-Minaret_et_patio_de_la_mosqu%C3%A9e_Zitouna_au_centre_de_la_M%C3%A9dina_de_Tunis.jpg' },
  // Group G
  'Belgium':     { capital: 'Brussels',  population:  11_600_000, area:    30_528, currency: 'Euro',                      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Grand_Place_Bruselas_2.jpg/960px-Grand_Place_Bruselas_2.jpg' },
  'Egypt':       { capital: 'Cairo',     population: 104_000_000, area: 1_001_449, currency: 'Egyptian pound',            image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Cairo_Opera_House%2C_Al_Hurriyah_Park_and_the_Nile_river_%2814797782354%29.jpg/960px-Cairo_Opera_House%2C_Al_Hurriyah_Park_and_the_Nile_river_%2814797782354%29.jpg' },
  'Iran':        { capital: 'Tehran',    population:  86_800_000, area: 1_648_195, currency: 'Iranian rial',              image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/North_of_Tehran_Skyline_view.jpg/960px-North_of_Tehran_Skyline_view.jpg' },
  'New Zealand': { capital: 'Wellington', population:  5_100_000, area:   268_021, currency: 'New Zealand dollar',        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Auckland_skyline_-_May_2024_%282%29.jpg/960px-Auckland_skyline_-_May_2024_(2).jpg' },
  // Group H
  'Spain':        { capital: 'Madrid',     population:  47_400_000, area:   505_990, currency: 'Euro',                    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Plaza_Mayor_De_Madrid_%28215862629%29_edited.jpeg/960px-Plaza_Mayor_De_Madrid_%28215862629%29_edited.jpeg' },
  'Cape Verde':   { capital: 'Praia',      population:     560_000, area:     4_033, currency: 'Cape Verdean escudo',     image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Pal%C3%A1cio_da_Cultura%2C_Praia%2C_Cape_Verde.jpg/960px-Pal%C3%A1cio_da_Cultura%2C_Praia%2C_Cape_Verde.jpg' },
  'Saudi Arabia': { capital: 'Riyadh',     population:  35_000_000, area: 2_149_690, currency: 'Saudi riyal',            image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Riyadh_Skyline.jpg/960px-Riyadh_Skyline.jpg' },
  'Uruguay':      { capital: 'Montevideo', population:   3_500_000, area:   176_215, currency: 'Uruguayan peso',         image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/PALACIO_LEGISLATIVO_01.JPG/960px-PALACIO_LEGISLATIVO_01.JPG' },
  // Group I
  'France':   { capital: 'Paris', population:  67_900_000, area:   551_695, currency: 'Euro',                            image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/La_Tour_Eiffel_vue_de_la_Tour_Saint-Jacques%2C_Paris_ao%C3%BBt_2014_%282%29.jpg/960px-La_Tour_Eiffel_vue_de_la_Tour_Saint-Jacques%2C_Paris_ao%C3%BBt_2014_%282%29.jpg' },
  'Senegal':  { capital: 'Dakar', population:  17_200_000, area:   196_722, currency: 'West African CFA franc',          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Dakar-place-de-l%27Ind%C3%A9pendance.jpg/960px-Dakar-place-de-l%27Ind%C3%A9pendance.jpg' },
  'Iraq':     { capital: 'Baghdad', population: 41_200_000, area:   438_317, currency: 'Iraqi dinar',                    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/5628442718_b10fc2c47f_o.jpg/960px-5628442718_b10fc2c47f_o.jpg' },
  'Norway':   { capital: 'Oslo',    population:  5_400_000, area:   385_207, currency: 'Norwegian krone',                image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Nationaltheatret_evening.jpg/960px-Nationaltheatret_evening.jpg' },
  // Group J
  'Argentina': { capital: 'Buenos Aires', population:  45_600_000, area: 2_780_400, currency: 'Argentine peso',         image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Puerto_Madero%2C_Buenos_Aires_%2840689219792%29_%28cropped%29.jpg/960px-Puerto_Madero%2C_Buenos_Aires_%2840689219792%29_%28cropped%29.jpg' },
  'Algeria':   { capital: 'Algiers',      population:  44_700_000, area: 2_381_741, currency: 'Algerian dinar',         image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Botanical_Garden_Hamma.jpg/960px-Botanical_Garden_Hamma.jpg' },
  'Austria':   { capital: 'Vienna',       population:   9_100_000, area:    83_871, currency: 'Euro',                   image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Schoenbrunn_philharmoniker_2012.jpg/960px-Schoenbrunn_philharmoniker_2012.jpg' },
  'Jordan':    { capital: 'Amman',        population:  10_200_000, area:    89_342, currency: 'Jordanian dinar',        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/New_Abdali_2024.png/960px-New_Abdali_2024.png' },
  // Group K
  'Portugal':   { capital: 'Lisbon',    population:  10_300_000, area:    92_212, currency: 'Euro',                     image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Lisboa_-_Portugal_%2852597836992%29.jpg/960px-Lisboa_-_Portugal_%2852597836992%29.jpg' },
  'DR Congo':   { capital: 'Kinshasa',  population:  99_000_000, area: 2_344_858, currency: 'Congolese franc',         image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/La_Gombe%2C_Kinshasa%2C_RDC_%28cropped%29.jpg/960px-La_Gombe%2C_Kinshasa%2C_RDC_%28cropped%29.jpg' },
  'Uzbekistan': { capital: 'Tashkent',  population:  35_300_000, area:   448_978, currency: 'Uzbekistani som',         image: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f6/Nest_One_Tashkent.jpg/960px-Nest_One_Tashkent.jpg' },
  'Colombia':   { capital: 'Bogotá',    population:  51_900_000, area: 1_141_748, currency: 'Colombian peso',          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Bogota%2C_Colombia_%2836668708290%29.jpg/960px-Bogota%2C_Colombia_%2836668708290%29.jpg' },
  // Group L
  'England': { capital: 'London',      population:  56_500_000, area:   130_279, currency: 'Pound sterling',           image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/London_Skyline_%28125508655%29.jpeg/960px-London_Skyline_%28125508655%29.jpeg' },
  'Croatia': { capital: 'Zagreb',      population:   3_900_000, area:    56_594, currency: 'Euro',                     image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Zagreb_%2829255640143%29.jpg/960px-Zagreb_%2829255640143%29.jpg' },
  'Ghana':   { capital: 'Accra',       population:  32_400_000, area:   238_533, currency: 'Ghanaian cedi',            image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Acca.jpg/960px-Acca.jpg' },
  'Panama':  { capital: 'Panama City', population:   4_400_000, area:    75_417, currency: 'Panamanian balboa',        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Panama_Papers_%28148830809%29.jpeg/960px-Panama_Papers_%28148830809%29.jpeg' },
};
