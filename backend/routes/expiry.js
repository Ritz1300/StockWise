const express = require("express");
const router = express.Router();
const { getExpiryAlerts } = require("../controllers/expiryController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.get("/", getExpiryAlerts);

module.exports = router;
