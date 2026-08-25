import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set in the environment");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(`Connecting to database at: ${connectionString.split('@')[1]}`);
  
  const users = await prisma.user.findMany();
  console.log("\n--- Users ---");
  console.log(users.length > 0 ? users : "No users found.");

  const sessions = await prisma.session.findMany();
  console.log("\n--- Sessions ---");
  console.log(sessions.length > 0 ? sessions : "No sessions found.");
}

main()
  .catch((e) => {
    console.error("\nError querying the database:");
    console.error(e.message);
  })
  .finally(async () => {
    await prisma.$disconnect();
    // End the pg pool so the process can exit
    await pool.end();
  });
