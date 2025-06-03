import path from "path";
import express, { Request, Response } from "express";
import { ValidStaticRoutes } from "./shared/staticRoutes.share";
import { verifyAuthToken } from "./middleware/auth.middleware";
import credentialRouter from "./routes/credential.route";
import summaryRouter from "./routes/summary.route";
import categoryRouter from "./routes/category.route";
import chargeRouter from "./routes/charge.route";


const PORT = process.env.PORT || 3000;
const STATIC_DIR = process.env.STATIC_DIR || "public";

const app = express();
app.use(express.static(STATIC_DIR));
app.use(express.json());

// Prime JWT SECRET for app
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) throw new Error("Error: Missing JWT_SECRET in .env");
app.locals.JWT_SECRET = jwtSecret;

// Public
app.use(ValidStaticRoutes.PUBLIC, credentialRouter);

// Protects everything after this line
app.use("/api", verifyAuthToken);
app.use(ValidStaticRoutes.AUTH, credentialRouter);
app.use(ValidStaticRoutes.USER, summaryRouter);
app.use(ValidStaticRoutes.CHARGE, chargeRouter);
app.use(ValidStaticRoutes.CATEGORY, categoryRouter);


// get static page
app.get(Object.values(ValidStaticRoutes), (_req: Request, res: Response) => {
    const frontendDistPath = path.join(__dirname, "../../frontend/dist");
    res.sendFile(path.join(frontendDistPath, "index.html"));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default app;

