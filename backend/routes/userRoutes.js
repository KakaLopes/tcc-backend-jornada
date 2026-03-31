const express = require("express");
const router = express.Router();

const { auth, isAdmin } = require("../middlewares/auth");

const {
  clockIn,
  clockOut,
  getMyEntries,
} = require("../controllers/timeEntryController");

const { requestAdjustment } = require("../controllers/adjustmentController");

const {
  getMyHoursToday,
  getMyHoursWeek,
  getMe,
  getUsers,
  createUser,
} = require("../controllers/userController");

const {
  requestLeave,
  getMyLeaves,
  getAllLeaves,
  updateLeaveStatus,
} = require("../controllers/leaveController");

// usuário autenticado
router.get("/me", auth, getMe);
router.get("/my-hours-today", auth, getMyHoursToday);
router.get("/my-hours-week", auth, getMyHoursWeek);
router.get("/my-entries", auth, getMyEntries);

// usuários
router.get("/users", auth, isAdmin, getUsers);
router.post("/users", createUser);

// jornadas
router.post("/clock-in", auth, clockIn);
router.post("/clock-out", auth, clockOut);

// ajustes
router.post("/adjustments/request", auth, requestAdjustment);

// leave requests
router.post("/leave", auth, requestLeave);
router.get("/my-leaves", auth, getMyLeaves);

// admin - leave requests
router.get("/leaves", auth, isAdmin, getAllLeaves);
router.put("/leave/:id", auth, isAdmin, updateLeaveStatus);

module.exports = router;