import type { Column, ValueList } from '../types'

interface Props {
  column: Column
  list?: ValueList
  value: string
  onChange: (v: string) => void
  onBlur?: () => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  className?: string
  autoFocus?: boolean
  id?: string
}

/** Campo di input adatto al tipo di colonna. Per gli elenchi: suggerimenti + testo libero. */
export function FieldInput({ column, list, value, onChange, onBlur, onKeyDown, className, autoFocus, id }: Props) {
  const common = {
    id,
    className,
    autoFocus,
    value,
    onBlur,
    onKeyDown,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
    'aria-label': column.label,
  }
  if (column.type === 'number') return <input type="number" step="any" {...common} />
  if (column.type === 'date') return <input type="date" {...common} />
  if (column.type === 'list') {
    return (
      <input
        type="text"
        list={list ? datalistId(list.id) : undefined}
        autoComplete="off"
        placeholder="Scegli o scrivi…"
        {...common}
      />
    )
  }
  return <input type="text" {...common} />
}

export const datalistId = (listId: string) => `dl-${listId}`

/** Un solo <datalist> per elenco, condiviso da tutti i campi che lo usano */
export function ListDatalists({ lists }: { lists: ValueList[] }) {
  return (
    <>
      {lists.map((l) => (
        <datalist key={l.id} id={datalistId(l.id)}>
          {l.values.map((v) => (
            <option key={v} value={v} />
          ))}
        </datalist>
      ))}
    </>
  )
}

/**
 * Se il valore non è presente nell'elenco chiede se aggiungerlo.
 * Restituisce true se è stato aggiunto.
 */
export function confirmNewListValue(list: ValueList | undefined, value: string): boolean {
  const v = value.trim()
  if (!list || v === '' || list.values.includes(v)) return false
  return window.confirm(`"${v}" non è nell'elenco "${list.name}".\nVuoi aggiungerlo all'elenco?`)
}
