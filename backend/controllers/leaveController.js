const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

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

    const leave = await prisma.leave_requests.create({
      data: {
        user_id: userId,
        leave_type,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        reason: reason || null,
      },
    });

    return res.json({
      message: "Leave request submitted",
      leave,
    });
  } catch (error) {
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