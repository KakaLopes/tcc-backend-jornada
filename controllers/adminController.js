const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function getDashboard(req, res) {
  try {
    const totalUsers = await prisma.users.count();
    const totalEntries = await prisma.work_entries.count();

    const entriesWithDuration = await prisma.work_entries.findMany({
      where: {
        duration_minutes: {
          not: null
        }
      },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
            role: true
          }
        }
      }
    });

    const totalMinutes = entriesWithDuration.reduce((sum, entry) => {
      return sum + (entry.duration_minutes || 0);
    }, 0);

    const grouped = {};

    for (const entry of entriesWithDuration) {
      const userId = entry.user_id;

      if (!grouped[userId]) {
        grouped[userId] = {
          user_id: entry.users.id,
          full_name: entry.users.full_name,
          email: entry.users.email,
          role: entry.users.role,
          total_minutes: 0
        };
      }

      grouped[userId].total_minutes += entry.duration_minutes || 0;
    }

    const topWorker = Object.values(grouped)
      .map(user => ({
        ...user,
        total_hours: Number((user.total_minutes / 60).toFixed(2))
      }))
      .sort((a, b) => b.total_minutes - a.total_minutes)[0] || null;

    return res.json({
      total_users: totalUsers,
      total_entries: totalEntries,
      total_minutes: totalMinutes,
      total_hours: Number((totalMinutes / 60).toFixed(2)),
      top_worker: topWorker
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function getPendingAdjustments(req, res) {
  try {
    const adjustments = await prisma.adjustments.findMany({
      where: { approved_at: null },
      orderBy: { created_at: "desc" }
    });

    return res.json(adjustments);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function approveAdjustment(req, res) {
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
}

async function rejectAdjustment(req, res) {
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
}
module.exports = {
  getDashboard,
  getPendingAdjustments,
  approveAdjustment,
  rejectAdjustment
};