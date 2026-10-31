const mongoose = require("mongoose");

const poItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  productName: { type: String },
  orderedQty: { type: Number, required: true, min: 1 },
  receivedQty: { type: Number, default: 0 },
  unitCost: { type: Number, required: true, min: 0 },
  subtotal: { type: Number, required: true },
});

const purchaseOrderSchema = new mongoose.Schema(
  {
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    poNumber: { type: String, required: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true },
    items: [poItemSchema],
    status: {
      type: String,
      enum: ["draft", "sent", "partial", "received", "cancelled"],
      default: "draft",
    },
    orderDate: { type: Date, default: Date.now },
    expectedDate: { type: Date },
    receivedDate: { type: Date },
    totalAmount: { type: Number },
    notes: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

purchaseOrderSchema.index({ store: 1, poNumber: 1 }, { unique: true });

module.exports = mongoose.model("PurchaseOrder", purchaseOrderSchema);
