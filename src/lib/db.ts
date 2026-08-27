import { sql } from "@vercel/postgres";

export const isDbConfigured = Boolean(process.env.POSTGRES_URL);

export { sql };
