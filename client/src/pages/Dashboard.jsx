import { useState, useEffect } from 'react'
import { api } from '../api'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.dashboard().then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="empty-state"><p>Loading dashboard...</p></div>
  if (!data) return <div className="empty-state"><p>Failed to load dashboard</p></div>

  const { inventory, expiringSoon, expired, memberCount, dailyCalorieNeed, daysOfRations, categoryBreakdown, todayConsumption, todayLiquids, liquidRations, dailyLiquidNeed, daysOfLiquidRations, medicineStats, medicineExpiring, medicineExpired } = data

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <div className="subtitle">Household inventory overview</div>
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      {/* Key stats */}
      <div className="stats-grid">
        <div className="stat-card accent">
          <div className="stat-label">Days of Rations</div>
          <div className="stat-value">{daysOfRations}</div>
          <div className="stat-sub">{dailyCalorieNeed.toLocaleString()} kcal/day for {memberCount} member{memberCount !== 1 ? 's' : ''}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Total Items</div>
          <div className="stat-value">{inventory.total_items}</div>
          <div className="stat-sub">{(inventory.total_units / 1000).toFixed(1)} kg total weight</div>
        </div>
        <div className="stat-card cyan">
          <div className="stat-label">Total Calories</div>
          <div className="stat-value">{Math.round(inventory.total_calories).toLocaleString()}</div>
          <div className="stat-sub">kcal available</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-label">Expiring Soon</div>
          <div className="stat-value">{expiringSoon.length}</div>
          <div className="stat-sub">within 3 days</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">Expired</div>
          <div className="stat-value">{expired.length}</div>
          <div className="stat-sub">item{expired.length !== 1 ? 's' : ''} past date</div>
        </div>
        <div className="stat-card cyan">
          <div className="stat-label">Liquid Rations</div>
          <div className="stat-value">{(liquidRations.total_ml / 1000).toFixed(1)} L</div>
          <div className="stat-sub">{daysOfLiquidRations} days · {(dailyLiquidNeed / 1000).toFixed(1)}L/day</div>
        </div>
        <div className="stat-card pink">
          <div className="stat-label">Medicines</div>
          <div className="stat-value">{medicineStats.total_medicines}</div>
          <div className="stat-sub">{medicineStats.total_units} total units</div>
        </div>
      </div>

      {/* Macros Overview */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title">Inventory Macros</div>
        <div className="stats-grid" style={{ marginBottom: 0 }}>
          <MacroStat label="Protein" value={inventory.total_protein} unit="g" color="var(--cyan)" />
          <MacroStat label="Carbs" value={inventory.total_carbs} unit="g" color="var(--orange)" />
          <MacroStat label="Fiber" value={inventory.total_fiber} unit="g" color="var(--green)" />
          <MacroStat label="Sugar" value={inventory.total_sugar} unit="g" color="var(--pink)" />
          <MacroStat label="Fat" value={inventory.total_fat} unit="g" color="var(--red)" />
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Today's Calories per Member */}
        <div className="card">
          <div className="card-title">Today's Calories</div>
          {todayConsumption.length === 0 ? (
            <div className="empty-state" style={{ padding: '20px 0' }}>
              <p>No household members yet</p>
            </div>
          ) : (
            todayConsumption.map(m => {
              const pct = m.daily_calorie_target > 0 ? Math.min((m.calories_consumed / m.daily_calorie_target) * 100, 100) : 0
              return (
                <div key={m.id} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                    <span>{m.name}</span>
                    <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-secondary)' }}>
                      {Math.round(m.calories_consumed)} / {m.daily_calorie_target} kcal
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{
                      width: `${pct}%`,
                      background: pct >= 100 ? 'var(--green)' : pct >= 75 ? 'var(--orange)' : 'var(--accent)'
                    }} />
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Today's Liquid Consumption */}
        <div className="card">
          <div className="card-title">Today's Liquid Consumption</div>
          {todayLiquids.length === 0 ? (
            <div className="empty-state" style={{ padding: '20px 0' }}>
              <p>No household members yet</p>
            </div>
          ) : (
            todayLiquids.map(m => (
              <div key={m.id} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: '0.85rem', marginBottom: 6 }}>{m.name}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span className="badge badge-cyan">💧 {m.water_ml}ml</span>
                  <span className="badge badge-green">🍵 {m.tea_ml}ml</span>
                  <span className="badge badge-orange">☕ {m.coffee_ml}ml</span>
                  <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {m.total_ml}ml total
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Category Breakdown */}
      {categoryBreakdown.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-title">Inventory by Category</div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Items</th>
                  <th>Units</th>
                  <th>Calories</th>
                </tr>
              </thead>
              <tbody>
                {categoryBreakdown.map(c => (
                  <tr key={c.name}>
                    <td>
                      <span className="category-dot" style={{ backgroundColor: c.color }} />
                      {c.name}
                    </td>
                    <td style={{ fontFamily: 'var(--mono)' }}>{c.item_count}</td>
                    <td style={{ fontFamily: 'var(--mono)' }}>{Math.round(c.total_quantity)}</td>
                    <td style={{ fontFamily: 'var(--mono)' }}>{Math.round(c.total_calories).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expiring / Expired Items */}
      {(expiringSoon.length > 0 || expired.length > 0) && (
        <div className="grid-2">
          {expiringSoon.length > 0 && (
            <div className="card">
              <div className="card-title" style={{ color: 'var(--orange)' }}>⚠ Expiring Soon</div>
              {expiringSoon.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.88rem' }}>{item.name}</span>
                  <span className="badge badge-orange">{item.expiry_date}</span>
                </div>
              ))}
            </div>
          )}
          {expired.length > 0 && (
            <div className="card">
              <div className="card-title" style={{ color: 'var(--red)' }}>✕ Expired</div>
              {expired.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.88rem' }}>{item.name}</span>
                  <span className="badge badge-red">{item.expiry_date}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Medicine Alerts */}
      {(medicineExpiring.length > 0 || medicineExpired.length > 0) && (
        <div className="grid-2" style={{ marginTop: 24 }}>
          {medicineExpiring.length > 0 && (
            <div className="card">
              <div className="card-title" style={{ color: 'var(--orange)' }}>⚠ Medicines Expiring (30d)</div>
              {medicineExpiring.map(med => (
                <div key={med.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.88rem' }}>✚ {med.name} <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>({med.quantity} {med.unit})</span></span>
                  <span className="badge badge-orange">{med.expiry_date}</span>
                </div>
              ))}
            </div>
          )}
          {medicineExpired.length > 0 && (
            <div className="card">
              <div className="card-title" style={{ color: 'var(--red)' }}>✕ Medicines Expired</div>
              {medicineExpired.map(med => (
                <div key={med.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.88rem' }}>✚ {med.name} <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>({med.quantity} {med.unit})</span></span>
                  <span className="badge badge-red">{med.expiry_date}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MacroStat({ label, value, unit, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: 'var(--mono)', color }}>{Math.round(value).toLocaleString()}</div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{unit}</div>
    </div>
  )
}
