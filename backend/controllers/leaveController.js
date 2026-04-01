const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function startOfDay(dateString) {
  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(dateString) {
  const date = new Date(dateString);
  date.setHours(23, 59, 59, 999);
  return date;
}

function calculateDaysInclusive(startDate, endDate) {
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

// Criar pedido
async function requestLeave(req, res) {
  try {
    const userId = req.user.id;
    const { leave_type, start_date, end_date, reason } = req.body;

    if (!leave_type || !start_date || !end_date) {
      return res.status(400).json({
        error: "leave_type, start_date e end_date são obrigatórios",
      });
    }

    const startDate = startOfDay(start_date);
    const endDate = endOfDay(end_date);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        error: "Datas inválidas. Use o formato YYYY-MM-DD",
      });
    }

    if (startDate > endDate) {
      return res.status(400).json({
        error: "A data final não pode ser anterior à data inicial",
      });
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        annual_leave_days: true,
        leave_balance: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const annualLeave = user.annual_leave_days ?? 20;
    const currentBalance = user.leave_balance ?? annualLeave;

    // 1) BLOQUEAR DATAS SOBREPOSTAS
    const overlappingLeave = await prisma.leave_requests.findFirst({
      where: {
        user_id: userId,
        status: {
          in: ["pending", "approved"],
        },
        AND: [
          {
            start_date: {
              lte: endDate,
            },
          },
          {
            end_date: {
              gte: startDate,
            },
          },
        ],
      },
    });

    if (overlappingLeave) {
      return res.status(400).json({
        error: "Já existe um pedido de leave que se sobrepõe a essas datas",
      });
    }

    // 2) VALIDAR DIAS DISPONÍVEIS
    const requestedDays = calculateDaysInclusive(startDate, endDate);

    if (requestedDays > currentBalance) {
      return res.status(400).json({
        error: `Dias insuficientes. Disponível: ${currentBalance}, solicitado: ${requestedDays}`,
      });
    }

    const leave = await prisma.leave_requests.create({
      data: {
        user_id: userId,
        leave_type,
        start_date: startDate,
        end_date: endDate,
        reason: reason || null,
      },
    });

    return res.json({
      message: "Leave request submitted",
      leave,
      requested_days: requestedDays,
      available_days_before_request: currentBalance,
    });
  } catch (error) {
    console.log("REQUEST LEAVE ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
}

// Ver meus pedidos
async function getMyLeaves(req, res) {
  try {
    const userId = req.user.id;

    const leaves = await prisma.leave_requests.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
    });

    return res.json(leaves);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// Admin - ver todos
async function getAllLeaves(req, res) {
  try {
    const leaves = await prisma.leave_requests.findMany({
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
            annual_leave_days: true,
            leave_balance: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return res.json(leaves);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// Admin - aprovar/rejeitar
async function updateLeaveStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "status é obrigatório" });
    }

    if (!["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({
        error: "status inválido. Use approved, rejected ou pending",
      });
    }

    const leave = await prisma.leave_requests.findUnique({
      where: { id },
    });

    if (!leave) {
      return res.status(404).json({ error: "Leave não encontrado" });
    }

    // Evita descontar saldo de novo se já estiver aprovado
    if (leave.status !== "approved" && status === "approved") {
      const start = new Date(leave.start_date);
      const end = new Date(leave.end_date);
      const days = calculateDaysInclusive(start, end);

      const user = await prisma.users.findUnique({
        where: { id: leave.user_id },
        select: {
          annual_leave_days: true,
          leave_balance: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      const currentBalance = user.leave_balance ?? user.annual_leave_days ?? 20;

      if (days > currentBalance) {
        return res.status(400).json({
          error: "Saldo insuficiente",
        });
      }

      await prisma.users.update({
        where: { id: leave.user_id },
        data: {
          leave_balance: currentBalance - days,
        },
      });
    }

    const updated = await prisma.leave_requests.update({
      where: { id },
      data: { status },
    });

    return res.json(updated);
  } catch (error) {
    console.log("UPDATE LEAVE ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  requestLeave,
  getMyLeaves,
  getAllLeaves,
  updateLeaveStatus,
};