const mongoose = require("mongoose");

const stockMovementSchema = new mongoose.Schema(
  {
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch" },
    type: {
      type: String,
      enum: ["received", "sale", "adjustment", "waste", "return", "opening"],
      required: true,
    },
    quantity: { type: Number, required: true },
    quantityBefore: { type: Number },
    quantityAfter: { type: Number },
    reference: { type: String },
    referenceId: { type: mongoose.Schema.Types.ObjectId },
    notes: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

stockMovementSchema.index({ store: 1, product: 1, createdAt: -1 });

module.exports = mongoose.model("StockMovement", stockMovementSchema);
