import { useState } from 'react'
import type { Action } from '../store'
import { newId } from '../store'
import { TYPE_LABELS, type AppData, type ColumnType } from '../types'
import { Modal } from './Modal'

interface Props {
  data: AppData
  dispatch: React.Dispatch<Action>
  onClose: () => void
}

const NEW_LIST = '__nuovo__'

export function ColumnsManager({ data, dispatch, onClose }: Props) {
  const [label, setLabel] = useState('')
  const [type, setType] = useState<ColumnType>('text')
  const [listId, setListId] = useState<string>(data.lists[0]?.id ?? NEW_LIST)
  const [newListName, setNewListName] = useState('')

  const listName = (id?: string) => data.lists.find((l) => l.id === id)?.name ?? '—'

  const add = (e: React.FormEvent) => {
    e.preventDefault()
    const name = label.trim()
    if (!name) return
    let lid: string | undefined
    if (type === 'list') {
      if (listId === NEW_LIST) {
        lid = newId()
        dispatch({ type: 'addList', list: { id: lid, name: newListName.trim() || name, values: [] } })
      } else lid = listId
    }
    dispatch({ type: 'addColumn', column: { id: newId(), label: name, type, listId: lid } })
    setLabel('')
    setNewListName('')
  }

  const remove = (id: string, name: string) => {
    const used = data.rows.some((r) => (r.values[id] ?? '') !== '')
    const msg = used
      ? `Eliminare la colonna "${name}"?\nI dati contenuti in questa colonna verranno cancellati da tutte le righe.`
      : `Eliminare la colonna "${name}"?`
    if (window.confirm(msg)) dispatch({ type: 'removeColumn', id })
  }

  return (
    <Modal title="Colonne" onClose={onClose} wide>
      <p className="muted small">
        Puoi riordinare le colonne con le frecce oppure trascinando le intestazioni della tabella.
      </p>
      <ul className="manage-list">
        {data.columns.map((c, i) => (
          <li key={c.id}>
            <div className="order-btns">
              <button
                className="icon-btn"
                disabled={i === 0}
                onClick={() => dispatch({ type: 'moveColumn', fromId: c.id, toIndex: i - 1 })}
                aria-label={`Sposta ${c.label} a sinistra`}
                title="Sposta prima"
              >
                ↑
              </button>
              <button
                className="icon-btn"
                disabled={i === data.columns.length - 1}
                onClick={() => dispatch({ type: 'moveColumn', fromId: c.id, toIndex: i + 1 })}
                aria-label={`Sposta ${c.label} a destra`}
                title="Sposta dopo"
              >
                ↓
              </button>
            </div>
            <input
              className="grow"
              defaultValue={c.label}
              aria-label="Nome colonna"
              onBlur={(e) => {
                const v = e.target.value.trim()
                if (v && v !== c.label) dispatch({ type: 'updateColumn', id: c.id, patch: { label: v } })
                else e.target.value = c.label
              }}
            />
            <span className="tag">
              {TYPE_LABELS[c.type]}
              {c.type === 'list' && `: ${listName(c.listId)}`}
            </span>
            <button className="danger" onClick={() => remove(c.id, c.label)}>
              Elimina
            </button>
          </li>
        ))}
        {data.columns.length === 0 && <li className="muted">Nessuna colonna.</li>}
      </ul>

      <h3>Aggiungi colonna</h3>
      <form className="add-form" onSubmit={add}>
        <label>
          <span>Nome</span>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="es. Telefono" required />
        </label>
        <label>
          <span>Tipo</span>
          <select value={type} onChange={(e) => setType(e.target.value as ColumnType)}>
            {Object.entries(TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        {type === 'list' && (
          <label>
            <span>Elenco valori</span>
            <select value={listId} onChange={(e) => setListId(e.target.value)}>
              {data.lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
              <option value={NEW_LIST}>+ Nuovo elenco…</option>
            </select>
          </label>
        )}
        {type === 'list' && listId === NEW_LIST && (
          <label>
            <span>Nome nuovo elenco</span>
            <input
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder={label.trim() || 'es. Farmacie'}
            />
          </label>
        )}
        <button className="primary" type="submit">
          Aggiungi
        </button>
      </form>
    </Modal>
  )
}
