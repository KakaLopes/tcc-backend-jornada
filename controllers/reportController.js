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
async function getHoursToday(req, res) {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const entries = await prisma.work_entries.findMany({
      where: {
        clock_in: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true
          }
        }
      }
    });

    const result = entries.map(entry => {
      let duration_minutes = null;

      if (entry.clock_out) {
        duration_minutes = Math.floor(
          (new Date(entry.clock_out) - new Date(entry.clock_in)) / 60000
        );
      }

      return {
        id: entry.id,
        user: entry.users,
        clock_in: entry.clock_in,
        clock_out: entry.clock_out,
        duration_minutes
      };
    });

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function getHoursWeek(req, res) {
  try {
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const entries = await prisma.work_entries.findMany({
      where: {
        clock_in: {
          gte: startOfWeek,
          lte: endOfWeek
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
      },
      orderBy: {
        clock_in: "desc"
      }
    });

    const result = entries.map((e) => {
      let duration_minutes = null;

      if (e.clock_out) {
        duration_minutes = Math.max(
          0,
          Math.round((new Date(e.clock_out) - new Date(e.clock_in)) / 60000)
        );
      }

      return {
        id: e.id,
        user: e.users,
        clock_in: e.clock_in,
        clock_out: e.clock_out,
        duration_minutes,
        note: e.note
      };
    });

    return res.json({
      week_start: startOfWeek,
      week_end: endOfWeek,
      total_entries: result.length,
      entries: result
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function getHoursRange(req, res) {
  try {
    const { start, end, user_id } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        error: "Parâmetros obrigatórios: start e end (formato YYYY-MM-DD)"
      });
    }

    const startDate = new Date(`${start}T00:00:00.000Z`);
    const endDate = new Date(`${end}T23:59:59.999Z`);

    const where = {
      clock_in: { gte: startDate, lte: endDate },
      clock_out: { not: null },
      ...(user_id ? { user_id: String(user_id) } : {})
    };

    const entries = await prisma.work_entries.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { clock_in: "desc" }
    });

    const result = entries.map((e) => {
      const durationMinutes = Math.max(
        0,
        Math.round(
          (new Date(e.clock_out).getTime() - new Date(e.clock_in).getTime()) / 60000
        )
      );

      return {
        entry_id: e.id,
        user: e.users,
        clock_in: e.clock_in,
        clock_out: e.clock_out,
        duration_minutes: durationMinutes,
        duration_hours: Number((durationMinutes / 60).toFixed(2)),
        note: e.note
      };
    });

    return res.json({
      start,
      end,
      filter_user_id: user_id ?? null,
      total_entries: result.length,
      total_minutes: result.reduce((acc, r) => acc + r.duration_minutes, 0),
      total_hours: Number(
        (result.reduce((acc, r) => acc + r.duration_minutes, 0) / 60).toFixed(2)
      ),
      entries: result
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
async function getHoursToday(req, res) {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const entries = await prisma.work_entries.findMany({
      where: {
        clock_in: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true
          }
        }
      }
    });

    const result = entries.map(entry => {
      let duration_minutes = null;

      if (entry.clock_out) {
        duration_minutes = Math.floor(
          (new Date(entry.clock_out) - new Date(entry.clock_in)) / 60000
        );
      }

      return {
        id: entry.id,
        user: entry.users,
        clock_in: entry.clock_in,
        clock_out: entry.clock_out,
        duration_minutes
      };
    });

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function getHoursWeek(req, res) {
  try {
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const entries = await prisma.work_entries.findMany({
      where: {
        clock_in: {
          gte: startOfWeek,
          lte: endOfWeek
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
      },
      orderBy: {
        clock_in: "desc"
      }
    });

    const result = entries.map((e) => {
      let duration_minutes = null;

      if (e.clock_out) {
        duration_minutes = Math.max(
          0,
          Math.round((new Date(e.clock_out) - new Date(e.clock_in)) / 60000)
        );
      }

      return {
        id: e.id,
        user: e.users,
        clock_in: e.clock_in,
        clock_out: e.clock_out,
        duration_minutes,
        note: e.note
      };
    });

    return res.json({
      week_start: startOfWeek,
      week_end: endOfWeek,
      total_entries: result.length,
      entries: result
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function getHoursRange(req, res) {
  try {
    const { start, end, user_id } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        error: "Parâmetros obrigatórios: start e end (formato YYYY-MM-DD)"
      });
    }

    const startDate = new Date(`${start}T00:00:00.000Z`);
    const endDate = new Date(`${end}T23:59:59.999Z`);

    const where = {
      clock_in: { gte: startDate, lte: endDate },
      clock_out: { not: null },
      ...(user_id ? { user_id: String(user_id) } : {})
    };

    const entries = await prisma.work_entries.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { clock_in: "desc" }
    });

    const result = entries.map((e) => {
      const durationMinutes = Math.max(
        0,
        Math.round(
          (new Date(e.clock_out).getTime() - new Date(e.clock_in).getTime()) / 60000
        )
      );

      return {
        entry_id: e.id,
        user: e.users,
        clock_in: e.clock_in,
        clock_out: e.clock_out,
        duration_minutes: durationMinutes,
        duration_hours: Number((durationMinutes / 60).toFixed(2)),
        note: e.note
      };
    });

    return res.json({
      start,
      end,
      filter_user_id: user_id ?? null,
      total_entries: result.length,
      total_minutes: result.reduce((acc, r) => acc + r.duration_minutes, 0),
      total_hours: Number(
        (result.reduce((acc, r) => acc + r.duration_minutes, 0) / 60).toFixed(2)
      ),
      entries: result
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
module.exports = {
  getUserHoursRange,
  getHoursToday,
  getHoursWeek,
  getHoursRange
};