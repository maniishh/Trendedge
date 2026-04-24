const Portfolio  = require('../models/Portfolio');
const Trade      = require('../models/Trade');
const stockSvc   = require('../services/stock.service');
const ApiError   = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/** GET /api/portfolio */
const getPortfolio = asyncHandler(async (req, res) => {
  let portfolio = await Portfolio.findOne({ user: req.user.id });
  if (!portfolio) {
    portfolio = await Portfolio.create({ user: req.user.id, holdings: [] });
  }

  // Fetch live prices for all held symbols
  const symbols  = portfolio.holdings.map(h => h.symbol);
  const liveMap  = {};
  if (symbols.length) {
    const stocks = await stockSvc.fetchMultipleStocks(symbols);
    stocks.forEach(s => { liveMap[s.symbol] = s.current; });
  }

  const holdings = portfolio.holdings.map(h => {
    const live      = liveMap[h.symbol] ?? 0;
    const invested  = h.avgBuyPrice * h.quantity;
    const current   = live * h.quantity;
    const pnl       = current - invested;
    const pnlPct    = invested > 0 ? (pnl / invested) * 100 : 0;
    return {
      symbol:       h.symbol,
      avgBuyPrice:  h.avgBuyPrice,
      quantity:     h.quantity,
      firstPurchaseDate: h.firstPurchaseDate,
      currentPrice: live,
      invested:     +invested.toFixed(2),
      currentValue: +current.toFixed(2),
      pnl:          +pnl.toFixed(2),
      pnlPct:       +pnlPct.toFixed(2),
    };
  });

  const totalInvested = holdings.reduce((s, h) => s + h.invested, 0);
  const totalCurrent  = holdings.reduce((s, h) => s + h.currentValue, 0);
  const totalPnl      = totalCurrent - totalInvested;

  res.json(new ApiResponse(200, {
    holdings,
    summary: {
      totalInvested: +totalInvested.toFixed(2),
      totalCurrent:  +totalCurrent.toFixed(2),
      totalPnl:      +totalPnl.toFixed(2),
      totalPnlPct:   totalInvested > 0 ? +((totalPnl / totalInvested) * 100).toFixed(2) : 0,
    },
  }));
});

/**
 * POST /api/portfolio/trade
 * Records a BUY or SELL trade and updates holdings using weighted-average cost.
 */
const addTrade = asyncHandler(async (req, res) => {
  const { symbol, type, quantity, price, notes } = req.body;
  const sym = symbol.trim().toUpperCase();
  const qty = parseFloat(quantity);
  const prc = parseFloat(price);

  // Record trade document
  const trade = await Trade.create({
    user: req.user.id, symbol: sym, type, quantity: qty, price: prc, notes,
  });

  // Update portfolio holdings
  let portfolio = await Portfolio.findOne({ user: req.user.id });
  if (!portfolio) portfolio = await Portfolio.create({ user: req.user.id, holdings: [] });

  const idx = portfolio.holdings.findIndex(h => h.symbol === sym);

  if (type === 'BUY') {
    if (idx >= 0) {
      const h       = portfolio.holdings[idx];
      const newQty  = h.quantity + qty;
      const newAvg  = (h.avgBuyPrice * h.quantity + prc * qty) / newQty;
      portfolio.holdings[idx].avgBuyPrice = +newAvg.toFixed(4);
      portfolio.holdings[idx].quantity    = newQty;
    } else {
      portfolio.holdings.push({ symbol: sym, avgBuyPrice: prc, quantity: qty });
    }
  } else {
    // SELL
    if (idx < 0) throw new ApiError(400, `You have no holding in ${sym}`);
    const h = portfolio.holdings[idx];
    if (h.quantity < qty) throw new ApiError(400, `Insufficient quantity — you hold ${h.quantity}`);
    h.quantity -= qty;
    if (h.quantity <= 0) portfolio.holdings.splice(idx, 1);
    else portfolio.holdings[idx] = h;
  }

  portfolio.markModified('holdings');
  await portfolio.save();

  res.status(201).json(new ApiResponse(201, { trade }, 'Trade recorded successfully'));
});

/** GET /api/portfolio/trades?page=1&limit=20&symbol=AAPL */
const getTradeHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, symbol } = req.query;
  const filter = { user: req.user.id };
  if (symbol) filter.symbol = symbol.trim().toUpperCase();

  const [trades, total] = await Promise.all([
    Trade.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(+limit),
    Trade.countDocuments(filter),
  ]);

  res.json(new ApiResponse(200, {
    trades,
    pagination: {
      page:  +page,
      limit: +limit,
      total,
      pages: Math.ceil(total / limit),
    },
  }));
});

module.exports = { getPortfolio, addTrade, getTradeHistory };
