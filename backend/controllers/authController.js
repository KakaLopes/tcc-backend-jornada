const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    const user = await prisma.users.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        error: "Invalid password",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        error: "JWT secret is not configured",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        annual_leave_days: user.annual_leave_days,
        leave_balance:
          user.leave_balance != null
            ? user.leave_balance
            : user.annual_leave_days ?? 20,
        employee_type: user.employee_type,
        payment_type: user.payment_type,
        active: user.active,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    });
  } catch (error) {
    console.log("LOGIN ERROR:", error);

    if (
      error.message?.includes("Server has closed the connection") ||
      error.message?.includes("Can't reach database server") ||
      error.message?.includes("Connection")
    ) {
      return res.status(503).json({
        error: "Database connection unavailable. Please try again.",
      });
    }

    return res.status(500).json({
      error: "Unable to login. Please try again.",
    });
  }
}

module.exports = {
  login,
};