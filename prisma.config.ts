import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  // point to the Prisma schema file
  schema: "prisma/schema.prisma",
  // migrations directory (optional)
  migrations: {
    path: "prisma/migrations",
  },
  // Provide the datasource URL from .env
  datasource: {
    url: env("DATABASE_URL"),
  },
});
