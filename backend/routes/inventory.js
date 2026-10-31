const express = require("express");
const router = express.Router();
const { getInventory, getProductBatches, getStockMovements, adjustStock, recordWaste, getInventorySummary } = require("../controllers/inventoryController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);
router.get("/", getInventory);
router.get("/summary", getInventorySummary);
router.get("/batches/:productId", getProductBatches);
router.get("/movements", getStockMovements);
router.get("/movements/:productId", getStockMovements);
router.post("/adjust", authorize("owner", "manager"), adjustStock);
router.post("/waste", authorize("owner", "manager"), recordWaste);

module.exports = router;