import { useEffect, useReducer } from 'react'
import type { AppData, Column, Row, ValueList } from './types'

const STORAGE_KEY = 'gestionale-semplice:v1'

export const newId = () =>
  crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36)

export function defaultData(): AppData {
  return {
    version: 1,
    lists: [
      { id: 'medici', name: 'Medici di base', values: [] },
      { id: 'prodotti', name: 'Prodotti', values: [] },
    ],
    columns: [
      { id: 'nome', label: 'Nome', type: 'text' },
      { id: 'cognome', label: 'Cognome', type: 'text' },
      { id: 'prodotto', label: 'Prodotto', type: 'list', listId: 'prodotti' },
      { id: 'medico', label: 'Medico di base', type: 'list', listId: 'medici' },
    ],
    rows: [],
  }
}

export function validateData(raw: unknown): AppData {
  const d = raw as AppData
  if (
    !d ||
    d.version !== 1 ||
    !Array.isArray(d.columns) ||
    !Array.isArray(d.lists) ||
    !Array.isArray(d.rows)
  ) {
    throw new Error('File di backup non valido')
  }
  return d
}

function load(): AppData {
  try {
    const s = localStorage.getItem(STORAGE_KEY)
    if (s) return validateData(JSON.parse(s))
  } catch {
    /* dati assenti o corrotti: si riparte dai predefiniti */
  }
  return defaultData()
}

export type Action =
  | { type: 'replaceAll'; data: AppData }
  | { type: 'addColumn'; column: Column }
  | { type: 'updateColumn'; id: string; patch: Partial<Column> }
  | { type: 'removeColumn'; id: string }
  | { type: 'moveColumn'; fromId: string; toIndex: number }
  | { type: 'addList'; list: ValueList }
  | { type: 'renameList'; id: string; name: string }
  | { type: 'removeList'; id: string }
  | { type: 'addListValue'; listId: string; value: string }
  | { type: 'renameListValue'; listId: string; oldValue: string; newValue: string }
  | { type: 'removeListValue'; listId: string; value: string }
  | { type: 'upsertRow'; row: Row }
  | { type: 'setCell'; rowId: string; columnId: string; value: string }
  | { type: 'removeRow'; id: string }

const sortIt = (a: string[]) => [...a].sort((x, y) => x.localeCompare(y, 'it'))

function reducer(state: AppData, a: Action): AppData {
  switch (a.type) {
    case 'replaceAll':
      return a.data
    case 'addColumn':
      return { ...state, columns: [...state.columns, a.column] }
    case 'updateColumn':
      return {
        ...state,
        columns: state.columns.map((c) => (c.id === a.id ? { ...c, ...a.patch } : c)),
      }
    case 'removeColumn':
      return {
        ...state,
        columns: state.columns.filter((c) => c.id !== a.id),
        rows: state.rows.map((r) => {
          const { [a.id]: _removed, ...rest } = r.values
          return { ...r, values: rest }
        }),
      }
    case 'moveColumn': {
      const cols = [...state.columns]
      const from = cols.findIndex((c) => c.id === a.fromId)
      if (from < 0) return state
      const [col] = cols.splice(from, 1)
      cols.splice(Math.max(0, Math.min(a.toIndex, cols.length)), 0, col)
      return { ...state, columns: cols }
    }
    case 'addList':
      return { ...state, lists: [...state.lists, a.list] }
    case 'renameList':
      return {
        ...state,
        lists: state.lists.map((l) => (l.id === a.id ? { ...l, name: a.name } : l)),
      }
    case 'removeList':
      return { ...state, lists: state.lists.filter((l) => l.id !== a.id) }
    case 'addListValue':
      return {
        ...state,
        lists: state.lists.map((l) =>
          l.id === a.listId && !l.values.includes(a.value)
            ? { ...l, values: sortIt([...l.values, a.value]) }
            : l,
        ),
      }
    case 'renameListValue': {
      // Rinominare un valore aggiorna anche tutte le righe che lo usano
      const colIds = state.columns.filter((c) => c.listId === a.listId).map((c) => c.id)
      return {
        ...state,
        lists: state.lists.map((l) =>
          l.id === a.listId
            ? {
                ...l,
                values: sortIt(
                  Array.from(new Set(l.values.map((v) => (v === a.oldValue ? a.newValue : v)))),
                ),
              }
            : l,
        ),
        rows: state.rows.map((r) => {
          if (!colIds.some((id) => r.values[id] === a.oldValue)) return r
          const values = { ...r.values }
          for (const id of colIds) if (values[id] === a.oldValue) values[id] = a.newValue
          return { ...r, values }
        }),
      }
    }
    case 'removeListValue':
      return {
        ...state,
        lists: state.lists.map((l) =>
          l.id === a.listId ? { ...l, values: l.values.filter((v) => v !== a.value) } : l,
        ),
      }
    case 'upsertRow': {
      const exists = state.rows.some((r) => r.id === a.row.id)
      return {
        ...state,
        rows: exists
          ? state.rows.map((r) => (r.id === a.row.id ? a.row : r))
          : [...state.rows, a.row],
      }
    }
    case 'setCell':
      return {
        ...state,
        rows: state.rows.map((r) =>
          r.id === a.rowId ? { ...r, values: { ...r.values, [a.columnId]: a.value } } : r,
        ),
      }
    case 'removeRow':
      return { ...state, rows: state.rows.filter((r) => r.id !== a.id) }
  }
}

export function useAppData() {
  const [data, dispatch] = useReducer(reducer, undefined, load)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      /* storage non disponibile (es. navigazione privata) */
    }
  }, [data])
  return [data, dispatch] as const
}
