import { neon } from '@neondatabase/serverless';

async function main() {
  const url = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_4gvN6HyXPshr@ep-rough-grass-apy8hjyb.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require";
  const sql = neon(url);
  
  console.log("Pinging Neon over HTTP (port 443)...");
  
  try {
    // Ping 1 to wake it up
    const res1 = await sql`SELECT 1 as "wake_up"`;
    console.log("Ping 1 success:", res1);
  } catch (err) {
    console.log("Ping 1 failed (expected if cold start timeout):", err.message);
  }
  
  try {
    // Ping 2 should definitely succeed if it's awake
    const res2 = await sql`SELECT current_database(), now();`;
    console.log("Ping 2 success:", res2);
  } catch (err) {
    console.error("Ping 2 failed (Network is dropping port 443 too!):", err.message);
  }
}

main();
