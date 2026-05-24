import postgres from "postgres";

let cached: boolean | null = null;

export async function isDatabaseAvailable(): Promise<boolean> {
  if (cached !== null) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) {
    cached = false;
    return false;
  }
  try {
    const sql = postgres(url, { max: 1, connect_timeout: 5 });
    await sql`SELECT 1`;
    await sql.end({ timeout: 5 });
    cached = true;
  } catch {
    cached = false;
  }
  return cached;
}
