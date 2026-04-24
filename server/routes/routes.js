// ── stock.routes.js ────────────────────────────────────────────────────────
const stockRouter = require('express').Router();
const { verifyJWT }  = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const ctrl = require('../controllers/stock.controller');

stockRouter.use(verifyJWT, apiLimiter);
stockRouter.get('/search',  ctrl.searchStocks);
stockRouter.get('/',        ctrl.getDashboardStocks);
stockRouter.get('/:symbol', ctrl.getStockDetail);

module.exports.stockRouter = stockRouter;

// ── portfolio.routes.js ────────────────────────────────────────────────────
const { body }    = require('express-validator');
const validate    = require('../middleware/validate');
const portfolioRouter = require('express').Router();
const pCtrl = require('../controllers/portfolio.controller');

const tradeRules = [
  body('symbol').notEmpty().trim().isLength({ max: 10 }),
  body('type').isIn(['BUY', 'SELL']),
  body('quantity').isFloat({ min: 0.0001 }).withMessage('Quantity must be > 0'),
  body('price').isFloat({ min: 0.01 }).withMessage('Price must be > 0'),
];

portfolioRouter.use(verifyJWT);
portfolioRouter.get('/',        pCtrl.getPortfolio);
portfolioRouter.post('/trade',  tradeRules, validate, pCtrl.addTrade);
portfolioRouter.get('/trades',  pCtrl.getTradeHistory);

module.exports.portfolioRouter = portfolioRouter;

// ── alert.routes.js ────────────────────────────────────────────────────────
const alertRouter = require('express').Router();
const aCtrl = require('../controllers/alert.controller');

const alertRules = [
  body('symbol').notEmpty().trim().isLength({ max: 10 }),
  body('condition').isIn(['above', 'below']),
  body('targetPrice').isFloat({ min: 0.01 }),
];

alertRouter.use(verifyJWT);
alertRouter.get('/',              aCtrl.getAlerts);
alertRouter.post('/',             alertRules, validate, aCtrl.createAlert);
alertRouter.delete('/:id',        aCtrl.deleteAlert);
alertRouter.patch('/:id/toggle',  aCtrl.toggleAlert);

module.exports.alertRouter = alertRouter;
