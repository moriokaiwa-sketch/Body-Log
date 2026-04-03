"use server";

import { Pool } from "@neondatabase/serverless";
import { revalidatePath } from "next/cache";

export interface BodyLogEntry {
  id: string;
  date: string;
  weight: number;
  bodyFat: number;
  muscleMass: number;
}

const getPool = () => {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    if (process.env.NODE_ENV === "development") {
      // Local development fallback log
      console.log("No database URL provided in development.");
      return null;
    }
    throw new Error("Missing database connection string. Make sure DATABASE_URL is set in Vercel.");
  }
  return new Pool({ connectionString });
};

async function initDb(pool: Pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bodylog_entries (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      date DATE NOT NULL UNIQUE,
      weight NUMERIC(5, 2) NOT NULL,
      body_fat NUMERIC(5, 2) NOT NULL,
      muscle_mass NUMERIC(5, 2) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export async function getEntriesAction(): Promise<BodyLogEntry[]> {
  try {
    const pool = getPool();
    if (!pool) return []; // Fallback for local testing without DB setup

    await initDb(pool);
    const { rows } = await pool.query(
      "SELECT id, TO_CHAR(date, 'YYYY-MM-DD') as date, weight, body_fat, muscle_mass FROM bodylog_entries ORDER BY date DESC"
    );
    
    return rows.map((r: any) => ({
      id: r.id,
      date: r.date,
      weight: Number(r.weight),
      bodyFat: Number(r.body_fat),
      muscleMass: Number(r.muscle_mass)
    }));
  } catch (error) {
    console.error("Database Error:", error);
    if (process.env.NODE_ENV === "development") {
      return [];
    }
    throw new Error("Failed to fetch data from database.");
  }
}

export async function addEntryAction(entry: { date: string; weight: number; bodyFat: number; muscleMass: number }) {
  const pool = getPool();
  if (!pool) return;
  
  await pool.query(
    `INSERT INTO bodylog_entries (date, weight, body_fat, muscle_mass) 
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (date) 
     DO UPDATE SET weight = EXCLUDED.weight, body_fat = EXCLUDED.body_fat, muscle_mass = EXCLUDED.muscle_mass`,
    [entry.date, entry.weight, entry.bodyFat, entry.muscleMass]
  );
  revalidatePath("/");
}

export async function deleteEntryAction(id: string) {
  const pool = getPool();
  if (!pool) return;

  await pool.query("DELETE FROM bodylog_entries WHERE id = $1", [id]);
  revalidatePath("/");
}
