import { useEffect, useRef, useState } from 'react'
import { EMPTY_TOKEN } from '../filters'
import type { Column, Filter } from '../types'

interface Props {
  column: Column
  filter: Filter
  /** Valori selezionabili (solo per colonne a elenco) */
  options: string[]
  onChange: (f: Filter) => void
}

export function FilterControl({ column, filter, options, onChange }: Props) {
  if (filter.kind === 'text') {
    return (
      <input
        className="filter-input"
        type="search"
        placeholder="Contiene…"
        aria-label={`Filtra ${column.label}`}
        value={filter.value}
        onChange={(e) => onChange({ kind: 'text', value: e.target.value })}
      />
    )
  }
  if (filter.kind === 'range') {
    const type = column.type === 'date' ? 'date' : 'number'
    return (
      <div className="filter-range">
        <input
          className="filter-input"
          type={type}
          placeholder="da"
          title="Da"
          aria-label={`${column.label} da`}
          value={filter.min}
          onChange={(e) => onChange({ ...filter, min: e.target.value })}
        />
        <input
          className="filter-input"
          type={type}
          placeholder="a"
          title="A"
          aria-label={`${column.label} a`}
          value={filter.max}
          onChange={(e) => onChange({ ...filter, max: e.target.value })}
        />
      </div>
    )
  }
  return <SetFilter column={column} filter={filter} options={options} onChange={onChange} />
}

function SetFilter({
  column,
  filter,
  options,
  onChange,
}: Props & { filter: Extract<Filter, { kind: 'set' }> }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const all = [...options, EMPTY_TOKEN]
  const toggle = (v: string) =>
    onChange({
      kind: 'set',
      values: filter.values.includes(v) ? filter.values.filter((x) => x !== v) : [...filter.values, v],
    })
  const n = filter.values.length
  const label = n === 0 ? 'Tutti' : n === 1 ? display(filter.values[0]) : `${n} selezionati`

  return (
    <div className="set-filter" ref={ref}>
      <button
        type="button"
        className={'filter-input set-btn' + (n ? ' on' : '')}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={`Filtra ${column.label}`}
      >
        <span>{label}</span> ▾
      </button>
      {open && (
        <div className="set-panel">
          <div className="set-actions">
            <button type="button" className="link" onClick={() => onChange({ kind: 'set', values: all })}>
              Seleziona tutti
            </button>
            <button type="button" className="link" onClick={() => onChange({ kind: 'set', values: [] })}>
              Azzera
            </button>
          </div>
          <div className="set-options">
            {all.map((v) => (
              <label key={v} className="check">
                <input type="checkbox" checked={filter.values.includes(v)} onChange={() => toggle(v)} />
                <span className={v === EMPTY_TOKEN ? 'muted' : ''}>{display(v)}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const display = (v: string) => (v === EMPTY_TOKEN ? '(vuoto)' : v)
