export type ColumnType = 'text' | 'number' | 'date' | 'list'

export interface Column {
  id: string
  label: string
  type: ColumnType
  /** Solo per le colonne di tipo "list": elenco di valori da cui scegliere */
  listId?: string
}

export interface ValueList {
  id: string
  name: string
  values: string[]
}

/** I valori sono sempre salvati come stringhe (date in formato YYYY-MM-DD) */
export interface Row {
  id: string
  values: Record<string, string>
}

export interface AppData {
  version: 1
  columns: Column[]
  lists: ValueList[]
  rows: Row[]
}

export type Filter =
  | { kind: 'text'; value: string }
  | { kind: 'range'; min: string; max: string }
  | { kind: 'set'; values: string[] }

export const TYPE_LABELS: Record<ColumnType, string> = {
  text: 'Testo',
  number: 'Numero',
  date: 'Data',
  list: 'Elenco a scelta',
}
