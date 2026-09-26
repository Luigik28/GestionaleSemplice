import { useState } from 'react'
import type { Action } from '../store'
import { newId } from '../store'
import type { AppData, Row } from '../types'
import { confirmNewListValue, FieldInput } from './FieldInput'
import { Modal } from './Modal'

interface Props {
  data: AppData
  dispatch: React.Dispatch<Action>
  row?: Row
  onClose: () => void
}

export function RowForm({ data, dispatch, row, onClose }: Props) {
  const [values, setValues] = useState<Record<string, string>>(() => ({ ...(row?.values ?? {}) }))
  const listById = new Map(data.lists.map((l) => [l.id, l]))

  const save = (again: boolean) => {
    const clean: Record<string, string> = { ...values }
    for (const c of data.columns) {
      const v = clean[c.id]
      if (v === undefined) continue
      if (c.type === 'text' || c.type === 'list') clean[c.id] = v.trim()
      if (c.type === 'list' && c.listId) {
        const list = listById.get(c.listId)
        if (confirmNewListValue(list, clean[c.id])) {
          dispatch({ type: 'addListValue', listId: c.listId, value: clean[c.id] })
        }
      }
    }
    dispatch({ type: 'upsertRow', row: { id: row?.id ?? newId(), values: clean } })
    if (again) setValues({})
    else onClose()
  }

  return (
    <Modal
      title={row ? 'Modifica riga' : 'Nuova riga'}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose}>Annulla</button>
          {!row && <button onClick={() => save(true)}>Salva e nuova</button>}
          <button className="primary" onClick={() => save(false)}>
            Salva
          </button>
        </>
      }
    >
      <form
        className="form-grid"
        onSubmit={(e) => {
          e.preventDefault()
          save(false)
        }}
      >
        {data.columns.map((c, i) => (
          <label key={c.id} htmlFor={`f-${c.id}`}>
            <span>{c.label}</span>
            <FieldInput
              id={`f-${c.id}`}
              column={c}
              list={c.listId ? listById.get(c.listId) : undefined}
              value={values[c.id] ?? ''}
              autoFocus={i === 0}
              onChange={(v) => setValues((s) => ({ ...s, [c.id]: v }))}
            />
          </label>
        ))}
        {data.columns.length === 0 && <p className="muted">Nessuna colonna definita.</p>}
        <button type="submit" hidden />
      </form>
    </Modal>
  )
}
