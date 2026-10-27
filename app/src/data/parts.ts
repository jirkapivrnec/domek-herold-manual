// Soupis materiálu dle návodu (str. 3–6). Hmotnosti jsou převzaty ze soupisu na str. 6.

export type PartKind =
  | 'hranol'
  | 'prkno'
  | 'palubka'
  | 'modul'
  | 'okno'
  | 'stit'
  | 'dvere'
  | 'logo'
  | 'zaves'
  | 'petlice'
  | 'vrut'
  | 'podlozka'
  | 'vrtak'

export type Part = {
  no: number
  name: string
  code: string
  qty: number
  kind: PartKind
  weight?: string
  note?: string
}

export const PARTS: Part[] = [
  { no: 1, name: 'Hranol 90×90×1990 – noha1', code: 'Hranol_90x90-1990_noha1', qty: 2, kind: 'hranol', weight: '15,7 kg', note: 'rohový sloupek zadní stěny' },
  { no: 2, name: 'Hranol 90×90×1990 – noha2', code: 'Hranol_90x90-1990_noha2', qty: 4, kind: 'hranol', weight: '31,3 kg', note: 'střední sloupek zadní stěny a bočních rámů' },
  { no: 3, name: 'Hranol 90×90×2650 – noha1', code: 'Hranol_90x90-2650_noha1', qty: 2, kind: 'hranol', weight: '20,9 kg', note: 'rohový sloupek čelní stěny' },
  { no: 4, name: 'Hranol 90×90×2650 – noha2', code: 'Hranol_90x90-2650_noha2', qty: 2, kind: 'hranol', weight: '20,9 kg', note: 'střední sloupek čelní stěny (u dveří)' },
  { no: 5, name: 'Hranol 45×90×3360 – pozednice hlavní', code: 'Hranol_45x90-3360_pozednice_Hlavní', qty: 3, kind: 'hranol', weight: '22,8 kg' },
  { no: 6, name: 'Hranol 45×90×2210 – pozednice čelní', code: 'Hranol_45x90-2210_pozednice_čelní', qty: 2, kind: 'hranol', weight: '10,0 kg', note: 'název dle výrobce – použije se v bočních rámech' },
  { no: 7, name: 'Hranol 45×90×3230 – spodní', code: 'Hranol_45x90-3230_spodní', qty: 2, kind: 'hranol', weight: '14,6 kg' },
  { no: 8, name: 'Hranol 45×90×1990 – spodní', code: 'Hranol_45x90-1990_spodní', qty: 2, kind: 'hranol', weight: '9,0 kg' },
  { no: 9, name: 'Hranol 45×70×515 – ucpávka', code: 'Hranol_45x70-515_ucpavka', qty: 2, kind: 'hranol', weight: '1,8 kg' },
  { no: 10, name: 'Hranol 45×90×2730 – krov', code: 'Hranol_45x90-2730_krov_P22', qty: 3, kind: 'hranol', weight: '18,4 kg' },
  { no: 11, name: 'Prkno 20×45×200 – svlak', code: 'Prkno_20x45-200_svlak', qty: 6, kind: 'prkno', weight: '0,6 kg' },
  { no: 12, name: 'Prkno 20×45×1870 – lišta', code: 'Prkno_20x45-1870_lišta', qty: 2, kind: 'prkno', weight: '1,9 kg' },
  { no: 13, name: 'Prkno 18×120×1020 – lišta horní', code: 'Prkno_18x120-1020_lišta horní', qty: 1, kind: 'prkno', weight: '1,2 kg' },
  { no: 14, name: 'Prkno 18×45×2400 – lišta štítu', code: 'Prkno_18x45-2400_lišta_štítu', qty: 2, kind: 'prkno', weight: '2,1 kg' },
  { no: 15, name: 'Prkno 18×45×2770 – lišta střechy', code: 'Prkno_18x45-2770_lišta_střechy_P22', qty: 2, kind: 'prkno', weight: '2,5 kg' },
  { no: 16, name: 'Prkno 18×45×1785 – lišta střechy čelní', code: 'Prkno_18x45-1785_lišta_střechy_čelní_P22', qty: 2, kind: 'prkno', weight: '1,4 kg' },
  { no: 17, name: 'Prkno 18×94×2770 – štítovka', code: 'Prkno_18x94-2770_štítovka_P22', qty: 2, kind: 'prkno', weight: '5,2 kg' },
  { no: 18, name: 'Prkno 18×94×1850 – štítovka čelní', code: 'Prkno_18x94-1850_štítovka_čelní_P22', qty: 2, kind: 'prkno', weight: '3,5 kg' },
  { no: 19, name: 'Prkno 18×120×780 – lišta krycí', code: 'Prkno_18x120-780_lišta_krycí', qty: 4, kind: 'prkno', weight: '3,8 kg' },
  { no: 20, name: 'Prkno 18×94×780 – lišta krycí', code: 'Prkno_18x94-780_lišta_krycí', qty: 4, kind: 'prkno', weight: '2,9 kg' },
  { no: 21, name: 'Palubka 18×110×2660 – střecha', code: 'Palubka_18x110-2660_střecha', qty: 25, kind: 'palubka', weight: '2,8 kg' },
  { no: 22, name: 'Palubka 18×110×1000 – střecha', code: 'Palubka_18x110-1000_střecha', qty: 25, kind: 'palubka', weight: '2,8 kg' },
  { no: 23, name: 'Modul 330×1020', code: 'Modul_330x1020', qty: 54, kind: 'modul', weight: '200,1 kg' },
  { no: 24, name: 'Modul okno 660×1020', code: 'Modul_Okno_660x1020', qty: 3, kind: 'okno', weight: '25,6 kg' },
  { no: 25, name: 'Štít levý', code: 'Štít_P22_levý', qty: 1, kind: 'stit' },
  { no: 26, name: 'Štít pravý', code: 'Štít_P22_pravý', qty: 1, kind: 'stit' },
  { no: 27, name: 'Křídlo vrat pravé', code: 'Křídlo vrat_Pravé', qty: 1, kind: 'dvere', weight: '22,0 kg' },
  { no: 28, name: 'Destička s logem', code: 'Destička s logem', qty: 1, kind: 'logo', weight: '0,3 kg' },
  { no: 29, name: 'Závěs ZTO 200', code: 'Závěs ZTO 200 (DMX 89222)', qty: 2, kind: 'zaves', weight: '0,6 kg' },
  { no: 30, name: 'Petlice Domax WOGO 120', code: 'Petlice Domax WOGO 120 (DMX86142)', qty: 1, kind: 'petlice', weight: '0,1 kg' },
  { no: 31, name: 'Vrut s plochou hlavou 6×160', code: 'WR 0184 806 160', qty: 8, kind: 'vrut', weight: '0,2 kg' },
  { no: 32, name: 'Vrut se zápustnou hlavou 6×100', code: 'WR 0170 360 100', qty: 54, kind: 'vrut', weight: '0,3 kg' },
  { no: 33, name: 'Vrut s plochou hlavou 6×120', code: 'WR 0184 806 120', qty: 6, kind: 'vrut', weight: '0,2 kg' },
  { no: 34, name: 'Vrut se zápustnou hlavou 4,5×80', code: 'WR 0170 345 80', qty: 94, kind: 'vrut', weight: '0,5 kg' },
  { no: 35, name: 'Vrut se zápustnou hlavou 4,5×50', code: 'WR 0170 345 50', qty: 70, kind: 'vrut', weight: '0,3 kg' },
  { no: 36, name: 'Vrut se zápustnou hlavou 8×160', code: 'WR 0170 380 160', qty: 10, kind: 'vrut', weight: '0,4 kg' },
  { no: 37, name: 'Vrut se zápustnou hlavou 4×45', code: 'WR 0170 340 45', qty: 231, kind: 'vrut', weight: '1,1 kg' },
  { no: 38, name: 'Vrut se zápustnou hlavou 4×35', code: 'WR 0170 240 35', qty: 60, kind: 'vrut', weight: '0,3 kg' },
  { no: 39, name: 'Vrut se zápustnou hlavou 4,5×30', code: 'WR 0170 345 30', qty: 32, kind: 'vrut', weight: '0,2 kg' },
  { no: 40, name: 'Vrut s plochou hlavou 6×40', code: 'WR 0184 806 40', qty: 6, kind: 'vrut', weight: '0,2 kg' },
  { no: 41, name: 'Vrut s plochou hlavou 5×30', code: 'WR 0184 805 30', qty: 6, kind: 'vrut', weight: '0,2 kg' },
  { no: 42, name: 'Gumová podložka pod stojny 80×80×10', code: 'REZUGP_80x80x10-BA', qty: 30, kind: 'podlozka', weight: '2,7 kg' },
  { no: 43, name: 'Vrták Ø5', code: 'Vrták_D5', qty: 1, kind: 'vrtak' },
]

export const PART_BY_NO = new Map(PARTS.map((p) => [p.no, p]))

export const SPECS = [
  ['Půdorysný rozměr', '221 × 327 cm'],
  ['Půdorys střechy', '267 × 370 cm'],
  ['Vnitřní rozměr', '203 × 309 cm'],
  ['Celková výška', '281 / 209 cm'],
  ['Světlost dveřního otvoru', '93 × 187 cm'],
  ['Hmotnost', '585 kg'],
] as const
