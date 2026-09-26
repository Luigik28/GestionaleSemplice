import { useMemo, useRef, useState } from 'react'
import { ColumnsManager } from './components/ColumnsManager'
import { confirmNewListValue, ListDatalists } from './components/FieldInput'
import { FilterControl } from './components/FilterControl'
import { InlineCell } from './components/InlineCell'
import { ListsManager } from './components/ListsManager'
import { RowForm } from './components/RowForm'
import { downloadBlob, exportXlsx } from './export'
import { applyFilters, emptyFilterFor, isActive, sortRows, type Sort } from './filters'
import { defaultData, newId, useAppData, validateData } from './store'
import type { Column, Filter, Row } from './types'

type Dialog = { kind: 'columns' } | { kind: 'lists' } | { kind: 'row'; row?: Row } | null

export default function App() {
  const [data, dispatch] = useAppData()
  const [filters, setFilters] = useState<Record<string, Filter>>({})
  const [dialog, setDialog] = useState<Dialog>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [dropId, setDropId] = useState<string | null>(null)
  const [sort, setSort] = useState<Sort | null>(null)
  const [exporting, setExporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const listById = useMemo(() => new Map(data.lists.map((l) => [l.id, l])), [data.lists])
  const filterOf = (c: Column) => {
    const f = filters[c.id]
    return f && f.kind === emptyFilterFor(c).kind ? f : emptyFilterFor(c)
  }
  const effectiveFilters = Object.fromEntries(data.columns.map((c) => [c.id, filterOf(c)]))
  const sortColumn = data.columns.find((c) => c.id === sort?.columnId)
  const visibleRows = sortRows(
    applyFilters(data.rows, data.columns, effectiveFilters),
    sortColumn,
    sort?.dir ?? 'asc',
  )

  // Clic sull'intestazione: crescente → decrescente → nessun ordinamento
  const toggleSort = (columnId: string) =>
    setSort((s) =>
      s?.columnId !== columnId
        ? { columnId, dir: 'asc' }
        : s.dir === 'asc'
          ? { columnId, dir: 'desc' }
          : null,
    )
  const activeCount = data.columns.filter((c) => isActive(effectiveFilters[c.id])).length

  const setOptions = (c: Column) => {
    const s = new Set(c.listId ? listById.get(c.listId)?.values : [])
    for (const r of data.rows) {
      const v = r.values[c.id]
      if (v) s.add(v)
    }
    return [...s].sort((a, b) => a.localeCompare(b, 'it'))
  }

  const commitCell = (row: Row, c: Column, value: string) => {
    if (c.type === 'list' && c.listId && confirmNewListValue(listById.get(c.listId), value)) {
      dispatch({ type: 'addListValue', listId: c.listId, value })
    }
    dispatch({ type: 'setCell', rowId: row.id, columnId: c.id, value })
  }

  const addEmptyRow = () => dispatch({ type: 'upsertRow', row: { id: newId(), values: {} } })

  const removeRow = (row: Row) => {
    const desc = data.columns
      .slice(0, 2)
      .map((c) => row.values[c.id])
      .filter(Boolean)
      .join(' ')
    if (window.confirm(`Eliminare la riga${desc ? ` "${desc}"` : ''}?`)) dispatch({ type: 'removeRow', id: row.id })
  }

  const doExport = async () => {
    setExporting(true)
    try {
      await exportXlsx(data.columns, visibleRows)
    } catch (e) {
      window.alert('Errore durante l’esportazione: ' + (e as Error).message)
    } finally {
      setExporting(false)
    }
  }

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    downloadBlob(blob, `gestionale-backup-${new Date().toISOString().slice(0, 10)}.json`)
  }

  const importBackup = async (file: File) => {
    try {
      const parsed = validateData(JSON.parse(await file.text()))
      if (
        window.confirm(
          `Importare il backup "${file.name}"?\n(${parsed.rows.length} righe, ${parsed.columns.length} colonne)\nI dati attuali verranno sostituiti.`,
        )
      ) {
        dispatch({ type: 'replaceAll', data: parsed })
        setFilters({})
      }
    } catch (e) {
      window.alert('Impossibile importare il file: ' + (e as Error).message)
    }
  }

  const resetAll = () => {
    if (
      window.confirm(
        'Cancellare TUTTI i dati (righe, colonne ed elenchi) e ripartire dalla configurazione iniziale?\nConsiglio: esporta prima un backup.',
      )
    ) {
      dispatch({ type: 'replaceAll', data: defaultData() })
      setFilters({})
    }
  }

  const onDrop = (targetId: string) => {
    if (dragId && dragId !== targetId) {
      dispatch({ type: 'moveColumn', fromId: dragId, toIndex: data.columns.findIndex((c) => c.id === targetId) })
    }
    setDragId(null)
    setDropId(null)
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1>Gestionale Semplice</h1>
        <div className="toolbar">
          <button className="primary" onClick={() => setDialog({ kind: 'row' })}>
            + Nuova riga
          </button>
          <button onClick={addEmptyRow} title="Aggiunge una riga vuota da compilare direttamente in tabella">
            + Riga vuota
          </button>
          <button onClick={() => setDialog({ kind: 'columns' })}>Colonne</button>
          <button onClick={() => setDialog({ kind: 'lists' })}>Medici e prodotti</button>
          <button onClick={doExport} disabled={exporting || data.columns.length === 0}>
            {exporting ? 'Esportazione…' : 'Esporta Excel'}
          </button>
          <details className="menu">
            <summary>Backup ▾</summary>
            <div className="menu-panel">
              <button onClick={exportBackup}>Scarica backup (.json)</button>
              <button onClick={() => fileRef.current?.click()}>Importa backup…</button>
              <button className="danger" onClick={resetAll}>
                Cancella tutto
              </button>
            </div>
          </details>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) importBackup(f)
              e.target.value = ''
            }}
          />
        </div>
      </header>

      <div className="status">
        <span>
          {visibleRows.length === data.rows.length
            ? `${data.rows.length} righe`
            : `${visibleRows.length} di ${data.rows.length} righe`}
        </span>
        {activeCount > 0 && (
          <button className="link" onClick={() => setFilters({})}>
            Rimuovi filtri ({activeCount})
          </button>
        )}
        {sortColumn && (
          <button className="link" onClick={() => setSort(null)}>
            Rimuovi ordinamento ({sortColumn.label} {sort?.dir === 'asc' ? '▲' : '▼'})
          </button>
        )}
        <span className="muted small hide-mobile">
          Clic sull’intestazione per ordinare, trascinala per spostare la colonna · L’esportazione rispetta filtri e ordinamento
        </span>
      </div>

      <ListDatalists lists={data.lists} />

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {data.columns.map((c) => (
                <th
                  key={c.id}
                  draggable
                  className={(dragId === c.id ? 'dragging ' : '') + (dropId === c.id && dragId !== c.id ? 'drop-target' : '')}
                  onDragStart={(e) => {
                    setDragId(c.id)
                    e.dataTransfer.effectAllowed = 'move'
                    e.dataTransfer.setData('text/plain', c.id)
                  }}
                  onDragOver={(e) => {
                    if (!dragId) return
                    e.preventDefault()
                    setDropId(c.id)
                  }}
                  onDragLeave={() => setDropId((d) => (d === c.id ? null : d))}
                  onDrop={(e) => {
                    e.preventDefault()
                    onDrop(c.id)
                  }}
                  onDragEnd={() => {
                    setDragId(null)
                    setDropId(null)
                  }}
                  title="Clic per ordinare · Trascina per spostare la colonna"
                  aria-sort={
                    sortColumn?.id === c.id ? (sort?.dir === 'asc' ? 'ascending' : 'descending') : undefined
                  }
                  onClick={() => toggleSort(c.id)}
                >
                  <span className="grip" aria-hidden>
                    ⋮⋮
                  </span>
                  {c.label}
                  <span className={'sort-ind' + (sortColumn?.id === c.id ? ' on' : '')} aria-hidden>
                    {sortColumn?.id === c.id ? (sort?.dir === 'asc' ? '▲' : '▼') : '↕'}
                  </span>
                </th>
              ))}
              <th className="actions-col" aria-label="Azioni" />
            </tr>
            <tr className="filters-row">
              {data.columns.map((c) => (
                <th key={c.id}>
                  <FilterControl
                    column={c}
                    filter={filterOf(c)}
                    options={c.type === 'list' ? setOptions(c) : []}
                    onChange={(f) => setFilters((s) => ({ ...s, [c.id]: f }))}
                  />
                </th>
              ))}
              <th className="actions-col" />
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((r) => (
              <tr key={r.id}>
                {data.columns.map((c) => (
                  <td key={c.id}>
                    <InlineCell
                      column={c}
                      list={c.listId ? listById.get(c.listId) : undefined}
                      value={r.values[c.id] ?? ''}
                      onCommit={(v) => commitCell(r, c, v)}
                    />
                  </td>
                ))}
                <td className="actions-col">
                  <button className="icon-btn" title="Modifica con modulo" onClick={() => setDialog({ kind: 'row', row: r })}>
                    ✎
                  </button>
                  <button className="icon-btn danger" title="Elimina riga" onClick={() => removeRow(r)}>
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.rows.length === 0 && (
          <div className="empty">
            Nessuna riga. Usa <b>+ Nuova riga</b> per inserire il primo record.
          </div>
        )}
        {data.rows.length > 0 && visibleRows.length === 0 && (
          <div className="empty">Nessuna riga corrisponde ai filtri.</div>
        )}
      </div>

      {dialog?.kind === 'columns' && <ColumnsManager data={data} dispatch={dispatch} onClose={() => setDialog(null)} />}
      {dialog?.kind === 'lists' && <ListsManager data={data} dispatch={dispatch} onClose={() => setDialog(null)} />}
      {dialog?.kind === 'row' && (
        <RowForm data={data} dispatch={dispatch} row={dialog.row} onClose={() => setDialog(null)} />
      )}
    </div>
  )
}
