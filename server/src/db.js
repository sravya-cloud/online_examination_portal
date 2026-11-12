import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

let client;

// Created on first use so tests and `node --check` never need a database.
export function getPrisma() {
  if (!client) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }
    client = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  }
  return client;
}
