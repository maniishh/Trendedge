const Alert    = require('../models/Alert');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/** GET /api/alerts?active=true */
const getAlerts = asyncHandler(async (req, res) => {
  const filter = { user: req.user.id };
  if (req.query.active !== undefined) filter.isActive = req.query.active === 'true';
  const alerts = await Alert.find(filter).sort({ createdAt: -1 });
  res.json(new ApiResponse(200, alerts));
});

/** POST /api/alerts */
const createAlert = asyncHandler(async (req, res) => {
  const activeCount = await Alert.countDocuments({ user: req.user.id, isActive: true });
  if (activeCount >= 10) throw new ApiError(400, 'Maximum 10 active alerts — delete one first');

  const { symbol, condition, targetPrice, note } = req.body;
  const alert = await Alert.create({
    user:        req.user.id,
    symbol:      symbol.trim().toUpperCase(),
    condition,
    targetPrice: parseFloat(targetPrice),
    note,
  });
  res.status(201).json(new ApiResponse(201, alert, 'Alert created'));
});

/** DELETE /api/alerts/:id */
const deleteAlert = asyncHandler(async (req, res) => {
  const alert = await Alert.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!alert) throw new ApiError(404, 'Alert not found');
  res.json(new ApiResponse(200, {}, 'Alert deleted'));
});

/** PATCH /api/alerts/:id/toggle */
const toggleAlert = asyncHandler(async (req, res) => {
  const alert = await Alert.findOne({ _id: req.params.id, user: req.user.id });
  if (!alert) throw new ApiError(404, 'Alert not found');
  alert.isActive = !alert.isActive;
  await alert.save();
  res.json(new ApiResponse(200, alert, `Alert ${alert.isActive ? 'enabled' : 'disabled'}`));
});

module.exports = { getAlerts, createAlert, deleteAlert, toggleAlert };
