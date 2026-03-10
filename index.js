
const { login } = require("./controllers/authController");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const app = express();
const prisma = new PrismaClient();
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { auth, isAdmin} = require("./middlewares/auth");
const reportRoutes = require("./routes/reportRoutes");
app.use(cors());
app.use(express.json());
app.use("/admin", adminRoutes);
app.use("/", userRoutes);
app.use("/admin/reports", reportRoutes);
// rota teste
app.get("/", (req, res) => {
  res.send("Servidor do TCC está funcionando!");
});
// ADMIN REPORT - horas de um usuário por período
// Horas trabalhadas hoje (usuário logado)
app.get("/my-hours-today", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // pega a data de hoje (00:00:00)
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    // amanhã (00:00:00) pra fechar o intervalo
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    // busca entradas de hoje do usuário
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

    // soma minutos
    let totalMinutes = 0;

    for (const e of entries) {
      const inTime = new Date(e.clock_in);
      const outTime = e.clock_out ? new Date(e.clock_out) : new Date(); // se ainda aberto, conta até agora

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
});
// Admin: horas de todos HOJE
app.get("/admin/hours-today", auth, isAdmin, async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const entries = await prisma.work_entries.findMany({
      where: { clock_in: { gte: start, lt: end } },
      select: {
        user_id: true,
        clock_in: true,
        clock_out: true,
        users: { select: { id: true, full_name: true, email: true, role: true } }
      }
    });

    const totals = new Map(); // user_id -> { user, totalMinutes }

    for (const e of entries) {
      const inTime = new Date(e.clock_in);
      const outTime = e.clock_out ? new Date(e.clock_out) : new Date(); // se aberto, conta até agora
      const diffMs = outTime - inTime;
      const minutes = diffMs > 0 ? Math.floor(diffMs / 60000) : 0;

      const key = e.user_id;
      if (!totals.has(key)) {
        totals.set(key, { user: e.users, totalMinutes: 0 });
      }
      totals.get(key).totalMinutes += minutes;
    }

    const result = Array.from(totals.values())
      .map(({ user, totalMinutes }) => ({
        user,
        total_minutes: totalMinutes,
        total_hours: Number((totalMinutes / 60).toFixed(2))
      }))
      .sort((a, b) => b.total_minutes - a.total_minutes);

    res.json({
      date: start.toISOString().slice(0, 10),
      count_users: result.length,
      data: result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Admin: horas de todos na SEMANA (segunda a domingo)
app.get("/admin/hours-week", auth, isAdmin, async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const day = start.getDay(); // 0=dom,1=seg...
    const diffToMonday = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - diffToMonday);

    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    const entries = await prisma.work_entries.findMany({
      where: { clock_in: { gte: start, lt: end } },
      select: {
        user_id: true,
        clock_in: true,
        clock_out: true,
        users: { select: { id: true, full_name: true, email: true, role: true } }
      }
    });

    const totals = new Map();

    for (const e of entries) {
      const inTime = new Date(e.clock_in);
      const outTime = e.clock_out ? new Date(e.clock_out) : new Date();
      const diffMs = outTime - inTime;
      const minutes = diffMs > 0 ? Math.floor(diffMs / 60000) : 0;

      const key = e.user_id;
      if (!totals.has(key)) {
        totals.set(key, { user: e.users, totalMinutes: 0 });
      }
      totals.get(key).totalMinutes += minutes;
    }

    const result = Array.from(totals.values())
      .map(({ user, totalMinutes }) => ({
        user,
        total_minutes: totalMinutes,
        total_hours: Number((totalMinutes / 60).toFixed(2))
      }))
      .sort((a, b) => b.total_minutes - a.total_minutes);

    res.json({
      week_start: start.toISOString().slice(0, 10),
      week_end: end.toISOString().slice(0, 10),
      count_users: result.length,
      data: result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// ADMIN - horas trabalhadas hoje

// ADMIN REPORT - horas da semana atual
// Horas trabalhadas na semana (usuário logado)
app.get("/my-hours-week", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // início da semana (segunda 00:00)
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const day = start.getDay(); // 0=domingo, 1=segunda...
    const diffToMonday = day === 0 ? 6 : day - 1; // domingo volta 6, senão volta (day-1)
    start.setDate(start.getDate() - diffToMonday);

    // fim da semana (segunda da próxima semana 00:00)
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
      const outTime = e.clock_out ? new Date(e.clock_out) : new Date(); // aberto conta até agora
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
});

// buscar usuários do banco 
app.get("/users", auth, isAdmin, async (req, res) => {
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
});

app.post("/users", async (req, res) => {
  try {
    const { full_name, email, password, role } = req.body;

    // criptografar senha
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
});
// buscar 1 usuário por id
app.get("/users/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.users.findUnique({
      where: { id },
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
app.put("/users/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.users.update({
  where: { id },
  data: req.body,
  select: {
    id: true,
    full_name: true,
    email: true,
    role: true,
    created_at: true,
    updated_at: true
  }
});

    res.json(user);
  } catch (error) {
    // Prisma dá erro se não achar o registro
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
    res.status(500).json({ error: error.message });
  }
});
app.delete("/users/:id", auth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.users.delete({
      where: { id }
    });

    res.json({ message: "Usuário removido com sucesso" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
    res.status(500).json({ error: error.message });
  }
});
app.post("/login", login);
// Ver minhas jornadas
app.get("/my-times", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const entries = await prisma.work_entries.findMany({
      where: { user_id: userId },
      orderBy: { clock_in: "desc" },
      select: {
        id: true,
        clock_in: true,
        clock_out: true,
        note: true,
        created_at: true,
        updated_at: true
      }
    });

    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Admin: ver todas as jornadas
app.get("/times", auth, isAdmin, async (req, res) => {
  try {
    const entries = await prisma.work_entries.findMany({
      orderBy: { clock_in: "desc" },
      select: {
        id: true,
        user_id: true,
        clock_in: true,
        clock_out: true,
        note: true,
        created_at: true,
        updated_at: true,
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

    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Admin: lista detalhada dos pontos de HOJE
app.get("/admin/entries-today", auth, isAdmin, async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const entries = await prisma.work_entries.findMany({
      where: { clock_in: { gte: start, lt: end } },
      orderBy: { clock_in: "desc" },
      select: {
        id: true,
        user_id: true,
        clock_in: true,
        clock_out: true,
        note: true,
        created_at: true,
        updated_at: true,
        users: {
          select: { id: true, full_name: true, email: true, role: true }
        }
      }
    });

    res.json({
      date: start.toISOString().slice(0, 10),
      count_entries: entries.length,
      entries
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Admin: lista detalhada por período
// Ex: /admin/entries?start=2026-03-01&end=2026-03-07
app.get("/admin/entries", auth, isAdmin, async (req, res) => {
  try {
    const { start: startStr, end: endStr } = req.query;

    if (!startStr || !endStr) {
      return res.status(400).json({
        error: "Informe os parâmetros start e end no formato YYYY-MM-DD"
      });
    }

    const start = new Date(`${startStr}T00:00:00`);
    const end = new Date(`${endStr}T00:00:00`);
    end.setDate(end.getDate() + 1); // inclui o dia end

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: "Datas inválidas" });
    }

    const entries = await prisma.work_entries.findMany({
      where: { clock_in: { gte: start, lt: end } },
      orderBy: { clock_in: "desc" },
      select: {
        id: true,
        user_id: true,
        clock_in: true,
        clock_out: true,
        note: true,
        created_at: true,
        updated_at: true,
        users: {
          select: { id: true, full_name: true, email: true, role: true }
        }
      }
    });

    res.json({
      start: startStr,
      end: endStr,
      count_entries: entries.length,
      entries
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// iniciar servidor
app.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});