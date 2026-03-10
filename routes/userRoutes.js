const express = require("express");
const router = express.Router();
const { auth } = require("../middlewares/auth");
const {
  clockIn,
  clockOut,
  getMyEntries
} = require("../controllers/timeEntryController");
const { requestAdjustment } = require("../controllers/adjustmentController");
const { PrismaClient } = require("@prisma/client");
const {
  getMyHoursToday,
  getMyHoursWeek,
  getMe
} = require("../controllers/userController");
const prisma = new PrismaClient();
router.get("/my-hours-today", auth, getMyHoursToday);
router.get("/my-hours-week", auth, getMyHoursWeek);
router.get("/me", auth, getMe);
// perfil do usuário logado
router.get("/me", auth, async (req, res) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
        created_at: true,
        updated_at: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// jornadas
router.post("/clock-in", auth, clockIn);
router.post("/clock-out", auth, clockOut);
router.get("/my-entries", auth, getMyEntries);

// ajustes
router.post("/adjustments/request", auth, requestAdjustment);

module.exports = router;