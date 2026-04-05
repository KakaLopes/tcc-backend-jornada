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
        clock_in: { gte: start, lt: end },
      },
      select: {
        clock_in: true,
        clock_out: true,
      },
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
      total_hours: hours,
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
        clock_in: { gte: start, lt: end },
      },
      select: {
        clock_in: true,
        clock_out: true,
      },
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
      total_hours: hours,
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
        phone: true,
        address: true,
        annual_leave_days: true,
        leave_balance: true,
        employee_type: true,
        payment_type: true,
        active: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      ...user,
      leave_balance:
        user.leave_balance != null
          ? user.leave_balance
          : user.annual_leave_days ?? 20,
    });
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
        phone: true,
        address: true,
        annual_leave_days: true,
        leave_balance: true,
        employee_type: true,
        payment_type: true,
        active: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: {
        full_name: "asc",
      },
    });

    return res.json(users);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function createUser(req, res) {
  try {
    const {
      full_name,
      email,
      password,
      role,
      phone,
      address,
      employee_type,
      payment_type,
      active,
    } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({
        error: "Full name, email, and password are required",
      });
    }

    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: "Email address already registered" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const user = await prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        full_name,
        email,
        password_hash,
        role: role || "user",
        phone: phone || null,
        address: address || null,
        employee_type: employee_type || null,
        payment_type: payment_type || null,
        active: active !== undefined ? active : true,
      },
    });

    return res.json({
      message: "Account created successfully!",
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        employee_type: user.employee_type,
        payment_type: user.payment_type,
        active: user.active,
      },
    });
  } catch (error) {
    console.log("CREATE USER ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
}

async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { employee_type, payment_type, active } = req.body;

    const existingUser = await prisma.users.findUnique({
      where: { id: String(id) },
    });

    if (!existingUser) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const updatedUser = await prisma.users.update({
      where: { id: String(id) },
      data: {
        employee_type:
          employee_type !== undefined ? employee_type : existingUser.employee_type,
        payment_type:
          payment_type !== undefined ? payment_type : existingUser.payment_type,
        active: active !== undefined ? active : existingUser.active,
      },
    });

    return res.json({
      message: "Employee updated successfully",
      user: {
        id: updatedUser.id,
        full_name: updatedUser.full_name,
        email: updatedUser.email,
        role: updatedUser.role,
        employee_type: updatedUser.employee_type,
        payment_type: updatedUser.payment_type,
        active: updatedUser.active,
      },
    });
  } catch (error) {
    console.log("UPDATE USER ERROR:", error);
    return res.status(500).json({ error: "Unable to update employee" });
  }
}

module.exports = {
  getMe,
  getMyHoursToday,
  getMyHoursWeek,
  getUsers,
  createUser,
  updateUser,
};