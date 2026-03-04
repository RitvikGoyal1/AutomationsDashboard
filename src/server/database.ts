import { Pool, type Pool as PgPool } from "pg";

// Connect to PostgreSQL Database
let poolInstance: PgPool | null = null;

export async function initDB(): Promise<PgPool> {
    if (poolInstance) {
        // Cached Instance
        return poolInstance;
    }

    const connectionString =
        process.env.DATABASE_URL ||
        `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

    const pool = new Pool({
        connectionString,
    });

    // Test connection
    try {
        const client = await pool.connect();
        console.log("Connected to PostgreSQL");
        client.release();
    } catch (err) {
        console.error("Failed to connect to PostgreSQL:", err);
        throw err;
    }

    // Initialize tables for users and emails
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            user_id SERIAL PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            display_name TEXT,
            last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS emails (
            email_id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(user_id),
            subject TEXT,
            sender TEXT,
            received_datetime TEXT
        );
    `);

    poolInstance = pool;
    return poolInstance;
}

// Simple user management
export interface UserAccount {
    email: string;
    displayName: string | null;
    lastLogin: Date;
}

export async function saveOrUpdateUser(email: string, displayName: string | null): Promise<void> {
    const pool = await initDB();
    await pool.query(
        `INSERT INTO users (email, display_name, last_login)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (email)
         DO UPDATE SET 
            display_name = EXCLUDED.display_name,
            last_login = CURRENT_TIMESTAMP`,
        [email, displayName]
    );
}

export async function getRecentUsers(limit = 5): Promise<UserAccount[]> {
    const pool = await initDB();
    const result = await pool.query(
        `SELECT email, display_name, last_login
         FROM users 
         ORDER BY last_login DESC
         LIMIT $1`,
        [limit]
    );
    return result.rows.map((row) => ({
        email: row.email,
        displayName: row.display_name,
        lastLogin: row.last_login,
    }));
}
