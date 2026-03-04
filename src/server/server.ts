import express, { type Request, type Response } from "express";
import { initDB, saveOrUpdateUser, getRecentUsers } from "./database.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3001;
app.use(express.json());

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname)));

// Enable CORS for local development
app.use((req: Request, res: Response, next) => {
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});

app.get("/health", async (_req: Request, res: Response) => {
    await initDB();
    res.jsonp({ ok: true });
});

// Save user on login
app.post("/api/user", async (req: Request, res: Response) => {
    try {
        const { email, displayName } = req.body;
        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }
        await saveOrUpdateUser(email, displayName || null);
        res.json({ success: true });
    } catch (error) {
        console.error("Save user error:", error);
        res.status(500).json({ error: "Failed to save user" });
    }
});

// Get recently logged in users
app.get("/api/users/recent", async (_req: Request, res: Response) => {
    try {
        const users = await getRecentUsers(5);
        res.json({ users });
    } catch (error) {
        console.error("Get users error:", error);
        res.status(500).json({ error: "Failed to get users" });
    }
});

// Serve index.html for all other routes (client-side routing)
app.get("*", (_req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, () => {
    console.log(`Server is at http://localhost:${port}`);
});
