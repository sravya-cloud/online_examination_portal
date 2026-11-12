import "dotenv/config";
import bcrypt from "bcryptjs";
import { getPrisma } from "../src/db.js";

const password = process.env.SEED_PASSWORD;
if (!password || password.length < 8) {
  console.error("Set SEED_PASSWORD (at least 8 characters) before seeding.");
  process.exit(1);
}

const accounts = [
  { email: "student@example.com", name: "Demo Student", role: "STUDENT" },
  { email: "teacher@example.com", name: "Demo Teacher", role: "TEACHER" },
  { email: "admin@example.com", name: "Demo Admin", role: "ADMIN" },
];

const prisma = getPrisma();
const passwordHash = await bcrypt.hash(password, 10);

for (const account of accounts) {
  await prisma.user.upsert({
    where: { email: account.email },
    update: { passwordHash, name: account.name, role: account.role, isActive: true },
    create: { ...account, passwordHash },
  });
}

console.log(`Seeded ${accounts.length} demo accounts.`);
await prisma.$disconnect();
