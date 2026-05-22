const SHEETS_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQLMQfk2cAKmi6FmPkwCkFexAVqrSyUKyq2MeraUzdzo6OCtG-eU1yrRMC0-Y-dqWHWpidcx2kmJ0qG/pub?output=csv';

export interface SheetRow {
  team: string;
  name: string | null;
}

export async function fetchSheetData(): Promise<SheetRow[]> {
  const res = await fetch(SHEETS_CSV_URL, {
    cache: 'no-store',
    redirect: 'follow',
  });

  if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`);

  const text = await res.text();
  const lines = text.split('\n');

  return lines
    .slice(1) // skip header
    .filter(line => line.trim())
    .map(line => {
      const parts = parseCSVLine(line);
      return {
        team: (parts[0] ?? '').trim().replace(/\r/g, ''),
        name: (parts[1] ?? '').trim().replace(/\r/g, '') || null,
      };
    })
    .filter(row => row.team.length > 0);
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
