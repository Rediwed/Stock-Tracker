import { useState, useEffect } from 'react'
import { api } from '../api'

const coffeePresets = [
  { label: 'Espresso (40ml)', capsules: 1, water_ml: 40 },
  { label: 'Lungo (110ml)', capsules: 1, water_ml: 110 },
  { label: 'Double Espresso (80ml)', capsules: 2, water_ml: 80 },
]

const teaPresets = [
  { label: 'Cup of Tea (250ml)', sachets: 1, water_ml: 250 },
  { label: 'Mug of Tea (350ml)', sachets: 1, water_ml: 350 },
  { label: 'Large Pot (700ml)', sachets: 2, water_ml: 700 },
]

const waterPresets = [
  { label: '💧 Glass (250ml)', amount: 250 },
  { label: '💧 Bottle (500ml)', amount: 500 },
  { label: '💧 Large (1L)', amount: 1000 },
]

export default function Liquids() {
  const [members, setMembers] = useState([])
  const [liquidInv, setLiquidInv] = useState({ items: [], totalMl: 0, totalLiters: 0 })
  const [bevSummary, setBevSummary] = useState([])
  const [liquidSummary, setLiquidSummary] = useState([])
  const [beverageLogs, setBeverageLogs] = useState([])
  const [liquidLogs, setLiquidLogs] = useState([])
  const [selectedMember, setSelectedMember] = useState('')
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10))
  const [tab, setTab] = useState('overview')

  const load = async () => {
    const [m, inv] = await Promise.all([api.getMembers(), api.getLiquidInventory()])
    setMembers(m)
    setLiquidInv(inv)
    if (m.length > 0 && !selectedMember) setSelectedMember(m[0].id)
    await loadLogs()
  }

  const loadLogs = async () => {
    const [bs, ls, bl, ll] = await Promise.all([
      api.getBeverageSummary(dateFilter),
      api.getLiquidSummary(dateFilter),
      api.getBeverages({ date: dateFilter }),
      api.getLiquids({ date: dateFilter }),
    ])
    setBevSummary(bs)
    setLiquidSummary(ls)
    setBeverageLogs(bl)
    setLiquidLogs(ll)
  }

  useEffect(() => { load() }, [])
  useEffect(() => { loadLogs() }, [dateFilter])

  const logWater = async (amount) => {
    if (!selectedMember) return alert('Select a member')
    await api.logLiquid({ member_id: selectedMember, type: 'water', amount_ml: amount })
    loadLogs()
  }

  const logCoffee = async (preset) => {
    if (!selectedMember) return alert('Select a member')
    await api.logBeverage({ member_id: selectedMember, type: 'coffee', capsules_or_sachets: preset.capsules, water_ml: preset.water_ml })
    // Also log the water used
    await api.logLiquid({ member_id: selectedMember, type: 'coffee', amount_ml: preset.water_ml })
    loadLogs()
  }

  const logTea = async (preset) => {
    if (!selectedMember) return alert('Select a member')
    await api.logBeverage({ member_id: selectedMember, type: 'tea', capsules_or_sachets: preset.sachets, water_ml: preset.water_ml })
    await api.logLiquid({ member_id: selectedMember, type: 'tea', amount_ml: preset.water_ml })
    loadLogs()
  }

  const deleteBev = async (id) => { await api.deleteBeverage(id); loadLogs() }
  const deleteLiq = async (id) => { await api.deleteLiquid(id); loadLogs() }

  const selectedName = members.find(m => m.id === selectedMember)?.name || ''

  // Calculate daily liquid need and days remaining
  const dailyLiquidNeed = members.reduce((sum, m) => sum + (m.daily_liquid_target || 2000), 0)
  const daysOfLiquid = dailyLiquidNeed > 0 ? Math.floor(liquidInv.totalMl / dailyLiquidNeed) : 0
  const totalLiters = (liquidInv.totalMl / 1000).toFixed(1)

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Liquids & Beverages</h2>
          <div className="subtitle">Liquid rations, coffee capsules & tea sachets</div>
        </div>
      </div>

      {/* Liquid Rations Stats */}
      <div className="stats-grid">
        <div className="stat-card cyan">
          <div className="stat-label">Liquid Rations</div>
          <div className="stat-value">{totalLiters} L</div>
          <div className="stat-sub">{liquidInv.items.length} liquid item{liquidInv.items.length !== 1 ? 's' : ''} in stock</div>
        </div>
        <div className="stat-card accent">
          <div className="stat-label">Days Remaining</div>
          <div className="stat-value">{daysOfLiquid}</div>
          <div className="stat-sub">{(dailyLiquidNeed / 1000).toFixed(1)}L/day for {members.length} member{members.length !== 1 ? 's' : ''}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Daily Target</div>
          <div className="stat-value">{(dailyLiquidNeed / 1000).toFixed(1)} L</div>
          <div className="stat-sub">{members.map(m => `${m.name}: ${((m.daily_liquid_target || 2000) / 1000).toFixed(1)}L`).join(' · ')}</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-label">Liquid Calories</div>
          <div className="stat-value">{Math.round(liquidInv.totalCalories || 0).toLocaleString()}</div>
          <div className="stat-sub">kcal in liquid items</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="pill-tabs">
        {[['overview', 'Overview'], ['log', 'Quick Log'], ['inventory', 'Liquid Inventory'], ['history', 'History']].map(([key, label]) => (
          <button key={key} className={`pill-tab${tab === key ? ' active' : ''}`} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <>
          {/* Date selector */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
            <label className="form-label" style={{ marginBottom: 0 }}>Date</label>
            <input type="date" className="form-input" style={{ maxWidth: 180 }} value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
            <button className="btn btn-ghost" onClick={() => setDateFilter(new Date().toISOString().slice(0, 10))}>Today</button>
          </div>

          {/* Per-member liquid + beverage summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {liquidSummary.map(m => {
              const bev = bevSummary.find(b => b.member_id === m.member_id) || {}
              return (
                <div key={m.member_id} className="card">
                  <div style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: 12 }}>{m.member_name}</div>

                  {/* Water consumption */}
                  <div style={{ marginBottom: 14 }}>
                    <div className="card-title" style={{ marginBottom: 6 }}>Water Consumed</div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <LiquidPill icon="💧" label="Plain Water" val={m.water_ml} unit="ml" color="var(--cyan)" />
                      <LiquidPill icon="☕" label="Via Coffee" val={m.coffee_ml} unit="ml" color="var(--orange)" />
                      <LiquidPill icon="🍵" label="Via Tea" val={m.tea_ml} unit="ml" color="var(--green)" />
                    </div>
                    <div style={{ marginTop: 8, fontFamily: 'var(--mono)', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                      Total: {m.total_ml}ml consumed
                    </div>
                  </div>

                  {/* Capsules & Sachets consumed */}
                  <div>
                    <div className="card-title" style={{ marginBottom: 6 }}>Units Consumed</div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <LiquidPill icon="☕" label="Capsules" val={bev.coffee_capsules || 0} unit="" color="var(--orange)" />
                      <LiquidPill icon="🍵" label="Sachets" val={bev.tea_sachets || 0} unit="" color="var(--green)" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Quick Log Tab */}
      {tab === 'log' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
            <div>
              <label className="form-label" style={{ marginBottom: 4 }}>Active Member</label>
              <select className="form-select" style={{ minWidth: 180 }} value={selectedMember} onChange={e => setSelectedMember(e.target.value)}>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>

          {/* Water */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-title">💧 Log Water for {selectedName}</div>
            <div className="quick-actions">
              {waterPresets.map((p, i) => (
                <button key={i} className="quick-btn" onClick={() => logWater(p.amount)}>{p.label}</button>
              ))}
            </div>
          </div>

          {/* Coffee capsules */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-title">☕ Log Coffee Capsule for {selectedName}</div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 10 }}>Logs capsule(s) consumed + water used</p>
            <div className="quick-actions">
              {coffeePresets.map((p, i) => (
                <button key={i} className="quick-btn" onClick={() => logCoffee(p)}>☕ {p.label} ({p.capsules} capsule{p.capsules > 1 ? 's' : ''})</button>
              ))}
            </div>
          </div>

          {/* Tea sachets */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-title">🍵 Log Tea Sachet for {selectedName}</div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 10 }}>Logs sachet(s) consumed + water used</p>
            <div className="quick-actions">
              {teaPresets.map((p, i) => (
                <button key={i} className="quick-btn" onClick={() => logTea(p)}>🍵 {p.label} ({p.sachets} sachet{p.sachets > 1 ? 's' : ''})</button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Liquid Inventory Tab */}
      {tab === 'inventory' && (
        <div className="card" style={{ padding: 0 }}>
          {liquidInv.items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">◇</div>
              <p>No liquid items in inventory</p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Add items with "Is Liquid" checked in Inventory</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Qty</th>
                    <th>Volume</th>
                    <th>Total</th>
                    <th>Calories</th>
                    <th>Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {liquidInv.items.map(item => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 500 }}>{item.name}</td>
                      <td>
                        {item.category_name ? (
                          <><span className="category-dot" style={{ backgroundColor: item.category_color }} />{item.category_name}</>
                        ) : '—'}
                      </td>
                      <td style={{ fontFamily: 'var(--mono)' }}>{item.quantity}</td>
                      <td style={{ fontFamily: 'var(--mono)' }}>{(item.volume_ml / 1000).toFixed(2)}L ea</td>
                      <td style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{((item.volume_ml * item.quantity) / 1000).toFixed(2)}L</td>
                      <td style={{ fontFamily: 'var(--mono)' }}>{Math.round(item.calories_per_unit * item.quantity)}</td>
                      <td style={{ fontSize: '0.82rem' }}>{item.expiry_date || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
            <label className="form-label" style={{ marginBottom: 0 }}>Date</label>
            <input type="date" className="form-input" style={{ maxWidth: 180 }} value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
            <button className="btn btn-ghost" onClick={() => setDateFilter(new Date().toISOString().slice(0, 10))}>Today</button>
          </div>

          {/* Beverage log */}
          {beverageLogs.length > 0 && (
            <div className="card" style={{ padding: 0, marginBottom: 16 }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                <div className="card-title" style={{ marginBottom: 0 }}>Capsules & Sachets</div>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr><th>Type</th><th>Member</th><th>Units</th><th>Water Used</th><th>Time</th><th></th></tr>
                  </thead>
                  <tbody>
                    {beverageLogs.map(log => (
                      <tr key={log.id}>
                        <td>{log.type === 'coffee' ? '☕ Capsule' : '🍵 Sachet'}</td>
                        <td>{log.member_name || '—'}</td>
                        <td style={{ fontFamily: 'var(--mono)' }}>{log.capsules_or_sachets}</td>
                        <td style={{ fontFamily: 'var(--mono)' }}>{log.water_ml}ml</td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {new Date(log.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td><button className="btn-icon" onClick={() => deleteBev(log.id)} style={{ color: 'var(--red)' }}>✕</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Water log */}
          {liquidLogs.length > 0 && (
            <div className="card" style={{ padding: 0 }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                <div className="card-title" style={{ marginBottom: 0 }}>Liquid Consumption</div>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr><th>Type</th><th>Member</th><th>Amount</th><th>Time</th><th></th></tr>
                  </thead>
                  <tbody>
                    {liquidLogs.map(log => (
                      <tr key={log.id}>
                        <td>{log.type === 'water' ? '💧 Water' : log.type === 'coffee' ? '☕ Coffee' : '🍵 Tea'}</td>
                        <td>{log.member_name || '—'}</td>
                        <td style={{ fontFamily: 'var(--mono)' }}>{log.amount_ml}ml</td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {new Date(log.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td><button className="btn-icon" onClick={() => deleteLiq(log.id)} style={{ color: 'var(--red)' }}>✕</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {beverageLogs.length === 0 && liquidLogs.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">◇</div>
              <p>No logs for this date</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function LiquidPill({ icon, label, val, unit, color }) {
  return (
    <div style={{
      flex: 1, textAlign: 'center', padding: '8px 4px',
      background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)'
    }}>
      <div style={{ fontSize: '1rem', marginBottom: 2 }}>{icon}</div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '0.95rem', fontWeight: 600, color }}>{val}{unit}</div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{label}</div>
    </div>
  )
}
