import { useState, useEffect } from 'react'
import { api } from '../api'

export default function Household() {
  const [members, setMembers] = useState([])
  const [memberDetails, setMemberDetails] = useState({})
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', daily_calorie_target: 2000, daily_liquid_target: 2000 })

  const load = async () => {
    const m = await api.getMembers()
    setMembers(m)
    // Load today's data for each
    const details = {}
    for (const member of m) {
      try {
        details[member.id] = await api.getMemberToday(member.id)
      } catch { /* skip */ }
    }
    setMemberDetails(details)
  }

  useEffect(() => { load() }, [])

  const openNew = () => {
    setEditing(null)
    setForm({ name: '', daily_calorie_target: 2000, daily_liquid_target: 2000 })
    setShowModal(true)
  }

  const openEdit = (m) => {
    setEditing(m)
    setForm({ name: m.name, daily_calorie_target: m.daily_calorie_target, daily_liquid_target: m.daily_liquid_target || 2000 })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    if (editing) {
      await api.updateMember(editing.id, form)
    } else {
      await api.createMember(form)
    }
    setShowModal(false)
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this household member?')) return
    await api.deleteMember(id)
    load()
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Household</h2>
          <div className="subtitle">{members.length} member{members.length !== 1 ? 's' : ''}</div>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Add Member</button>
      </div>

      {members.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">◉</div>
          <p>No household members yet</p>
          <button className="btn btn-primary" onClick={openNew}>Add your first member</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {members.map(member => {
            const detail = memberDetails[member.id]
            const consumed = detail?.consumed || {}
            const liquids = detail?.liquids || []
            const calPct = member.daily_calorie_target > 0
              ? Math.min(((consumed.total_calories || 0) / member.daily_calorie_target) * 100, 100) : 0

            const waterMl = liquids.find(l => l.type === 'water')?.total_ml || 0
            const teaMl = liquids.find(l => l.type === 'tea')?.total_ml || 0
            const coffeeMl = liquids.find(l => l.type === 'coffee')?.total_ml || 0

            return (
              <div key={member.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{member.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                      Target: {member.daily_calorie_target} kcal/day · {((member.daily_liquid_target || 2000) / 1000).toFixed(1)}L/day
                    </div>
                  </div>
                  <div className="btn-group">
                    <button className="btn-icon" onClick={() => openEdit(member)}>✎</button>
                    <button className="btn-icon" onClick={() => handleDelete(member.id)} style={{ color: 'var(--red)' }}>✕</button>
                  </div>
                </div>

                {/* Calorie progress */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Today's Calories</span>
                    <span style={{ fontFamily: 'var(--mono)' }}>
                      {Math.round(consumed.total_calories || 0)} / {member.daily_calorie_target}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{
                      width: `${calPct}%`,
                      background: calPct >= 100 ? 'var(--green)' : 'var(--accent)'
                    }} />
                  </div>
                </div>

                {/* Macros */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                  <MiniStat label="Protein" val={consumed.total_protein} />
                  <MiniStat label="Carbs" val={consumed.total_carbs} />
                  <MiniStat label="Fat" val={consumed.total_fat} />
                  <MiniStat label="Fiber" val={consumed.total_fiber} />
                </div>

                {/* Liquids */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span className="badge badge-cyan">💧 {waterMl}ml</span>
                  <span className="badge badge-green">🍵 {teaMl}ml</span>
                  <span className="badge badge-orange">☕ {coffeeMl}ml</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editing ? 'Edit Member' : 'Add Member'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Daily Calorie Target (kcal)</label>
                  <input type="number" min="0" className="form-input" value={form.daily_calorie_target} onChange={e => setForm({ ...form, daily_calorie_target: +e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Daily Liquid Target (ml)</label>
                  <input type="number" min="0" step="100" className="form-input" value={form.daily_liquid_target} onChange={e => setForm({ ...form, daily_liquid_target: +e.target.value })} />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{(form.daily_liquid_target / 1000).toFixed(1)}L per day</span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Save' : 'Add Member'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function MiniStat({ label, val }) {
  return (
    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
      <span style={{ fontWeight: 600 }}>{label}</span>{' '}
      <span style={{ fontFamily: 'var(--mono)' }}>{Math.round(val || 0)}g</span>
    </div>
  )
}
