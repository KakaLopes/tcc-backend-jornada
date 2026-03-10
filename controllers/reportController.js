const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ADMIN REPORT - horas de um usuário por período
async function getUserHoursRange(req, res) {
  try {
    const { user_id, start, end } = req.query;

    if (!user_id || !start || !end) {
      return res.status(400).json({
        error: "user_id, start e end são obrigatórios"
      });
    }

    const startDate = new Date(`${start}T00:00:00.000Z`);
    const endDate = new Date(`${end}T23:59:59.999Z`);

    const user = await prisma.users.findUnique({
      where: { id: user_id },
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const entries = await prisma.work_entries.findMany({
      where: {
        user_id,
        clock_in: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        clock_in: "asc"
      }
    });

    const totalMinutes = entries.reduce((sum, entry) => {
      return sum + (entry.duration_minutes || 0);
    }, 0);

    return res.json({
      user,
      start,
      end,
      total_entries: entries.length,
      total_minutes: totalMinutes,
      total_hours: Number((totalMinutes / 60).toFixed(2)),
      entries
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getUserHoursRange
};