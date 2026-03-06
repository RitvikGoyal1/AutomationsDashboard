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

// Save email to database (linked to user)
export async function saveEmail(
    emailId: string,
    userEmail: string,
    subject: string,
    sender: string,
    receivedDatetime: string
): Promise<void> {
    const pool = await initDB();
    try {
        // Get user_id from email address
        const userResult = await pool.query("SELECT user_id FROM users WHERE email = $1", [
            userEmail,
        ]);
        if (userResult.rows.length === 0) {
            console.log(`User ${userEmail} not found, skipping email save`);
            return;
        }
        const userId = userResult.rows[0].user_id;

        // Insert or update email
        await pool.query(
            `INSERT INTO emails (email_id, user_id, subject, sender, received_datetime)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (email_id) DO UPDATE SET
                subject = EXCLUDED.subject,
                sender = EXCLUDED.sender,
                received_datetime = EXCLUDED.received_datetime`,
            [emailId, userId, subject, sender, receivedDatetime]
        );
    } catch (error) {
        console.error("Error saving email:", error);
    }
}

// Get emails from database for a specific user
export async function getEmailsForUser(userEmail: string): Promise<
    Array<{
        email_id: string;
        subject: string;
        sender: string;
        received_datetime: string;
    }>
> {
    const pool = await initDB();
    try {
        const result = await pool.query(
            `SELECT e.email_id, e.subject, e.sender, e.received_datetime
             FROM emails e
             JOIN users u ON e.user_id = u.user_id
             WHERE u.email = $1
             ORDER BY e.received_datetime DESC`,
            [userEmail]
        );
        return result.rows;
    } catch (error) {
        console.error("Error fetching emails for user:", error);
        return [];
    }
}
