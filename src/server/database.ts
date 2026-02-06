import path from "path";
import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";
import { open, type Database } from "sqlite";

let dbInstance: Database<sqlite3.Database, sqlite3.Statement> | null = null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initDB(): Promise<Database<sqlite3.Database, sqlite3.Statement>> {
    if (dbInstance) {
        return dbInstance;
    }
    const dbPath = path.join(__dirname, "app.db");
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database,
    });

    await db.exec(`
        PRAGMA foreign_keys=ON;
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            display_name TEXT
        );
        CREATE TABLE IF NOT EXISTS emails(
            email_id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            subject TEXT,
            sender TEXT,
            received_datetime TEXT)
    `);
    dbInstance = db;
    return dbInstance;
}