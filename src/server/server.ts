import express from "express";
import {initDB} from "./database.js";

const app= express();
const port = process.env.PORT ? Number(process.env.PORT):3001;
app.use(express.json());

app.get("/health", async (_req, res)=>{
	await initDB();
	res.jsonp({ok:true});
});

app.listen(port,()=>{
	console.log(`Server is at http://localhost:${port}`);
})