const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function requestAdjustment(req, res) {
  try {
    const { work_entry_id, old_value, new_value, reason } = req.body;

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

    const entry = await prisma.work_entries.findUnique({
      where: { id: work_entry_id }
    });

    if (!entry) {
      return res.status(400).json({ error: "work_entry_id inválido (ponto não existe)" });
    }

    if (entry.user_id !== req.user.id) {
      return res.status(403).json({ error: "Você não pode pedir ajuste de outro usuário" });
    }

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
}

module.exports = {
  requestAdjustment
};