import path from "path";
import express, { Request, Response } from "express";
import { ValidStaticRoutes } from "./shared/staticRoutes.share";
import summaryRouter from "./routes/summary.route";

const STATIC_DIR = process.env.STATIC_DIR || "public";
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.static(STATIC_DIR));
app.use(express.json());

// User stuffs...
app.use(ValidStaticRoutes.USER, summaryRouter);
app.use(ValidStaticRoutes.USERS, summaryRouter);

app.get("/hello", (_req: Request, res: Response) => {
    res.send("Hello, World");
});

// get static page
app.get(Object.values(ValidStaticRoutes), (_req: Request, res: Response) => {
    const frontendDistPath = path.join(__dirname, "../../frontend/dist");
    res.sendFile(path.join(frontendDistPath, "index.html"));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default app;

