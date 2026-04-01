const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const DEFAULT_ANNUAL_LEAVE_DAYS = 20;

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
    // Conta apenas pedidos aprovados do mesmo ano
    const requestYear = startDate.getFullYear();

    const approvedLeaves = await prisma.leave_requests.findMany({
      where: {
        user_id: userId,
        status: "approved",
        start_date: {
          gte: new Date(`${requestYear}-01-01T00:00:00.000Z`),
          lte: new Date(`${requestYear}-12-31T23:59:59.999Z`),
        },
      },
      select: {
        start_date: true,
        end_date: true,
      },
    });

    const usedDays = approvedLeaves.reduce((total, leave) => {
      const leaveStart = new Date(leave.start_date);
      const leaveEnd = new Date(leave.end_date);
      return total + calculateDaysInclusive(leaveStart, leaveEnd);
    }, 0);

    const requestedDays = calculateDaysInclusive(startDate, endDate);
    const availableDays = DEFAULT_ANNUAL_LEAVE_DAYS - usedDays;

    if (requestedDays > availableDays) {
      return res.status(400).json({
        error: `Dias insuficientes. Disponível: ${availableDays}, solicitado: ${requestedDays}`,
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
      available_days_before_request: availableDays,
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

    const updated = await prisma.leave_requests.update({
      where: { id },
      data: { status },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  requestLeave,
  getMyLeaves,
  getAllLeaves,
  updateLeaveStatus,
};