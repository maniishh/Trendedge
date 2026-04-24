const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');

const userSchema = new mongoose.Schema(
  {
    email: {
      type:     String,
      required: [true, 'Email is required'],
      unique:   true,
      lowercase: true,
      trim:     true,
      match:    [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,4})+$/, 'Invalid email'],
    },
    username: {
      type:      String,
      required:  [true, 'Username is required'],
      unique:    true,
      trim:      true,
      minlength: [3,  'Username min 3 chars'],
      maxlength: [20, 'Username max 20 chars'],
      match:     [/^[a-zA-Z0-9_]+$/, 'Username: letters, numbers, underscore only'],
    },
    password: {
      type:      String,
      required:  [true, 'Password is required'],
      minlength: [8, 'Password min 8 chars'],
      select:    false,
    },
    firstName: { type: String, trim: true, default: '' },
    lastName:  { type: String, trim: true, default: '' },
    avatar:    { type: String, default: '' },
    role:      { type: String, enum: ['user', 'admin'], default: 'user' },

    watchlist: {
      type:    [String],
      default: ['AAPL', 'MSFT', 'GOOGL'],
    },

    // Token fields — never returned by default
    refreshToken:         { type: String, select: false },
    resetPasswordToken:   { type: String, select: false },
    resetPasswordExpires: { type: Date,   select: false },

    lastLogin: { type: Date },
  },
  { timestamps: true }
);

// ── Indexes ─────────────────────────────────────────────────────────────────
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

// ── Virtual ──────────────────────────────────────────────────────────────────
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`.trim() || this.username;
});

// ── Pre-save: hash password ──────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ── Instance methods ─────────────────────────────────────────────────────────
userSchema.methods.isPasswordCorrect = function (plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.generatePasswordResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken   = crypto.createHash('sha256').update(rawToken).digest('hex');
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 min
  return rawToken;
};

module.exports = mongoose.model('User', userSchema);
