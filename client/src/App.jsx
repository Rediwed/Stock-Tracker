import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Household from './pages/Household'
import Consumption from './pages/Consumption'
import Liquids from './pages/Liquids'
import Medicine from './pages/Medicine'

const navItems = [
  { path: '/', label: 'Dashboard', icon: '◈' },
  { path: '/inventory', label: 'Inventory', icon: '▦' },
  { path: '/household', label: 'Household', icon: '◉' },
  { path: '/consumption', label: 'Consumption', icon: '▶' },
  { path: '/liquids', label: 'Liquids', icon: '◇' },
  { path: '/medicine', label: 'Medicine', icon: '✚' },
]

export default function App() {
  const location = useLocation()

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1>
            <span className="brand-icon">▣</span>
            <span>StockTracker</span>
          </h1>
          <div className="brand-sub">Household Inventory</div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          v1.0.0
        </div>
      </aside>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/household" element={<Household />} />
          <Route path="/consumption" element={<Consumption />} />
          <Route path="/liquids" element={<Liquids />} />
          <Route path="/medicine" element={<Medicine />} />
        </Routes>
      </main>
    </div>
  )
}
