const express = require("express");
const router = express.Router();
const { getPurchaseOrders, getPurchaseOrder, createPurchaseOrder, updateStatus, receiveGoods } = require("../controllers/purchaseOrderController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);
router.get("/", getPurchaseOrders);
router.get("/:id", getPurchaseOrder);
router.post("/", authorize("owner", "manager"), createPurchaseOrder);
router.put("/:id/status", authorize("owner", "manager"), updateStatus);
router.post("/:id/receive", authorize("owner", "manager"), receiveGoods);

module.exports = router;
