const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true },
    barcode: { type: String, trim: true },
    category: { type: String, required: true, trim: true },
    unit: { type: String, default: "pcs" },
    costPrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    reorderLevel: { type: Number, default: 10, min: 0 },
    safetyStock: { type: Number, default: 5, min: 0 },
    targetCoverageDays: { type: Number, default: 14, min: 1 },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
    isActive: { type: Boolean, default: true },
    description: { type: String },
    imageUrl: { type: String },
  },
  { timestamps: true }
);

productSchema.index({ store: 1, sku: 1 }, { unique: true });
productSchema.index({ store: 1, name: "text", sku: "text" });

module.exports = mongoose.model("Product", productSchema);
