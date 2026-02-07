const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  // Dashboard
  dashboard: () => request('/dashboard'),

  // Categories
  getCategories: () => request('/categories'),

  // Inventory
  getInventory: () => request('/inventory'),
  getItem: (id) => request(`/inventory/${id}`),
  createItem: (data) => request('/inventory', { method: 'POST', body: data }),
  updateItem: (id, data) => request(`/inventory/${id}`, { method: 'PUT', body: data }),
  deleteItem: (id) => request(`/inventory/${id}`, { method: 'DELETE' }),
  duplicateItems: (ids) => request('/inventory/duplicate', { method: 'POST', body: { ids } }),
  bulkUpdateItems: (ids, updates) => request('/inventory/bulk', { method: 'PUT', body: { ids, updates } }),
  bulkDeleteItems: (ids) => request('/inventory/bulk-delete', { method: 'POST', body: { ids } }),

  // Members
  getMembers: () => request('/members'),
  createMember: (data) => request('/members', { method: 'POST', body: data }),
  updateMember: (id, data) => request(`/members/${id}`, { method: 'PUT', body: data }),
  deleteMember: (id) => request(`/members/${id}`, { method: 'DELETE' }),
  getMemberToday: (id) => request(`/members/${id}/today`),

  // Consumption
  getConsumption: (params) => {
    const q = new URLSearchParams(params).toString();
    return request(`/consumption${q ? '?' + q : ''}`);
  },
  logConsumption: (data) => request('/consumption', { method: 'POST', body: data }),
  deleteConsumption: (id) => request(`/consumption/${id}`, { method: 'DELETE' }),

  // Liquids (liquid rations inventory)
  getLiquids: (params) => {
    const q = new URLSearchParams(params).toString();
    return request(`/liquids${q ? '?' + q : ''}`);
  },
  getLiquidInventory: () => request('/liquids/inventory'),
  getLiquidSummary: (date) => request(`/liquids/summary${date ? '?date=' + date : ''}`),
  logLiquid: (data) => request('/liquids', { method: 'POST', body: data }),
  deleteLiquid: (id) => request(`/liquids/${id}`, { method: 'DELETE' }),

  // Beverages (coffee capsules, tea sachets)
  getBeverages: (params) => {
    const q = new URLSearchParams(params).toString();
    return request(`/beverages${q ? '?' + q : ''}`);
  },
  getBeverageSummary: (date) => request(`/beverages/summary${date ? '?date=' + date : ''}`),
  logBeverage: (data) => request('/beverages', { method: 'POST', body: data }),
  deleteBeverage: (id) => request(`/beverages/${id}`, { method: 'DELETE' }),

  // Medicines
  getMedicines: () => request('/medicines'),
  getMedicine: (id) => request(`/medicines/${id}`),
  createMedicine: (data) => request('/medicines', { method: 'POST', body: data }),
  updateMedicine: (id, data) => request(`/medicines/${id}`, { method: 'PUT', body: data }),
  deleteMedicine: (id) => request(`/medicines/${id}`, { method: 'DELETE' }),
  logMedicine: (data) => request('/medicines/log', { method: 'POST', body: data }),
  getMedicineLogs: (params) => {
    const q = new URLSearchParams(params).toString();
    return request(`/medicines/log/all${q ? '?' + q : ''}`);
  },
  deleteMedicineLog: (id) => request(`/medicines/log/${id}`, { method: 'DELETE' }),
};
