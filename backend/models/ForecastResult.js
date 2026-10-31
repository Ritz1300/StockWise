const mongoose = require("mongoose");

const forecastResultSchema = new mongoose.Schema(
  {
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    period: { type: Number, enum: [7, 14, 28], default: 7 },
    model: {
      type: String,
      enum: ["naive", "seasonal_naive", "moving_average", "weighted_moving_average", "regression"],
      required: true,
    },
    generatedAt: { type: Date, default: Date.now },
    predictions: [
      {
        date: Date,
        quantity: Number,
      },
    ],
    totalForecast: { type: Number },
    metrics: {
      mae: Number,
      wape: Number,
      bias: Number,
    },
    confidence: { type: String, enum: ["high", "medium", "low"], default: "medium" },
    explanation: { type: String },
  },
  { timestamps: true }
);

forecastResultSchema.index({ store: 1, product: 1, generatedAt: -1 });

module.exports = mongoose.model("ForecastResult", forecastResultSchema);
