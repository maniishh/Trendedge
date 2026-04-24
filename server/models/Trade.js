const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema(
  {
    user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    symbol:   { type: String, required: true, uppercase: true, trim: true },
    type:     { type: String, enum: ['BUY', 'SELL'], required: true },
    quantity: { type: Number, required: true, min: 0.0001 },
    price:    { type: Number, required: true, min: 0.01 },
    total:    { type: Number },
    notes:    { type: String, maxlength: 300, default: '' },
  },
  { timestamps: true }
);

tradeSchema.index({ user: 1, createdAt: -1 });
tradeSchema.index({ user: 1, symbol: 1 });

// Auto-calculate total
tradeSchema.pre('save', function (next) {
  this.total = parseFloat((this.quantity * this.price).toFixed(2));
  next();
});

module.exports = mongoose.model('Trade', tradeSchema);
