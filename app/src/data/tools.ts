// Nářadí dle návodu, str. 2 („Nástroje a příprava komponentů“) + vrták z dodávky (č.43).

export type ToolId =
  | 'podpery'
  | 'vodovaha'
  | 'nuz'
  | 'zebrik'
  | 'sroubovak'
  | 'metr'
  | 'kladivo'
  | 'palicka'
  | 'pila'
  | 'kleste'
  | 'vrtacka'
  | 'vrtak'
  | 'rukavice'

export type Tool = { id: ToolId; name: string; note?: string }

export const TOOLS: Tool[] = [
  { id: 'vrtacka', name: 'Vrtačka' },
  { id: 'vrtak', name: 'Vrták Ø5 mm', note: 'součást dodávky (č.43)' },
  { id: 'sroubovak', name: 'Šroubovák' },
  { id: 'metr', name: 'Metr' },
  { id: 'vodovaha', name: 'Vodováha' },
  { id: 'podpery', name: 'Montážní podpěry' },
  { id: 'zebrik', name: 'Žebřík' },
  { id: 'pila', name: 'Ruční nebo elektrická pila' },
  { id: 'kladivo', name: 'Kladivo' },
  { id: 'palicka', name: 'Gumová palička' },
  { id: 'nuz', name: 'Nůž' },
  { id: 'kleste', name: 'Kleště' },
  { id: 'rukavice', name: 'Ochranné rukavice', note: 'doporučení návodu – aby se nezadřela tříska' },
]

export const TOOL_BY_ID = new Map(TOOLS.map((t) => [t.id, t]))
