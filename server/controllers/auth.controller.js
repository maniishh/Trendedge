const jwt       = require('jsonwebtoken');
const User      = require('../models/User');
const Portfolio = require('../models/Portfolio');
const ApiError  = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateTokens(userId) {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m' }
  );
  const refreshToken = jwt.sign(
    { id: userId },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
  );
  return { accessToken, refreshToken };
}

const COOKIE_OPTS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
};

function safeUser(user) {
  return {
    _id:       user._id,
    email:     user.email,
    username:  user.username,
    firstName: user.firstName,
    lastName:  user.lastName,
    role:      user.role,
    watchlist: user.watchlist,
    avatar:    user.avatar,
    lastLogin: user.lastLogin,
  };
}

// ── Controllers ───────────────────────────────────────────────────────────────

/** POST /api/auth/register */
const register = asyncHandler(async (req, res) => {
  const { email, username, password, firstName = '', lastName = '' } = req.body;

  const conflict = await User.findOne({ $or: [{ email }, { username }] });
  if (conflict) {
    const field = conflict.email === email ? 'Email' : 'Username';
    throw new ApiError(409, `${field} is already taken`);
  }

  const user = await User.create({ email, username, password, firstName, lastName });

  // Provision an empty portfolio for every new user
  await Portfolio.create({ user: user._id, holdings: [] });

  const { accessToken, refreshToken } = generateTokens(user._id);
  user.refreshToken = refreshToken;
  user.lastLogin    = new Date();
  await user.save({ validateBeforeSave: false });

  res
    .status(201)
    .cookie('refreshToken', refreshToken, COOKIE_OPTS)
    .json(new ApiResponse(201, { user: safeUser(user), accessToken }, 'Account created'));
});

/** POST /api/auth/login */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password +refreshToken');
  if (!user || !(await user.isPasswordCorrect(password))) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const { accessToken, refreshToken } = generateTokens(user._id);
  user.refreshToken = refreshToken;
  user.lastLogin    = new Date();
  await user.save({ validateBeforeSave: false });

  res
    .cookie('refreshToken', refreshToken, COOKIE_OPTS)
    .json(new ApiResponse(200, { user: safeUser(user), accessToken }, 'Login successful'));
});

/**
 * POST /api/auth/refresh-token
 * Implements refresh-token rotation: old token is invalidated, new pair issued.
 * Reusing a rotated token is detected and all sessions are wiped (token theft guard).
 */
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incoming = req.cookies?.refreshToken || req.body.refreshToken;
  if (!incoming) throw new ApiError(401, 'Refresh token missing');

  let decoded;
  try {
    decoded = jwt.verify(incoming, process.env.REFRESH_TOKEN_SECRET);
  } catch {
    throw new ApiError(401, 'Refresh token invalid or expired');
  }

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user) throw new ApiError(401, 'User not found');

  // Token reuse detection
  if (user.refreshToken !== incoming) {
    // Potential token theft — invalidate all sessions
    user.refreshToken = undefined;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(401, 'Token reuse detected — please log in again');
  }

  const { accessToken, refreshToken: newRefresh } = generateTokens(user._id);
  user.refreshToken = newRefresh;
  await user.save({ validateBeforeSave: false });

  res
    .cookie('refreshToken', newRefresh, COOKIE_OPTS)
    .json(new ApiResponse(200, { accessToken }, 'Token refreshed'));
});

/** POST /api/auth/logout */
const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { $unset: { refreshToken: '' } });
  res
    .clearCookie('refreshToken', COOKIE_OPTS)
    .json(new ApiResponse(200, {}, 'Logged out'));
});

/** GET /api/auth/me */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(404, 'User not found');
  res.json(new ApiResponse(200, safeUser(user)));
});

/** PATCH /api/auth/me */
const updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, avatar } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $set: { firstName, lastName, avatar } },
    { new: true, runValidators: true }
  );
  res.json(new ApiResponse(200, safeUser(user), 'Profile updated'));
});

/** POST /api/auth/change-password */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.isPasswordCorrect(currentPassword))) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  user.password     = newPassword;
  user.refreshToken = undefined; // invalidate all sessions on password change
  await user.save();

  res
    .clearCookie('refreshToken', COOKIE_OPTS)
    .json(new ApiResponse(200, {}, 'Password changed — please log in again'));
});

/** PATCH /api/auth/watchlist */
const updateWatchlist = asyncHandler(async (req, res) => {
  let { symbols } = req.body;
  if (!Array.isArray(symbols)) throw new ApiError(400, 'symbols must be an array');

  symbols = [...new Set(symbols.map(s => String(s).trim().toUpperCase()).filter(Boolean))];
  if (symbols.length === 0) throw new ApiError(400, 'Watchlist cannot be empty');
  if (symbols.length > 20) throw new ApiError(400, 'Maximum 20 symbols allowed');

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { watchlist: symbols },
    { new: true }
  );
  res.json(new ApiResponse(200, { watchlist: user.watchlist }, 'Watchlist updated'));
});

module.exports = {
  register, login, refreshAccessToken, logout,
  getMe, updateProfile, changePassword, updateWatchlist,
};
