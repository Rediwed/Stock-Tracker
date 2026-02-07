import { useState, useEffect } from 'react'
import { api } from '../api'

export default function Consumption() {
  const [items, setItems] = useState([])
  const [members, setMembers] = useState([])
  const [logs, setLogs] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ item_id: '', member_id: '', quantity: 1, reason: 'consumed' })
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10))

  const load = async () => {
    const [inv, mem] = await Promise.all([api.getInventory(), api.getMembers()])
    setItems(inv)
    setMembers(mem)
    loadLogs()
  }

  const loadLogs = () => {
    const params = {}
    if (dateFilter) params.date = dateFilter
    api.getConsumption(params).then(setLogs)
  }

  useEffect(() => { load() }, [])
  useEffect(() => { loadLogs() }, [dateFilter])

  const openModal = () => {
    setForm({ item_id: items[0]?.id || '', member_id: members[0]?.id || '', quantity: 1, reason: 'consumed' })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.item_id) return
    try {
      await api.logConsumption(form)
      setShowModal(false)
      load()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this log entry?')) return
    await api.deleteConsumption(id)
    loadLogs()
  }

  const totalCals = logs.reduce((s, l) => s + (l.reason === 'consumed' ? l.calories : 0), 0)
  const discarded = logs.filter(l => l.reason !== 'consumed').length

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Consumption</h2>
          <div className="subtitle">Track food usage & waste</div>
        </div>
        <button className="btn btn-primary" onClick={openModal}>+ Log Consumption</button>
      </div>

      {/* Summary */}
      <div className="stats-grid">
        <div className="stat-card green">
          <div className="stat-label">Consumed Today</div>
          <div className="stat-value">{logs.filter(l => l.reason === 'consumed').length}</div>
          <div className="stat-sub">items</div>
        </div>
        <div className="stat-card cyan">
          <div className="stat-label">Calories Consumed</div>
          <div className="stat-value">{Math.round(totalCals).toLocaleString()}</div>
          <div className="stat-sub">kcal</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">Discarded / Expired</div>
          <div className="stat-value">{discarded}</div>
          <div className="stat-sub">items wasted</div>
        </div>
      </div>

      {/* Date filter */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <label className="form-label" style={{ marginBottom: 0 }}>Date</label>
        <input type="date" className="form-input" style={{ maxWidth: 200 }} value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
        <button className="btn btn-ghost" onClick={() => setDateFilter(new Date().toISOString().slice(0, 10))}>Today</button>
      </div>

      {logs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">▶</div>
          <p>No consumption logged for this date</p>
          <button className="btn btn-primary" onClick={openModal}>Log consumption</button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Member</th>
                  <th>Qty</th>
                  <th>Calories</th>
                  <th>Reason</th>
                  <th>Time</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontWeight: 500 }}>{log.item_name}</td>
                    <td>{log.member_name || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td style={{ fontFamily: 'var(--mono)' }}>{log.quantity} {log.unit}</td>
                    <td style={{ fontFamily: 'var(--mono)' }}>{Math.round(log.calories)}</td>
                    <td>
                      {log.reason === 'consumed' && <span className="badge badge-green">Consumed</span>}
                      {log.reason === 'expired' && <span className="badge badge-red">Expired</span>}
                      {log.reason === 'spoiled' && <span className="badge badge-orange">Spoiled</span>}
                      {log.reason === 'discarded' && <span className="badge badge-red">Discarded</span>}
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {new Date(log.consumed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>
                      <button className="btn-icon" onClick={() => handleDelete(log.id)} style={{ color: 'var(--red)' }}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Log Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="modal">
            <div className="modal-header">
              <h3>Log Consumption</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Item *</label>
                  <select className="form-select" value={form.item_id} onChange={e => setForm({ ...form, item_id: e.target.value })} required>
                    <option value="">— Select item —</option>
                    {items.map(i => (
                      <option key={i.id} value={i.id}>{i.name} ({i.quantity} {i.unit} left)</option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Member</label>
                    <select className="form-select" value={form.member_id} onChange={e => setForm({ ...form, member_id: e.target.value })}>
                      <option value="">— Unassigned —</option>
                      {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Quantity</label>
                    <input type="number" step="0.1" min="0.1" className="form-input" value={form.quantity} onChange={e => setForm({ ...form, quantity: +e.target.value })} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Reason</label>
                  <select className="form-select" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}>
                    <option value="consumed">Consumed (ate/drank)</option>
                    <option value="expired">Expired</option>
                    <option value="spoiled">Spoiled / Went bad</option>
                    <option value="discarded">Discarded / Thrown away</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Log</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
