const router  = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const { verifyJWT }   = require('../middleware/auth');
const ctrl = require('../controllers/auth.controller');

// ── Validation rule sets ──────────────────────────────────────────────────────
const registerRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 }).withMessage('Username: 3–20 chars')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username: letters, numbers, underscores only'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password min 8 chars')
    .matches(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])/)
    .withMessage('Password needs uppercase, lowercase, and a digit'),
];

const loginRules = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password required'),
];

// ── Routes ────────────────────────────────────────────────────────────────────
router.post('/register',        authLimiter, registerRules, validate, ctrl.register);
router.post('/login',           authLimiter, loginRules,    validate, ctrl.login);
router.post('/refresh-token',   ctrl.refreshAccessToken);
router.post('/logout',          verifyJWT,   ctrl.logout);
router.get('/me',               verifyJWT,   ctrl.getMe);
router.patch('/me',             verifyJWT,   ctrl.updateProfile);
router.post('/change-password', verifyJWT,   ctrl.changePassword);
router.patch('/watchlist',      verifyJWT,   ctrl.updateWatchlist);

module.exports = router;
