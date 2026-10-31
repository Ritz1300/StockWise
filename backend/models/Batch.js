const mongoose = require("mongoose");

const batchSchema = new mongoose.Schema(
  {
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    batchNumber: { type: String, required: true, trim: true },
    receivedDate: { type: Date, required: true },
    expiryDate: { type: Date },
    initialQuantity: { type: Number, required: true, min: 0 },
    remainingQuantity: { type: Number, required: true, min: 0 },
    unitCost: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["active", "exhausted", "expired", "wasted"],
      default: "active",
    },
    purchaseOrder: { type: mongoose.Schema.Types.ObjectId, ref: "PurchaseOrder" },
    notes: { type: String },
  },
  { timestamps: true }
);

batchSchema.index({ store: 1, product: 1, status: 1, expiryDate: 1 });

module.exports = mongoose.model("Batch", batchSchema);
