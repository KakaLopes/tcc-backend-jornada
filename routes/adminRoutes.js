const crypto = require("crypto");
const express = require("express");
const router = express.Router();
const { auth, isAdmin } = require("../middlewares/auth");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const {
  getDashboard,
  getPendingAdjustments,
  approveAdjustment,
  rejectAdjustment,
  getSystemStats,
  getAuditLogs
} = require("../controllers/adminController");
router.get("/dashboard", auth, isAdmin, getDashboard);
module.exports = router;
router.get("/audit-logs", auth, isAdmin, getAuditLogs);
router.get("/system-stats", auth, isAdmin, getSystemStats);
// ADMIN - listar ajustes pendentes
router.get("/adjustments", auth, isAdmin, getPendingAdjustments);

// ADMIN - aprovar ajuste
router.post("/adjustments/:id/approve", auth, isAdmin, approveAdjustment);

// ADMIN - rejeitar ajuste
router.post("/adjustments/:id/reject", auth, isAdmin, rejectAdjustment);

