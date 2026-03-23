require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

const { login } = require("./controllers/authController");
const { auth, isAdmin } = require("./middlewares/auth");
const errorHandler = require("./middlewares/errorHandler");

const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const reportRoutes = require("./routes/reportRoutes");

const app = express();
const prisma = new PrismaClient();
console.log("🔥 SERVER STARTING...");
app.use(cors());
app.use(express.json());

// rota teste
app.get("/", (req, res) => {
  console.log("🔥 ROOT HIT");
  res.status(200).send("Servidor do TCC está funcionando!");
});

// rotas organizadas
app.use("/admin/reports", reportRoutes);
app.use("/admin", adminRoutes);
app.use("/", userRoutes);

// login
app.post("/login", login);

// usuários
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

// jornadas extras
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

// middleware global de erro
app.use(errorHandler);

// iniciar servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});