const router = require('express').Router();
const { getDb } = require('../db');

router.get('/', (req, res) => {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);

  // Total inventory stats
  const inventoryStats = db.prepare(`
    SELECT
      COUNT(*) as total_items,
      COALESCE(SUM(quantity), 0) as total_units,
      COALESCE(SUM(calories_per_unit), 0) as total_calories,
      COALESCE(SUM(protein_g), 0) as total_protein,
      COALESCE(SUM(carbs_g), 0) as total_carbs,
      COALESCE(SUM(fiber_g), 0) as total_fiber,
      COALESCE(SUM(sugar_g), 0) as total_sugar,
      COALESCE(SUM(fat_g), 0) as total_fat
    FROM inventory_items
  `).get();

  // Expiring soon (within 3 days)
  const expiringSoon = db.prepare(`
    SELECT i.*, c.name as category_name, c.color as category_color
    FROM inventory_items i
    LEFT JOIN categories c ON i.category_id = c.id
    WHERE i.expiry_date IS NOT NULL
      AND date(i.expiry_date) <= date('now', '+3 days')
      AND date(i.expiry_date) >= date('now')
    ORDER BY i.expiry_date ASC
  `).all();

  // Already expired
  const expired = db.prepare(`
    SELECT i.*, c.name as category_name, c.color as category_color
    FROM inventory_items i
    LEFT JOIN categories c ON i.category_id = c.id
    WHERE i.expiry_date IS NOT NULL
      AND date(i.expiry_date) < date('now')
    ORDER BY i.expiry_date ASC
  `).all();

  // Household members count
  const memberCount = db.prepare('SELECT COUNT(*) as c FROM household_members').get().c;

  // Total daily calorie need
  const dailyCalorieNeed = db.prepare('SELECT COALESCE(SUM(daily_calorie_target), 0) as total FROM household_members').get().total;

  // Days of rations
  const daysOfRations = dailyCalorieNeed > 0
    ? Math.floor(inventoryStats.total_calories / dailyCalorieNeed)
    : 0;

  // Category breakdown
  const categoryBreakdown = db.prepare(`
    SELECT c.name, c.color,
      COUNT(i.id) as item_count,
      COALESCE(SUM(i.quantity), 0) as total_quantity,
      COALESCE(SUM(i.calories_per_unit), 0) as total_calories
    FROM categories c
    LEFT JOIN inventory_items i ON c.id = i.category_id
    GROUP BY c.id
    HAVING item_count > 0
    ORDER BY total_calories DESC
  `).all();

  // Today's consumption per member
  const todayConsumption = db.prepare(`
    SELECT hm.id, hm.name, hm.daily_calorie_target,
      COALESCE(SUM(cl.calories), 0) as calories_consumed
    FROM household_members hm
    LEFT JOIN consumption_log cl ON hm.id = cl.member_id AND date(cl.consumed_at) = ?
    GROUP BY hm.id
    ORDER BY hm.name
  `).all(today);

  // Today's liquid intake per member
  const todayLiquids = db.prepare(`
    SELECT hm.id, hm.name,
      COALESCE(SUM(CASE WHEN ll.type = 'water' THEN ll.amount_ml ELSE 0 END), 0) as water_ml,
      COALESCE(SUM(CASE WHEN ll.type = 'tea' THEN ll.amount_ml ELSE 0 END), 0) as tea_ml,
      COALESCE(SUM(CASE WHEN ll.type = 'coffee' THEN ll.amount_ml ELSE 0 END), 0) as coffee_ml,
      COALESCE(SUM(ll.amount_ml), 0) as total_ml
    FROM household_members hm
    LEFT JOIN liquid_log ll ON hm.id = ll.member_id AND date(ll.logged_at) = ?
    GROUP BY hm.id
    ORDER BY hm.name
  `).all(today);

  // Daily liquid need
  const dailyLiquidNeed = db.prepare('SELECT COALESCE(SUM(daily_liquid_target), 0) as total FROM household_members').get().total;

  // Liquid rations remaining
  const liquidRations = db.prepare(`
    SELECT
      COALESCE(SUM(volume_ml), 0) as total_ml,
      COUNT(*) as item_count
    FROM inventory_items
    WHERE is_liquid = 1
  `).get();

  // Days of liquid rations
  const daysOfLiquidRations = dailyLiquidNeed > 0
    ? Math.floor(liquidRations.total_ml / dailyLiquidNeed)
    : 0;

  // Medicine stats
  const medicineStats = db.prepare(`
    SELECT
      COUNT(*) as total_medicines,
      COALESCE(SUM(quantity), 0) as total_units
    FROM medicines
  `).get();

  const medicineExpiring = db.prepare(`
    SELECT * FROM medicines
    WHERE expiry_date IS NOT NULL
      AND date(expiry_date) <= date('now', '+30 days')
      AND date(expiry_date) >= date('now')
    ORDER BY expiry_date ASC
  `).all();

  const medicineExpired = db.prepare(`
    SELECT * FROM medicines
    WHERE expiry_date IS NOT NULL
      AND date(expiry_date) < date('now')
    ORDER BY expiry_date ASC
  `).all();

  // Recent consumption
  const recentConsumption = db.prepare(`
    SELECT cl.*, hm.name as member_name
    FROM consumption_log cl
    LEFT JOIN household_members hm ON cl.member_id = hm.id
    ORDER BY cl.consumed_at DESC
    LIMIT 10
  `).all();

  res.json({
    inventory: inventoryStats,
    expiringSoon,
    expired,
    memberCount,
    dailyCalorieNeed,
    daysOfRations,
    categoryBreakdown,
    todayConsumption,
    todayLiquids,
    liquidRations,
    dailyLiquidNeed,
    daysOfLiquidRations,
    medicineStats,
    medicineExpiring,
    medicineExpired,
    recentConsumption,
  });
});

module.exports = router;
