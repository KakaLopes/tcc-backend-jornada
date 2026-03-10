const express = require("express");
const router = express.Router();

const { auth, isAdmin } = require("../middlewares/auth");
const { getUserHoursRange } = require("../controllers/reportController");

router.get("/user-hours-range", auth, isAdmin, getUserHoursRange);

module.exports = router;