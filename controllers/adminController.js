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

module.exports = {
  getDashboard
};