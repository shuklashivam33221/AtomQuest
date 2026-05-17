import { Client } from 'pg';

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_4gvN6HyXPshr@ep-rough-grass-apy8hjyb.c-7.us-east-1.aws.neon.tech/neondb?sslmode=verify-full",
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 30000,
  });

  try {
    console.log("Connecting to database...");
    await client.connect();
    console.log("Connected successfully!");

    const res = await client.query('SELECT current_database(), now();');
    console.log("Result:", res.rows);
  } catch (err) {
    console.error("Connection failed:", err);
  } finally {
    await client.end();
  }
}

main();
