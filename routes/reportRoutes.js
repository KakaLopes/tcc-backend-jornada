const express = require("express");
const router = express.Router();

const { auth, isAdmin } = require("../middlewares/auth");
const {
  getUserHoursRange,
  getHoursToday,
  getHoursWeek,
  getHoursRange
} = require("../controllers/reportController");

router.get("/user-hours-range", auth, isAdmin, getUserHoursRange);
router.get("/hours-today", auth, isAdmin, getHoursToday);
router.get("/hours-week", auth, isAdmin, getHoursWeek);
router.get("/hours-range", auth, isAdmin, getHoursRange);

module.exports = router;