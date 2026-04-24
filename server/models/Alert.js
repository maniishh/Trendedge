const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    symbol:      { type: String, required: true, uppercase: true, trim: true },
    condition:   { type: String, enum: ['above', 'below'], required: true },
    targetPrice: { type: Number, required: true, min: 0.01 },
    isActive:    { type: Boolean, default: true },
    triggeredAt: { type: Date,   default: null },
    note:        { type: String, maxlength: 200, default: '' },
  },
  { timestamps: true }
);

alertSchema.index({ user: 1, isActive: 1 });
alertSchema.index({ symbol: 1, isActive: 1 });

module.exports = mongoose.model('Alert', alertSchema);
