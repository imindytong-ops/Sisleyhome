import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

const TEST_ACCOUNTS = [
  { name: "采购小王", email: "purchasing@sisleyhome.test", role: "PURCHASING" },
  { name: "仓库小李", email: "warehouse@sisleyhome.test", role: "WAREHOUSE" },
  { name: "财务小张", email: "finance@sisleyhome.test", role: "FINANCE" },
  { name: "系统管理员", email: "admin@sisleyhome.test", role: "ADMIN" },
];

const TEST_PASSWORD = "sisley123";

async function main() {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

  for (const account of TEST_ACCOUNTS) {
    await prisma.user.upsert({
      where: { email: account.email },
      update: {},
      create: {
        name: account.name,
        email: account.email,
        role: account.role,
        passwordHash,
      },
    });
  }

  console.log("测试账号已创建，密码统一为:", TEST_PASSWORD);
  TEST_ACCOUNTS.forEach((a) => console.log(`  ${a.role}: ${a.email}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
