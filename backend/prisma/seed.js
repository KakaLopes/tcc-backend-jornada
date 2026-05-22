const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function daysAgo(days, hour, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, minute, 0, 0);
  return date;
}

async function main() {
  console.log("🌱 Starting seed...");

  await prisma.adjustments.deleteMany();
  await prisma.leave_requests.deleteMany();
  await prisma.work_entries.deleteMany();
  await prisma.users.deleteMany();

  const password_hash = await bcrypt.hash("123456", 10);

  const admin = await prisma.users.create({
    data: {
      id: crypto.randomUUID(),
      full_name: "Catalina Admin",
      email: "admin@email.com",
      password_hash,
      role: "admin",
      annual_leave_days: 20,
      leave_balance: 20,
      employee_type: "full_time",
      payment_type: "bank_transfer",
      active: true,
    },
  });

  const employees = await Promise.all([
    prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        full_name: "Ana Silva",
        email: "ana@email.com",
        password_hash,
        role: "user",
        annual_leave_days: 20,
        leave_balance: 15,
        employee_type: "full_time",
        payment_type: "bank_transfer",
        active: true,
      },
    }),
    prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        full_name: "Bruno Santos",
        email: "bruno@email.com",
        password_hash,
        role: "user",
        annual_leave_days: 20,
        leave_balance: 18,
        employee_type: "part_time",
        payment_type: "bank_transfer",
        active: true,
      },
    }),
    prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        full_name: "Carla Mendes",
        email: "carla@email.com",
        password_hash,
        role: "user",
        annual_leave_days: 20,
        leave_balance: 20,
        employee_type: "temporary",
        payment_type: "cash_in_hand",
        active: true,
      },
    }),
    prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        full_name: "Diego Oliveira",
        email: "diego@email.com",
        password_hash,
        role: "user",
        annual_leave_days: 20,
        leave_balance: 12,
        employee_type: "full_time",
        payment_type: "cash_in_hand",
        active: false,
      },
    }),
    prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        full_name: "Fernanda Costa",
        email: "fernanda@email.com",
        password_hash,
        role: "admin",
        annual_leave_days: 20,
        leave_balance: 20,
        employee_type: "full_time",
        payment_type: "bank_transfer",
        active: true,
      },
    }),
  ]);

  const allUsers = [admin, ...employees];

  for (const user of allUsers) {
    if (user.role === "admin" && user.email === "admin@email.com") continue;

    await prisma.work_entries.createMany({
      data: [
        {
          id: crypto.randomUUID(),
          user_id: user.id,
          clock_in: daysAgo(0, 8, 30),
          clock_out: daysAgo(0, 16, 30),
          duration_minutes: 480,
          note: "Regular shift",
        },
        {
          id: crypto.randomUUID(),
          user_id: user.id,
          clock_in: daysAgo(1, 9, 0),
          clock_out: daysAgo(1, 15, 30),
          duration_minutes: 390,
          note: "Regular shift",
        },
        {
          id: crypto.randomUUID(),
          user_id: user.id,
          clock_in: daysAgo(2, 8, 15),
          clock_out: daysAgo(2, 14, 45),
          duration_minutes: 390,
          note: "Morning shift",
        },
      ],
    });
  }

  await prisma.leave_requests.createMany({
    data: [
      {
        id: crypto.randomUUID(),
        user_id: employees[0].id,
        leave_type: "vacation",
        start_date: new Date("2026-06-01"),
        end_date: new Date("2026-06-10"),
        reason: "Holidays",
        status: "approved",
      },
      {
        id: crypto.randomUUID(),
        user_id: employees[1].id,
        leave_type: "day_off",
        start_date: new Date("2026-04-20"),
        end_date: new Date("2026-04-20"),
        reason: "Personal appointment",
        status: "pending",
      },
      {
        id: crypto.randomUUID(),
        user_id: employees[2].id,
        leave_type: "sick_leave",
        start_date: new Date("2026-04-22"),
        end_date: new Date("2026-04-23"),
        reason: "Sick leave",
        attachment_name: "medical_certificate_sample.pdf",
        attachment_url: "https://res.cloudinary.com/demo/raw/upload/sample.pdf",
        attachment_type: "application/pdf",
        status: "pending",
      },
      {
        id: crypto.randomUUID(),
        user_id: employees[3].id,
        leave_type: "vacation",
        start_date: new Date("2026-05-05"),
        end_date: new Date("2026-05-08"),
        reason: "Family trip",
        status: "rejected",
      },
    ],
  });

  console.log("✅ Seed completed successfully!");
  console.log("Admin login:");
  console.log("Email: admin@email.com");
  console.log("Password: 123456");

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("❌ Seed error:", error);
  await prisma.$disconnect();
  process.exit(1);
});