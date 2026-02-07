import { useState, useEffect } from 'react'
import { api } from '../api'

const typeOptions = ['tablet', 'capsule', 'liquid', 'cream', 'drops', 'inhaler', 'injection', 'patch', 'powder', 'spray', 'suppository', 'other']
const unitOptions = ['tablets', 'capsules', 'ml', 'mg', 'g', 'pcs', 'doses', 'puffs', 'drops', 'patches', 'sachets', 'bottles', 'tubes', 'boxes']

export default function Medicine() {
  const [medicines, setMedicines] = useState([])
  const [members, setMembers] = useState([])
  const [logs, setLogs] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showLogModal, setShowLogModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [tab, setTab] = useState('inventory')
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10))

  const [form, setForm] = useState({
    name: '', type: 'tablet', quantity: 0, unit: 'tablets',
    dosage: '', frequency: '', notes: '',
    purchase_date: '', expiry_date: ''
  })
  const [logForm, setLogForm] = useState({ medicine_id: '', member_id: '', quantity: 1, notes: '' })

  const load = async () => {
    const [m, mem] = await Promise.all([api.getMedicines(), api.getMembers()])
    setMedicines(m)
    setMembers(mem)
    loadLogs()
  }

  const loadLogs = () => {
    api.getMedicineLogs({ date: dateFilter }).then(setLogs)
  }

  useEffect(() => { load() }, [])
  useEffect(() => { loadLogs() }, [dateFilter])

  const openNew = () => {
    setEditing(null)
    setForm({
      name: '', type: 'tablet', quantity: 0, unit: 'tablets',
      dosage: '', frequency: '', notes: '',
      purchase_date: new Date().toISOString().slice(0, 10), expiry_date: ''
    })
    setShowModal(true)
  }

  const openEdit = (med) => {
    setEditing(med)
    setForm({
      name: med.name, type: med.type, quantity: med.quantity, unit: med.unit,
      dosage: med.dosage, frequency: med.frequency, notes: med.notes || '',
      purchase_date: med.purchase_date || '', expiry_date: med.expiry_date || ''
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    if (editing) {
      await api.updateMedicine(editing.id, form)
    } else {
      await api.createMedicine(form)
    }
    setShowModal(false)
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this medicine?')) return
    await api.deleteMedicine(id)
    load()
  }

  const openLog = (med) => {
    setLogForm({ medicine_id: med?.id || (medicines[0]?.id || ''), member_id: members[0]?.id || '', quantity: 1, notes: '' })
    setShowLogModal(true)
  }

  const handleLog = async (e) => {
    e.preventDefault()
    if (!logForm.medicine_id) return
    try {
      await api.logMedicine(logForm)
      setShowLogModal(false)
      load()
    } catch (err) {
      alert(err.message)
    }
  }

  const today = new Date().toISOString().slice(0, 10)
  const expiredMeds = medicines.filter(m => m.expiry_date && m.expiry_date < today)
  const expiringMeds = medicines.filter(m => m.expiry_date && m.expiry_date >= today && m.expiry_date <= new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10))
  const lowStock = medicines.filter(m => m.quantity <= 5 && m.quantity > 0)
  const outOfStock = medicines.filter(m => m.quantity <= 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Medicine</h2>
          <div className="subtitle">{medicines.length} medicine{medicines.length !== 1 ? 's' : ''} tracked</div>
        </div>
        <div className="btn-group">
          <button className="btn btn-secondary" onClick={() => openLog()}>+ Log Intake</button>
          <button className="btn btn-primary" onClick={openNew}>+ Add Medicine</button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card accent">
          <div className="stat-label">Total Medicines</div>
          <div className="stat-value">{medicines.length}</div>
          <div className="stat-sub">{medicines.reduce((s, m) => s + m.quantity, 0)} total units</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-label">Low Stock</div>
          <div className="stat-value">{lowStock.length}</div>
          <div className="stat-sub">≤ 5 units remaining</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">Out of Stock</div>
          <div className="stat-value">{outOfStock.length}</div>
          <div className="stat-sub">need restocking</div>
        </div>
        <div className="stat-card pink">
          <div className="stat-label">Expiring (30d)</div>
          <div className="stat-value">{expiringMeds.length}</div>
          <div className="stat-sub">{expiredMeds.length} already expired</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="pill-tabs">
        {[['inventory', 'Inventory'], ['log', 'Intake Log']].map(([key, label]) => (
          <button key={key} className={`pill-tab${tab === key ? ' active' : ''}`} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      {/* Inventory Tab */}
      {tab === 'inventory' && (
        <>
          {medicines.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✚</div>
              <p>No medicines tracked yet</p>
              <button className="btn btn-primary" onClick={openNew}>Add your first medicine</button>
            </div>
          ) : (
            <div className="card" style={{ padding: 0 }}>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Medicine</th>
                      <th>Type</th>
                      <th>Stock</th>
                      <th>Dosage</th>
                      <th>Frequency</th>
                      <th>Purchased</th>
                      <th>Expires</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicines.map(med => {
                      const isExpired = med.expiry_date && med.expiry_date < today
                      const isExpiring = med.expiry_date && !isExpired && med.expiry_date <= new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
                      const isLow = med.quantity <= 5 && med.quantity > 0
                      const isEmpty = med.quantity <= 0

                      return (
                        <tr key={med.id}>
                          <td>
                            <div style={{ fontWeight: 500 }}>{med.name}</div>
                            {med.notes && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{med.notes}</div>}
                          </td>
                          <td><span className="badge badge-accent">{med.type}</span></td>
                          <td style={{ fontFamily: 'var(--mono)' }}>
                            <span style={{ color: isEmpty ? 'var(--red)' : isLow ? 'var(--orange)' : 'var(--text-primary)' }}>
                              {med.quantity}
                            </span>
                            {' '}{med.unit}
                          </td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{med.dosage || '—'}</td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{med.frequency || '—'}</td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{med.purchase_date || '—'}</td>
                          <td style={{ fontSize: '0.82rem' }}>{med.expiry_date || '—'}</td>
                          <td>
                            {isExpired && <span className="badge badge-red">Expired</span>}
                            {isExpiring && !isExpired && <span className="badge badge-orange">Expiring</span>}
                            {isEmpty && <span className="badge badge-red">Empty</span>}
                            {isLow && !isEmpty && <span className="badge badge-orange">Low</span>}
                            {!isExpired && !isExpiring && !isEmpty && !isLow && <span className="badge badge-green">OK</span>}
                          </td>
                          <td>
                            <div className="btn-group">
                              <button className="btn btn-sm btn-secondary" onClick={() => openLog(med)} title="Log intake">▶</button>
                              <button className="btn-icon" onClick={() => openEdit(med)} title="Edit">✎</button>
                              <button className="btn-icon" onClick={() => handleDelete(med.id)} style={{ color: 'var(--red)' }} title="Delete">✕</button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Intake Log Tab */}
      {tab === 'log' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
            <label className="form-label" style={{ marginBottom: 0 }}>Date</label>
            <input type="date" className="form-input" style={{ maxWidth: 180 }} value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
            <button className="btn btn-ghost" onClick={() => setDateFilter(new Date().toISOString().slice(0, 10))}>Today</button>
          </div>

          {logs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✚</div>
              <p>No intake logged for this date</p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0 }}>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Medicine</th>
                      <th>Member</th>
                      <th>Quantity</th>
                      <th>Notes</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id}>
                        <td style={{ fontWeight: 500 }}>{log.medicine_name}</td>
                        <td>{log.member_name || '—'}</td>
                        <td style={{ fontFamily: 'var(--mono)' }}>{log.quantity}</td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{log.notes || '—'}</td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {new Date(log.taken_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Medicine Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editing ? 'Edit Medicine' : 'Add Medicine'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>

                <div className="form-row-3">
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                      {typeOptions.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Quantity</label>
                    <input type="number" step="0.1" min="0" className="form-input" value={form.quantity} onChange={e => setForm({ ...form, quantity: +e.target.value })} />
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
                    <label className="form-label">Dosage</label>
                    <input className="form-input" placeholder="e.g. 500mg" value={form.dosage} onChange={e => setForm({ ...form, dosage: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Frequency</label>
                    <input className="form-input" placeholder="e.g. 2x daily" value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })} />
                  </div>
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
                <button type="submit" className="btn btn-primary">{editing ? 'Save' : 'Add Medicine'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Intake Modal */}
      {showLogModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowLogModal(false) }}>
          <div className="modal">
            <div className="modal-header">
              <h3>Log Medicine Intake</h3>
              <button className="btn-icon" onClick={() => setShowLogModal(false)}>✕</button>
            </div>
            <form onSubmit={handleLog}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Medicine *</label>
                  <select className="form-select" value={logForm.medicine_id} onChange={e => setLogForm({ ...logForm, medicine_id: e.target.value })} required>
                    <option value="">— Select —</option>
                    {medicines.filter(m => m.quantity > 0).map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.quantity} {m.unit} left)</option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Member</label>
                    <select className="form-select" value={logForm.member_id} onChange={e => setLogForm({ ...logForm, member_id: e.target.value })}>
                      <option value="">— Unassigned —</option>
                      {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Quantity</label>
                    <input type="number" step="0.5" min="0.5" className="form-input" value={logForm.quantity} onChange={e => setLogForm({ ...logForm, quantity: +e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <input className="form-input" placeholder="Optional" value={logForm.notes} onChange={e => setLogForm({ ...logForm, notes: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowLogModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Log Intake</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
