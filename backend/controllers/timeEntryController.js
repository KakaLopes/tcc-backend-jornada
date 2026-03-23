const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function clockIn(req, res) {
  try {
    const userId = req.user.id;
    const { note } = req.body;

    const openEntry = await prisma.work_entries.findFirst({
      where: {
        user_id: userId,
        clock_out: null
      },
      orderBy: {
        clock_in: "desc"
      }
    });

    if (openEntry) {
      return res.status(400).json({
        error: "Você já tem um clock-in aberto. Faça clock-out antes."
      });
    }

    const entry = await prisma.work_entries.create({
      data: {
        user_id: userId,
        clock_in: new Date(),
        note: note || null
      }
    });

    return res.json({
      message: "Clock-in realizado com sucesso",
      entry
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function clockOut(req, res) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const userId = req.user.id;
    const note = req.body.note;

    const openEntry = await prisma.work_entries.findFirst({
      where: {
        user_id: userId,
        clock_out: null
      },
      orderBy: {
        clock_in: "desc"
      }
    });

    if (!openEntry) {
      return res.status(400).json({
        error: "Você não tem um clock-in aberto para fazer clock-out."
      });
    }

    const now = new Date();

    const durationMs = now.getTime() - new Date(openEntry.clock_in).getTime();
    const durationMinutes = Math.max(0, Math.floor(durationMs / 60000));

    const updateData = {
      clock_out: now,
      duration_minutes: durationMinutes
    };

    if (note && String(note).trim() !== "") {
      updateData.note = note;
    }

    const updated = await prisma.work_entries.update({
      where: { id: openEntry.id },
      data: updateData
    });

    return res.json({
      message: "Clock-out realizado com sucesso",
      entry: updated
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function getMyEntries(req, res) {
  try {
    const userId = req.user.id;

    const entries = await prisma.work_entries.findMany({
      where: { user_id: userId },
      orderBy: { clock_in: "desc" },
      select: {
        id: true,
        clock_in: true,
        clock_out: true,
        duration_minutes: true,
        note: true,
        created_at: true,
        updated_at: true
      }
    });

    return res.json(entries);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  clockIn,
  clockOut,
  getMyEntries
};