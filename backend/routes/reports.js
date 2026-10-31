const express = require("express");
const router = express.Router();
const { getSalesReport, getInventoryReport, getWasteReport } = require("../controllers/reportsController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.get("/sales", getSalesReport);
router.get("/inventory", getInventoryReport);
router.get("/waste", getWasteReport);

module.exports = router;
