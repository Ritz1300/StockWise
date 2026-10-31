const express = require("express");
const router = express.Router();
const { createSale, getSales, getSale, getSalesSummary } = require("../controllers/salesController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.get("/summary", getSalesSummary);
router.get("/", getSales);
router.post("/", createSale);
router.get("/:id", getSale);

module.exports = router;
