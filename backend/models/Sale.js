const mongoose = require("mongoose");

const saleItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  productName: { type: String, required: true },
  productSku: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  sellingPrice: { type: Number, required: true, min: 0 },
  costPrice: { type: Number, required: true, min: 0 },
  subtotal: { type: Number, required: true },
});

const saleSchema = new mongoose.Schema(
  {
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    saleNumber: { type: String, required: true },
    items: [saleItemSchema],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "upi", "other"],
      default: "cash",
    },
    notes: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    saleDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

saleSchema.index({ store: 1, saleDate: -1 });
saleSchema.index({ store: 1, saleNumber: 1 }, { unique: true });

module.exports = mongoose.model("Sale", saleSchema);
