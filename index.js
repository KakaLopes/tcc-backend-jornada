const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");

const { login } = require("./controllers/authController");
const { auth, isAdmin } = require("./middlewares/auth");
const errorHandler = require("./middlewares/errorHandler");

const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const reportRoutes = require("./routes/reportRoutes");

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// rotas organizadas
app.use("/admin/reports", reportRoutes);
app.use("/admin", adminRoutes);
app.use("/", userRoutes);

// rota teste
app.get("/", (req, res) => {
  res.send("Servidor do TCC está funcionando!");
});

// login
app.post("/login", login);

// usuários
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
app.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});