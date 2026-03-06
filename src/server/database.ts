import { Pool } from "pg";

// connect to postgres
let poolInstance: Pool | null = null;

function getConnectionString(): string {
    if (process.env.DATABASE_URL) {
        return process.env.DATABASE_URL;
    }

    throw new Error("Database missing");
}

export async function initDB(): Promise<Pool> {
    if (poolInstance) {
        return poolInstance;
    }

    poolInstance = new Pool({
        connectionString: getConnectionString(),
    });

    // create tables if needed
    await poolInstance.query(`
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

    return poolInstance;
}

// user data structure
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

// save email to db
export async function saveEmail(
    emailId: string,
    userEmail: string,
    subject: string,
    sender: string,
    receivedDatetime: string
): Promise<void> {
    const pool = await initDB();
    const result = await pool.query(
        `INSERT INTO emails (email_id, user_id, subject, sender, received_datetime)
         SELECT $1, u.user_id, $3, $4, $5
         FROM users u
         WHERE u.email = $2
         ON CONFLICT (email_id) DO UPDATE SET
            subject = EXCLUDED.subject,
            sender = EXCLUDED.sender,
            received_datetime = EXCLUDED.received_datetime`,
        [emailId, userEmail, subject, sender, receivedDatetime]
    );

    if (result.rowCount === 0) {
        console.log(`User ${userEmail} not found, skipping email save`);
    }
}

// get user's emails from db
export async function getEmailsForUser(userEmail: string): Promise<
    Array<{
        email_id: string;
        subject: string;
        sender: string;
        received_datetime: string;
    }>
> {
    const pool = await initDB();
    const result = await pool.query(
        `SELECT e.email_id, e.subject, e.sender, e.received_datetime
         FROM emails e
         JOIN users u ON e.user_id = u.user_id
         WHERE u.email = $1
         ORDER BY e.received_datetime DESC`,
        [userEmail]
    );
    return result.rows;
}
