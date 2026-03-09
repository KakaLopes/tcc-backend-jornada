const crypto = require("crypto");
const express = require("express");
const router = express.Router();
const { auth, isAdmin } = require("../middlewares/auth");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { getDashboard } = require("../controllers/adminController");

router.get("/dashboard", auth, isAdmin, getDashboard);
module.exports = router;
// ADMIN - listar ajustes pendentes
router.get("/adjustments", auth, isAdmin, async (req, res) => {
  try {
    const adjustments = await prisma.adjustments.findMany({
      where: { approved_at: null },
      orderBy: { created_at: "desc" }
    });

    res.json(adjustments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ADMIN - aprovar ajuste
router.post("/adjustments/:id/approve", auth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const adjustment = await prisma.adjustments.findUnique({
      where: { id }
    });

    if (!adjustment) {
      return res.status(404).json({ error: "Ajuste não encontrado" });
    }

    if (adjustment.approved_at) {
      return res.status(409).json({ error: "Esse ajuste já foi processado" });
    }

    if (!adjustment.work_entry_id) {
      return res.status(400).json({ error: "Ajuste sem work_entry_id (dados incompletos)" });
    }

    const entry = await prisma.work_entries.findUnique({
      where: { id: adjustment.work_entry_id }
    });

    if (!entry) {
      return res.status(404).json({ error: "Ponto não encontrado" });
    }

    const newClockIn = new Date(adjustment.new_value);

    let durationMinutes = entry.duration_minutes;

    if (entry.clock_out) {
      const durationMs = new Date(entry.clock_out).getTime() - newClockIn.getTime();
      durationMinutes = Math.max(0, Math.floor(durationMs / 60000));
    }

    const updatedEntry = await prisma.work_entries.update({
      where: { id: adjustment.work_entry_id },
      data: {
        clock_in: newClockIn,
        duration_minutes: durationMinutes
      }
    });

    const approved = await prisma.adjustments.update({
      where: { id },
      data: {
        approved_by: req.user.id,
        approved_at: new Date()
      }
    });

    await prisma.audit_logs.create({
      data: {
        id: crypto.randomUUID(),
        action: "APPROVE_ADJUSTMENT",
        entity: "adjustments",
        entity_id: approved.id,
        user_id: req.user.id
      }
    });

    return res.json({
      message: "Ajuste aprovado e ponto atualizado",
      adjustment: approved,
      updated_entry: updatedEntry
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ADMIN - rejeitar ajuste
router.post("/adjustments/:id/reject", auth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const adjustment = await prisma.adjustments.findUnique({
      where: { id }
    });

    if (!adjustment) {
      return res.status(404).json({ error: "Ajuste não encontrado" });
    }

    if (adjustment.approved_at) {
      return res.status(409).json({ error: "Esse ajuste já foi processado" });
    }

    const rejected = await prisma.adjustments.update({
      where: { id },
      data: {
        approved_by: req.user.id,
        approved_at: new Date(),
        reason: (adjustment.reason || "") + " (REJEITADO)"
      }
    });

    await prisma.audit_logs.create({
      data: {
        id: crypto.randomUUID(),
        action: "REJECT_ADJUSTMENT",
        entity: "adjustments",
        entity_id: rejected.id,
        user_id: req.user.id
      }
    });

    return res.json({
      message: "Ajuste rejeitado",
      adjustment: rejected
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});