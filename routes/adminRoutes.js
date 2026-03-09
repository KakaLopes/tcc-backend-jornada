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
  rejectAdjustment
} = require("../controllers/adminController");
router.get("/dashboard", auth, isAdmin, getDashboard);
module.exports = router;
// ADMIN - listar ajustes pendentes
router.get("/adjustments", auth, isAdmin, getPendingAdjustments);

// ADMIN - aprovar ajuste
router.post("/adjustments/:id/approve", auth, isAdmin, approveAdjustment);

// ADMIN - rejeitar ajuste
router.post("/adjustments/:id/reject", auth, isAdmin, rejectAdjustment);