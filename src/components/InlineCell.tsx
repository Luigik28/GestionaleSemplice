import { useEffect, useState } from 'react'
import type { Column, ValueList } from '../types'
import { FieldInput } from './FieldInput'

interface Props {
  column: Column
  list?: ValueList
  value: string
  onCommit: (v: string) => void
}

/** Cella modificabile direttamente in tabella: salva all'uscita dal campo o con Invio. */
export function InlineCell({ column, list, value, onCommit }: Props) {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])

  const commit = () => {
    const v = column.type === 'text' || column.type === 'list' ? draft.trim() : draft
    if (v !== value) onCommit(v)
    else if (draft !== v) setDraft(v)
  }

  return (
    <FieldInput
      column={column}
      list={list}
      value={draft}
      className="cell-input"
      onChange={setDraft}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
        if (e.key === 'Escape') {
          setDraft(value)
          setTimeout(() => (e.target as HTMLInputElement).blur())
        }
      }}
    />
  )
}
