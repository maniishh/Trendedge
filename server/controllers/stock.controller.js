const stockSvc  = require('../services/stock.service');
const User       = require('../models/User');
const ApiError   = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const DEFAULTS = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN'];

/** GET /api/stocks — returns watchlist stocks with 20-DMA signals */
const getDashboardStocks = asyncHandler(async (req, res) => {
  const user    = await User.findById(req.user.id);
  const symbols = user?.watchlist?.length ? user.watchlist : DEFAULTS;
  const data    = await stockSvc.fetchMultipleStocks(symbols);
  res.json(new ApiResponse(200, data));
});

/** GET /api/stocks/search?q=AAPL */
const searchStocks = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q?.trim()) throw new ApiError(400, 'Query param q is required');
  const results = await stockSvc.searchSymbol(q.trim());
  res.json(new ApiResponse(200, results));
});

/** GET /api/stocks/:symbol */
const getStockDetail = asyncHandler(async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const data   = await stockSvc.fetchSingleStock(symbol);
  if (!data) throw new ApiError(404, `No data found for ${symbol}`);
  res.json(new ApiResponse(200, data));
});

module.exports = { getDashboardStocks, searchStocks, getStockDetail };
