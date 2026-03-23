const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function getMyHoursToday(req, res) {
  try {
    const userId = req.user.id;

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const entries = await prisma.work_entries.findMany({
      where: {
        user_id: userId,
        clock_in: { gte: start, lt: end }
      },
      select: {
        clock_in: true,
        clock_out: true
      }
    });

    let totalMinutes = 0;

    for (const e of entries) {
      const inTime = new Date(e.clock_in);
      const outTime = e.clock_out ? new Date(e.clock_out) : new Date();

      const diffMs = outTime - inTime;
      if (diffMs > 0) totalMinutes += Math.floor(diffMs / 60000);
    }

    const hours = Number((totalMinutes / 60).toFixed(2));

    return res.json({
      date: start.toISOString().slice(0, 10),
      total_minutes: totalMinutes,
      total_hours: hours
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function getMyHoursWeek(req, res) {
  try {
    const userId = req.user.id;

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const day = start.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - diffToMonday);

    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    const entries = await prisma.work_entries.findMany({
      where: {
        user_id: userId,
        clock_in: { gte: start, lt: end }
      },
      select: {
        clock_in: true,
        clock_out: true
      }
    });

    let totalMinutes = 0;

    for (const e of entries) {
      const inTime = new Date(e.clock_in);
      const outTime = e.clock_out ? new Date(e.clock_out) : new Date();
      const diffMs = outTime - inTime;
      if (diffMs > 0) totalMinutes += Math.floor(diffMs / 60000);
    }

    const hours = Number((totalMinutes / 60).toFixed(2));

    return res.json({
      week_start: start.toISOString().slice(0, 10),
      week_end: end.toISOString().slice(0, 10),
      total_minutes: totalMinutes,
      total_hours: hours
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
async function getMe(req, res) {
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

    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
async function getUsers(req, res) {
  try {
    const users = await prisma.users.findMany({
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
        created_at: true,
        updated_at: true
      }
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createUser(req, res) {
  try {
    const { full_name, email, password, role } = req.body;

    const password_hash = await bcrypt.hash(password, 10);

    const user = await prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        full_name,
        email,
        password_hash,
        role: role || "user"
      }
    });

    res.json({
      message: "Usuário criado com sucesso",
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
module.exports = {
    getMe,
  getMyHoursToday,
  getMyHoursWeek,
  getUsers,
  createUser
};