import { useState, useEffect } from 'react'
import { api } from '../api'

const defaultItem = {
  name: '', category_id: '', quantity: 1, unit: 'pcs',
  calories_per_unit: 0, protein_g: 0, carbs_g: 0,
  fiber_g: 0, sugar_g: 0, fat_g: 0,
  is_liquid: false, volume_ml: 0,
  purchase_date: '', expiry_date: '', notes: ''
}

const unitOptions = ['pcs', 'kg', 'g', 'gr', 'lb', 'oz', 'L', 'ml', 'cups', 'tbsp', 'tsp', 'cans', 'bottles', 'packs', 'bags', 'boxes', 'slices', 'servings']

export default function Inventory() {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ ...defaultItem })
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  // Bulk operations
  const [selected, setSelected] = useState(new Set())
  const [showBulkEdit, setShowBulkEdit] = useState(false)
  const [showBulkAdd, setShowBulkAdd] = useState(false)
  const [bulkForm, setBulkForm] = useState({ category_id: '', expiry_date: '', purchase_date: '', notes: '' })
  const [bulkAddRows, setBulkAddRows] = useState([{ ...defaultItem, purchase_date: new Date().toISOString().slice(0, 10) }])

  const load = () => {
    api.getInventory().then(setItems)
    api.getCategories().then(setCategories)
  }

  useEffect(() => { load() }, [])

  const openNew = () => {
    setEditing(null)
    setForm({ ...defaultItem, purchase_date: new Date().toISOString().slice(0, 10) })
    setShowModal(true)
  }

  const openEdit = (item) => {
    setEditing(item)
    setForm({
      name: item.name, category_id: item.category_id || '',
      quantity: item.quantity, unit: item.unit,
      calories_per_unit: item.calories_per_unit,
      protein_g: item.protein_g, carbs_g: item.carbs_g,
      fiber_g: item.fiber_g, sugar_g: item.sugar_g, fat_g: item.fat_g,
      is_liquid: !!item.is_liquid, volume_ml: item.volume_ml,
      purchase_date: item.purchase_date || '', expiry_date: item.expiry_date || '',
      notes: item.notes || '',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    if (editing) {
      await api.updateItem(editing.id, form)
    } else {
      await api.createItem(form)
    }
    setShowModal(false)
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return
    try {
      await api.deleteItem(id)
      load()
    } catch (err) {
      alert('Failed to delete item: ' + err.message)
    }
  }

  // Bulk operations
  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(i => i.id)))
    }
  }

  const handleDuplicate = async () => {
    if (selected.size === 0) return
    if (!confirm(`Duplicate ${selected.size} selected item(s)?`)) return
    await api.duplicateItems([...selected])
    setSelected(new Set())
    load()
  }

  const handleBulkDelete = async () => {
    if (selected.size === 0) return
    if (!confirm(`Delete ${selected.size} selected item(s)?`)) return
    try {
      await api.bulkDeleteItems([...selected])
      setSelected(new Set())
      load()
    } catch (err) {
      alert('Failed to delete items: ' + err.message)
    }
  }

  const openBulkEdit = () => {
    setBulkForm({ category_id: '', expiry_date: '', purchase_date: '', notes: '' })
    setShowBulkEdit(true)
  }

  const handleBulkEdit = async (e) => {
    e.preventDefault()
    const updates = {}
    if (bulkForm.category_id) updates.category_id = bulkForm.category_id
    if (bulkForm.expiry_date) updates.expiry_date = bulkForm.expiry_date
    if (bulkForm.purchase_date) updates.purchase_date = bulkForm.purchase_date
    if (bulkForm.notes) updates.notes = bulkForm.notes
    if (Object.keys(updates).length === 0) return
    await api.bulkUpdateItems([...selected], updates)
    setShowBulkEdit(false)
    setSelected(new Set())
    load()
  }

  // Bulk Add
  const openBulkAdd = () => {
    setBulkAddRows([{ ...defaultItem, purchase_date: new Date().toISOString().slice(0, 10) }])
    setShowBulkAdd(true)
  }

  const updateBulkRow = (idx, field, value) => {
    setBulkAddRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r))
  }

  const addBulkRow = () => {
    setBulkAddRows(prev => [...prev, { ...defaultItem, purchase_date: new Date().toISOString().slice(0, 10) }])
  }

  const removeBulkRow = (idx) => {
    setBulkAddRows(prev => prev.filter((_, i) => i !== idx))
  }

  const handleBulkAdd = async (e) => {
    e.preventDefault()
    const valid = bulkAddRows.filter(r => r.name.trim())
    if (valid.length === 0) return
    for (const row of valid) {
      await api.createItem(row)
    }
    setShowBulkAdd(false)
    load()
  }

  const today = new Date().toISOString().slice(0, 10)
  const filtered = items.filter(item => {
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false
    if (filter === 'food') return !item.is_liquid
    if (filter === 'liquid') return !!item.is_liquid
    if (filter === 'expiring') return item.expiry_date && item.expiry_date <= new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10) && item.expiry_date >= today
    if (filter === 'expired') return item.expiry_date && item.expiry_date < today
    return true
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Inventory</h2>
          <div className="subtitle">{items.length} item{items.length !== 1 ? 's' : ''} tracked</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={openBulkAdd}>⊕ Bulk Add</button>
          <button className="btn btn-primary" onClick={openNew}>+ Add Item</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="pill-tabs" style={{ marginBottom: 0 }}>
          {[['all', 'All'], ['food', 'Food'], ['liquid', 'Liquids'], ['expiring', 'Expiring'], ['expired', 'Expired']].map(([key, label]) => (
            <button key={key} className={`pill-tab${filter === key ? ' active' : ''}`} onClick={() => setFilter(key)}>{label}</button>
          ))}
        </div>
        <input
          className="form-input"
          placeholder="Search items..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 240 }}
        />
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div style={{
          display: 'flex', gap: 10, alignItems: 'center', padding: '10px 16px',
          background: 'var(--accent-dim)', border: '1px solid var(--accent)',
          borderRadius: 'var(--radius)', marginBottom: 16
        }}>
          <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{selected.size} selected</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={handleDuplicate}>⊕ Duplicate</button>
            <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={openBulkEdit}>✎ Bulk Edit</button>
            <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px', color: 'var(--red)' }} onClick={handleBulkDelete}>✕ Delete</button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">▦</div>
          <p>No items found</p>
          <button className="btn btn-primary" onClick={openNew}>Add your first item</button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 36 }}>
                    <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} />
                  </th>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Qty</th>
                  <th>Cal/unit</th>
                  <th>P / C / F</th>
                  <th>Purchased</th>
                  <th>Expires</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => {
                  const isExpired = item.expiry_date && item.expiry_date < today
                  const isExpiring = item.expiry_date && !isExpired && item.expiry_date <= new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10)
                  const isSelected = selected.has(item.id)
                  return (
                    <tr key={item.id} style={isSelected ? { background: 'var(--accent-dim)' } : undefined}>
                      <td>
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(item.id)} />
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{item.name}</div>
                        {item.is_liquid ? <span className="badge badge-cyan" style={{ marginTop: 2 }}>liquid</span> : null}
                      </td>
                      <td>
                        {item.category_name ? (
                          <>
                            <span className="category-dot" style={{ backgroundColor: item.category_color }} />
                            {item.category_name}
                          </>
                        ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td style={{ fontFamily: 'var(--mono)' }}>{item.quantity} {item.unit}</td>
                      <td style={{ fontFamily: 'var(--mono)' }}>{item.calories_per_unit}</td>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: '0.78rem' }}>
                        {item.protein_g}g / {item.carbs_g}g / {item.fat_g}g
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{item.purchase_date || '—'}</td>
                      <td style={{ fontSize: '0.82rem' }}>{item.expiry_date || '—'}</td>
                      <td>
                        {isExpired && <span className="badge badge-red">Expired</span>}
                        {isExpiring && <span className="badge badge-orange">Expiring</span>}
                        {!isExpired && !isExpiring && <span className="badge badge-green">OK</span>}
                      </td>
                      <td>
                        <div className="btn-group">
                          <button className="btn-icon" title="Duplicate" onClick={async () => { if (!confirm(`Duplicate "${item.name}"?`)) return; await api.duplicateItems([item.id]); load() }}>⊕</button>
                          <button className="btn-icon" title="Edit" onClick={() => openEdit(item)}>✎</button>
                          <button className="btn-icon" title="Delete" onClick={() => handleDelete(item.id)} style={{ color: 'var(--red)' }}>✕</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {/* Totals row */}
                {filtered.length > 0 && (() => {
                  const totals = filtered.reduce((acc, item) => ({
                    calories: acc.calories + (item.calories_per_unit || 0),
                    protein: acc.protein + (item.protein_g || 0),
                    carbs: acc.carbs + (item.carbs_g || 0),
                    fat: acc.fat + (item.fat_g || 0),
                  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
                  return (
                    <tr style={{ background: 'var(--bg-card-hover)', borderTop: '2px solid var(--border)' }}>
                      <td></td>
                      <td style={{ fontWeight: 700, fontSize: '0.82rem' }}>TOTAL ({filtered.length} items)</td>
                      <td></td>
                      <td></td>
                      <td style={{ fontFamily: 'var(--mono)', fontWeight: 700 }}>{Math.round(totals.calories).toLocaleString()}</td>
                      <td style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '0.78rem' }}>
                        {Math.round(totals.protein)}g / {Math.round(totals.carbs)}g / {Math.round(totals.fat)}g
                      </td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                    </tr>
                  )
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editing ? 'Edit Item' : 'Add New Item'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-select" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                      <option value="">— Select —</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unit</label>
                    <select className="form-select" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                      {unitOptions.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Quantity</label>
                    <input type="number" step="0.01" min="0" className="form-input" value={form.quantity} onChange={e => setForm({ ...form, quantity: +e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Calories per Unit</label>
                    <input type="number" step="0.1" min="0" className="form-input" value={form.calories_per_unit} onChange={e => setForm({ ...form, calories_per_unit: +e.target.value })} />
                  </div>
                </div>

                <div className="form-row-3">
                  <div className="form-group">
                    <label className="form-label">Protein (g)</label>
                    <input type="number" step="0.1" min="0" className="form-input" value={form.protein_g} onChange={e => setForm({ ...form, protein_g: +e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Carbs (g)</label>
                    <input type="number" step="0.1" min="0" className="form-input" value={form.carbs_g} onChange={e => setForm({ ...form, carbs_g: +e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fat (g)</label>
                    <input type="number" step="0.1" min="0" className="form-input" value={form.fat_g} onChange={e => setForm({ ...form, fat_g: +e.target.value })} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Fiber (g)</label>
                    <input type="number" step="0.1" min="0" className="form-input" value={form.fiber_g} onChange={e => setForm({ ...form, fiber_g: +e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sugar (g)</label>
                    <input type="number" step="0.1" min="0" className="form-input" value={form.sugar_g} onChange={e => setForm({ ...form, sugar_g: +e.target.value })} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="checkbox" checked={form.is_liquid} onChange={e => setForm({ ...form, is_liquid: e.target.checked })} />
                      Is Liquid
                    </label>
                  </div>
                  {form.is_liquid && (
                    <div className="form-group">
                      <label className="form-label">Volume (ml)</label>
                      <input type="number" step="1" min="0" className="form-input" value={form.volume_ml} onChange={e => setForm({ ...form, volume_ml: +e.target.value })} />
                    </div>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Purchase Date</label>
                    <input type="date" className="form-input" value={form.purchase_date} onChange={e => setForm({ ...form, purchase_date: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Expiry Date</label>
                    <input type="date" className="form-input" value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value })} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="form-textarea" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Save Changes' : 'Add Item'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Edit Modal */}
      {showBulkEdit && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowBulkEdit(false) }}>
          <div className="modal">
            <div className="modal-header">
              <h3>Bulk Edit {selected.size} Item{selected.size !== 1 ? 's' : ''}</h3>
              <button className="btn-icon" onClick={() => setShowBulkEdit(false)}>✕</button>
            </div>
            <form onSubmit={handleBulkEdit}>
              <div className="modal-body">
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                  Only filled fields will be updated across all selected items. Leave blank to keep current value.
                </p>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={bulkForm.category_id} onChange={e => setBulkForm({ ...bulkForm, category_id: e.target.value })}>
                    <option value="">— No change —</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Purchase Date</label>
                    <input type="date" className="form-input" value={bulkForm.purchase_date} onChange={e => setBulkForm({ ...bulkForm, purchase_date: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Expiry Date</label>
                    <input type="date" className="form-input" value={bulkForm.expiry_date} onChange={e => setBulkForm({ ...bulkForm, expiry_date: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="form-textarea" value={bulkForm.notes} onChange={e => setBulkForm({ ...bulkForm, notes: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowBulkEdit(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Update {selected.size} Item{selected.size !== 1 ? 's' : ''}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Add Modal */}
      {showBulkAdd && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowBulkAdd(false) }}>
          <div className="modal" style={{ maxWidth: 900 }}>
            <div className="modal-header">
              <h3>Bulk Add Items</h3>
              <button className="btn-icon" onClick={() => setShowBulkAdd(false)}>✕</button>
            </div>
            <form onSubmit={handleBulkAdd}>
              <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                  Add multiple items at once. Each row creates one inventory item.
                </p>
                {bulkAddRows.map((row, idx) => (
                  <div key={idx} style={{ padding: 14, background: 'var(--bg-input)', borderRadius: 'var(--radius)', marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-muted)' }}>Item {idx + 1}</span>
                      {bulkAddRows.length > 1 && (
                        <button type="button" className="btn-icon" onClick={() => removeBulkRow(idx)} style={{ color: 'var(--red)' }}>✕</button>
                      )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 80px 80px 100px 80px 80px', gap: 8, alignItems: 'end' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.72rem' }}>Name *</label>
                        <input className="form-input" value={row.name} onChange={e => updateBulkRow(idx, 'name', e.target.value)} placeholder="Item name" />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.72rem' }}>Category</label>
                        <select className="form-select" value={row.category_id} onChange={e => updateBulkRow(idx, 'category_id', e.target.value)}>
                          <option value="">—</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.72rem' }}>Qty</label>
                        <input type="number" step="0.01" min="0" className="form-input" value={row.quantity} onChange={e => updateBulkRow(idx, 'quantity', +e.target.value)} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.72rem' }}>Unit</label>
                        <select className="form-select" value={row.unit} onChange={e => updateBulkRow(idx, 'unit', e.target.value)}>
                          {unitOptions.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.72rem' }}>Cal/unit</label>
                        <input type="number" step="0.1" min="0" className="form-input" value={row.calories_per_unit} onChange={e => updateBulkRow(idx, 'calories_per_unit', +e.target.value)} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.72rem' }}>Expiry</label>
                        <input type="date" className="form-input" value={row.expiry_date} onChange={e => updateBulkRow(idx, 'expiry_date', e.target.value)} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.72rem' }}>Purchased</label>
                        <input type="date" className="form-input" value={row.purchase_date} onChange={e => updateBulkRow(idx, 'purchase_date', e.target.value)} />
                      </div>
                    </div>
                  </div>
                ))}
                <button type="button" className="btn btn-ghost" onClick={addBulkRow} style={{ width: '100%', marginTop: 4 }}>+ Add Another Row</button>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowBulkAdd(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add {bulkAddRows.filter(r => r.name.trim()).length} Item{bulkAddRows.filter(r => r.name.trim()).length !== 1 ? 's' : ''}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
