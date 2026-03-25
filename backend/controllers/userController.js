async function createUser(req, res) {
  try {
    const { full_name, email, password, role, phone, address } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({
        error: "full_name, email e password são obrigatórios"
      });
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
        address: address || null
      }
    });

    res.json({
      message: "Usuário criado com sucesso",
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address
      }
    });

  } catch (error) {
    console.log("CREATE USER ERROR:", error);

    res.status(500).json({ error: error.message });
  }
}