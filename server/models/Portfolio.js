const mongoose = require('mongoose');

const holdingSchema = new mongoose.Schema(
  {
    symbol:            { type: String, required: true, uppercase: true, trim: true },
    avgBuyPrice:       { type: Number, required: true, min: 0 },
    quantity:          { type: Number, required: true, min: 0 },
    firstPurchaseDate: { type: Date,   default: Date.now },
  },
  { _id: false }
);

const portfolioSchema = new mongoose.Schema(
  {
    user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    holdings: { type: [holdingSchema], default: [] },
  },
  { timestamps: true }
);

portfolioSchema.index({ user: 1 });

module.exports = mongoose.model('Portfolio', portfolioSchema);
