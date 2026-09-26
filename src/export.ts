import type { Column, Row } from './types'

/** Esporta in .xlsx le righe e le colonne passate, nell'ordine in cui sono mostrate */
export async function exportXlsx(columns: Column[], rows: Row[]) {
  const { default: ExcelJS } = await import('exceljs')
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Dati')

  ws.columns = columns.map((c) => ({
    header: c.label,
    key: c.id,
    width: Math.max(12, c.label.length + 4),
    style: c.type === 'date' ? { numFmt: 'dd/mm/yyyy' } : {},
  }))
  ws.getRow(1).font = { bold: true }
  ws.views = [{ state: 'frozen', ySplit: 1 }]

  for (const r of rows) {
    const out: Record<string, string | number | Date | null> = {}
    for (const c of columns) {
      const v = r.values[c.id] ?? ''
      if (v === '') out[c.id] = null
      else if (c.type === 'number' && !Number.isNaN(Number(v))) out[c.id] = Number(v)
      else if (c.type === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(v)) out[c.id] = new Date(v + 'T00:00:00Z')
      else out[c.id] = v
    }
    ws.addRow(out)
  }

  // Adatta la larghezza delle colonne al contenuto
  ws.columns.forEach((col) => {
    let max = col.width ?? 12
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      const len = cell.value instanceof Date ? 10 : String(cell.value ?? '').length
      max = Math.max(max, Math.min(60, len + 2))
    })
    col.width = max
  })

  if (columns.length > 0) {
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } }
  }

  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const stamp = new Date().toISOString().slice(0, 10)
  downloadBlob(blob, `gestionale-${stamp}.xlsx`)
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
