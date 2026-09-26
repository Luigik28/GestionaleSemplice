import { useState } from 'react'
import type { Action } from '../store'
import { newId } from '../store'
import type { AppData } from '../types'
import { Modal } from './Modal'

interface Props {
  data: AppData
  dispatch: React.Dispatch<Action>
  onClose: () => void
  initialListId?: string
}

export function ListsManager({ data, dispatch, onClose, initialListId }: Props) {
  const [selId, setSelId] = useState(initialListId ?? data.lists[0]?.id ?? '')
  const [newValue, setNewValue] = useState('')
  const [filter, setFilter] = useState('')
  const list = data.lists.find((l) => l.id === selId) ?? data.lists[0]

  const usedBy = (listId: string) => data.columns.filter((c) => c.listId === listId)

  const addValue = (e: React.FormEvent) => {
    e.preventDefault()
    const v = newValue.trim()
    if (!list || !v) return
    if (list.values.includes(v)) {
      window.alert(`"${v}" è già presente nell'elenco.`)
      return
    }
    dispatch({ type: 'addListValue', listId: list.id, value: v })
    setNewValue('')
  }

  const renameValue = (oldValue: string) => {
    if (!list) return
    const v = window.prompt(
      `Nuovo nome per "${oldValue}".\nVerrà aggiornato anche in tutte le righe che lo usano.`,
      oldValue,
    )?.trim()
    if (!v || v === oldValue) return
    dispatch({ type: 'renameListValue', listId: list.id, oldValue, newValue: v })
  }

  const removeValue = (v: string) => {
    if (!list) return
    if (window.confirm(`Rimuovere "${v}" dall'elenco?\nLe righe che lo usano manterranno il valore.`))
      dispatch({ type: 'removeListValue', listId: list.id, value: v })
  }

  const addList = () => {
    const name = window.prompt('Nome del nuovo elenco:')?.trim()
    if (!name) return
    const id = newId()
    dispatch({ type: 'addList', list: { id, name, values: [] } })
    setSelId(id)
  }

  const renameList = () => {
    if (!list) return
    const name = window.prompt("Nuovo nome dell'elenco:", list.name)?.trim()
    if (name && name !== list.name) dispatch({ type: 'renameList', id: list.id, name })
  }

  const removeList = () => {
    if (!list) return
    const cols = usedBy(list.id)
    if (cols.length) {
      window.alert(
        `L'elenco è usato dalle colonne: ${cols.map((c) => c.label).join(', ')}.\nElimina prima queste colonne.`,
      )
      return
    }
    if (window.confirm(`Eliminare l'elenco "${list.name}"?`)) {
      dispatch({ type: 'removeList', id: list.id })
      setSelId(data.lists.find((l) => l.id !== list.id)?.id ?? '')
    }
  }

  const shown = list?.values.filter((v) => v.toLocaleLowerCase('it').includes(filter.trim().toLocaleLowerCase('it'))) ?? []

  return (
    <Modal title="Elenchi (medici, prodotti, …)" onClose={onClose} wide>
      <div className="lists-top">
        <label>
          <span>Elenco</span>
          <select value={list?.id ?? ''} onChange={(e) => setSelId(e.target.value)}>
            {data.lists.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.values.length})
              </option>
            ))}
          </select>
        </label>
        <div className="btn-row">
          {list && <button onClick={renameList}>Rinomina</button>}
          {list && (
            <button className="danger" onClick={removeList}>
              Elimina elenco
            </button>
          )}
          <button onClick={addList}>+ Nuovo elenco</button>
        </div>
      </div>

      {list ? (
        <>
          <p className="muted small">
            Usato da: {usedBy(list.id).map((c) => c.label).join(', ') || 'nessuna colonna'}
          </p>
          <form className="add-form" onSubmit={addValue}>
            <label className="grow">
              <span>Nuovo valore</span>
              <input value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="es. Dott. Rossi" />
            </label>
            <button className="primary" type="submit">
              Aggiungi
            </button>
          </form>
          {list.values.length > 8 && (
            <input
              type="search"
              className="search"
              placeholder="Cerca nell'elenco…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          )}
          <ul className="manage-list">
            {shown.map((v) => (
              <li key={v}>
                <span className="grow">{v}</span>
                <button onClick={() => renameValue(v)}>Rinomina</button>
                <button className="danger" onClick={() => removeValue(v)}>
                  Rimuovi
                </button>
              </li>
            ))}
            {list.values.length === 0 && <li className="muted">L'elenco è vuoto.</li>}
          </ul>
        </>
      ) : (
        <p className="muted">Nessun elenco. Creane uno con “+ Nuovo elenco”.</p>
      )}
    </Modal>
  )
}
