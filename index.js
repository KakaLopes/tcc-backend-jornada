
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();
function calcDurationMinutes(clockIn, clockOut) {
  if (!clockIn || !clockOut) return null;

  const start = new Date(clockIn);
  const end = new Date(clockOut);

  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) return 0;

  return Math.floor(diffMs / 60000); // minutos inteiros
}
app.use(cors());
app.use(express.json());
function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Token não informado" });
  }

  const [type, token] = authHeader.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({ error: "Formato inválido. Use: Bearer TOKEN" });
  }

 try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = decoded; // { id, email, role }
  next();
} catch (err) {
  return res.status(401).json({ error: "Token inválido ou expirado" });
}
}
function isAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Acesso negado (apenas admin)" });
  }
  next();
}
// CLOCK-IN (registrar entrada)
app.post("/clock-in", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { note } = req.body;

    // impedir abrir outra jornada sem fechar a anterior
    const openEntry = await prisma.work_entries.findFirst({
      where: { user_id: userId, clock_out: null },
      orderBy: { clock_in: "desc" }
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

    return res.json({ message: "Clock-in realizado com sucesso", entry });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
// CLOCK-OUT (registrar saída)
app.post("/clock-out", auth, async (req, res) => {
  try {
    // segurança extra: garantir que auth setou o user
    if (!req.user?.id) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const userId = req.user.id;
    const note = req.body?.note;

    // procurar jornada aberta (sem clock_out)
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

    // monta updateData: só atualiza note se veio note no body
  const now = new Date();

// calcula duração em minutos
const durationMs = now.getTime() - new Date(openEntry.clock_in).getTime();
const durationMinutes = Math.max(0, Math.floor(durationMs / 60000));

// dados que serão atualizados
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
});
// rota teste
app.get("/", (req, res) => {
  res.send("Servidor do TCC está funcionando!");
});
// solicitar ajuste de ponto
app.post("/adjustments/request", auth, async (req, res) => {
  try {
    const { work_entry_id, old_value, new_value, reason } = req.body;

    // validações básicas
    if (!work_entry_id) {
      return res.status(400).json({ error: "work_entry_id é obrigatório" });
    }

    if (!new_value) {
      return res.status(400).json({ error: "new_value é obrigatório" });
    }

    if (!reason || String(reason).trim() === "") {
      return res.status(400).json({ error: "reason é obrigatório" });
    }

    const parsedNewValue = new Date(new_value);

    if (isNaN(parsedNewValue.getTime())) {
      return res.status(400).json({ error: "new_value inválido" });
    }

    // validação: precisa existir
    const entry = await prisma.work_entries.findUnique({
      where: { id: work_entry_id }
    });

    if (!entry) {
      return res.status(400).json({ error: "work_entry_id inválido (ponto não existe)" });
    }

    // validação: o ponto tem que ser do usuário logado
    if (entry.user_id !== req.user.id) {
      return res.status(403).json({ error: "Você não pode pedir ajuste de outro usuário" });
    }

    // validação: se já existe clock_out, new_value não pode ser depois dele
    if (entry.clock_out && parsedNewValue > new Date(entry.clock_out)) {
      return res.status(400).json({
        error: "new_value não pode ser maior que o clock_out"
      });
    }

    const adjustment = await prisma.adjustments.create({
      data: {
        id: crypto.randomUUID(),
        work_entry_id,
        old_value,
        new_value,
        reason
      }
    });

    return res.json({
      message: "Solicitação de ajuste enviada",
      adjustment
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
// ADMIN REPORT - ranking de funcionários por horas trabalhadas
app.get("/admin/reports/top-workers", auth, isAdmin, async (req, res) => {
  try {
    const entries = await prisma.work_entries.findMany({
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

    const grouped = {};

    for (const entry of entries) {
      const userId = entry.user_id;

      if (!grouped[userId]) {
        grouped[userId] = {
          user_id: entry.users.id,
          full_name: entry.users.full_name,
          email: entry.users.email,
          role: entry.users.role,
          total_entries: 0,
          total_minutes: 0
        };
      }

      grouped[userId].total_entries += 1;
      grouped[userId].total_minutes += entry.duration_minutes || 0;
    }

    const result = Object.values(grouped)
      .map(user => ({
        ...user,
        total_hours: Number((user.total_minutes / 60).toFixed(2))
      }))
      .sort((a, b) => b.total_minutes - a.total_minutes);

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
// ADMIN REPORT - horas de um usuário por período
app.get("/admin/reports/user-hours-range", auth, isAdmin, async (req, res) => {
  try {
    const { user_id, start, end } = req.query;

    if (!user_id || !start || !end) {
      return res.status(400).json({
        error: "user_id, start e end são obrigatórios"
      });
    }

    const startDate = new Date(`${start}T00:00:00.000Z`);
    const endDate = new Date(`${end}T23:59:59.999Z`);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ error: "Datas inválidas" });
    }

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
      },
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
});
// admin aprovar ajuste
app.post("/admin/adjustments/:id/approve", auth, isAdmin, async (req, res) => {
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

    // atualiza o ponto (exemplo: atualizar clock_in)
  // 1) buscar o ponto atual
const entry = await prisma.work_entries.findUnique({
  where: { id: adjustment.work_entry_id }
});

if (!entry) {
  return res.status(404).json({ error: "Ponto não encontrado" });
}

// 2) novo clock_in vindo do ajuste
const newClockIn = new Date(adjustment.new_value);

// 3) recalcular duração se existir clock_out
let durationMinutes = entry.duration_minutes;

if (entry.clock_out) {
  const durationMs = new Date(entry.clock_out).getTime() - newClockIn.getTime();
  durationMinutes = Math.max(0, Math.floor(durationMs / 60000));
}

// 4) atualizar o ponto
// atualizar ponto
const updatedEntry = await prisma.work_entries.update({
  where: { id: adjustment.work_entry_id },
  data: {
    clock_in: newClockIn,
    duration_minutes: durationMinutes
  }
});

    // marca ajuste como aprovado
    const approved = await prisma.adjustments.update({
      where: { id },
      data: {
        approved_by: req.user.id,
        approved_at: new Date()
      }
    });

    // audit log 
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
app.post("/admin/adjustments/:id/reject", auth, isAdmin, async (req, res) => {
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

    return res.json({ message: "Ajuste rejeitado", adjustment: rejected });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
// ADMIN - listar ajustes pendentes
app.get("/admin/adjustments", auth, isAdmin, async (req, res) => {
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
// 👤 Perfil do usuário logado
app.get("/me", auth, async (req, res) => {
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
app.get("/admin/reports/hours-today", auth, isAdmin, async (req, res) => {
  try {

    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);

    const endOfDay = new Date();
    endOfDay.setHours(23,59,59,999);

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
        duration_minutes =
          Math.floor(
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

    res.json(result);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// ADMIN REPORT - horas da semana atual
app.get("/admin/reports/hours-week", auth, isAdmin, async (req, res) => {
  try {
    // início da semana (segunda-feira 00:00:00)
    const now = new Date();
    const day = now.getDay(); // 0=domingo, 1=segunda...
    const diffToMonday = day === 0 ? 6 : day - 1;

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    // fim da semana (domingo 23:59:59.999)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const entries = await prisma.work_entries.findMany({
      where: {
        clock_in: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
      },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        clock_in: "desc",
      },
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
        note: e.note,
      };
    });

    res.json({
      week_start: startOfWeek,
      week_end: endOfWeek,
      total_entries: result.length,
      entries: result,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// ADMIN REPORT - horas por período (start/end) e filtro opcional por user_id
app.get("/admin/reports/hours-range", auth, isAdmin, async (req, res) => {
  try {
    const { start, end, user_id } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        error: "Parâmetros obrigatórios: start e end (formato YYYY-MM-DD)",
      });
    }

    const startDate = new Date(`${start}T00:00:00.000Z`);
    const endDate = new Date(`${end}T23:59:59.999Z`);

    const where = {
      clock_in: { gte: startDate, lte: endDate },
      clock_out: { not: null },
      ...(user_id ? { user_id: String(user_id) } : {}),
    };

    const entries = await prisma.work_entries.findMany({
      where,
      include: {
        users: { select: { id: true, full_name: true, email: true, role: true } },
      },
      orderBy: { clock_in: "desc" },
    });

    const result = entries.map((e) => {
      const durationMinutes = Math.max(
        0,
        Math.round((new Date(e.clock_out).getTime() - new Date(e.clock_in).getTime()) / 60000)
      );

      return {
        entry_id: e.id,
        user: e.users,
        clock_in: e.clock_in,
        clock_out: e.clock_out,
        duration_minutes: durationMinutes,
        duration_hours: Number((durationMinutes / 60).toFixed(2)),
        note: e.note,
      };
    });

    return res.json({
      start,
      end,
      filter_user_id: user_id ?? null,
      total_entries: result.length,
      total_minutes: result.reduce((acc, r) => acc + r.duration_minutes, 0),
      total_hours: Number((result.reduce((acc, r) => acc + r.duration_minutes, 0) / 60).toFixed(2)),
      entries: result,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
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
// Histórico de jornadas do usuário logado
app.get("/my-entries", auth, async (req, res) => {
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
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.users.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

   const passwordMatch = await bcrypt.compare(password, user.password_hash);

if (!passwordMatch) {
  return res.status(401).json({ error: "Senha incorreta" });
}
const token = jwt.sign(
  { id: user.id, email: user.email, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: "1h" }
);
    res.json({
  message: "Login realizado com sucesso",
  token, 
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