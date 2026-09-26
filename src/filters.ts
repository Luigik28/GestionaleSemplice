import type { Column, Filter, Row } from './types'

export const EMPTY_TOKEN = '__vuoto__'

export function isActive(f: Filter | undefined): boolean {
  if (!f) return false
  if (f.kind === 'text') return f.value.trim() !== ''
  if (f.kind === 'range') return f.min !== '' || f.max !== ''
  return f.values.length > 0
}

function matches(col: Column, f: Filter, raw: string | undefined): boolean {
  const v = raw ?? ''
  switch (f.kind) {
    case 'text':
      return v.toLocaleLowerCase('it').includes(f.value.trim().toLocaleLowerCase('it'))
    case 'set':
      return f.values.includes(v === '' ? EMPTY_TOKEN : v)
    case 'range': {
      if (v === '') return false
      if (col.type === 'number') {
        const n = Number(v)
        if (Number.isNaN(n)) return false
        if (f.min !== '' && n < Number(f.min)) return false
        if (f.max !== '' && n > Number(f.max)) return false
        return true
      }
      // date in formato ISO YYYY-MM-DD: il confronto tra stringhe è corretto
      if (f.min !== '' && v < f.min) return false
      if (f.max !== '' && v > f.max) return false
      return true
    }
  }
}

export function applyFilters(
  rows: Row[],
  columns: Column[],
  filters: Record<string, Filter>,
): Row[] {
  const active = columns.filter((c) => isActive(filters[c.id]))
  if (active.length === 0) return rows
  return rows.filter((r) => active.every((c) => matches(c, filters[c.id], r.values[c.id])))
}

export function emptyFilterFor(col: Column): Filter {
  if (col.type === 'list') return { kind: 'set', values: [] }
  if (col.type === 'number' || col.type === 'date') return { kind: 'range', min: '', max: '' }
  return { kind: 'text', value: '' }
}
