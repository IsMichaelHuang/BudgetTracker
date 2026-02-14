/**
 * @module app
 * @description Configures and exports the Express application.
 *
 * Responsibilities:
 * - Serves the frontend static build from the configured `STATIC_DIR`.
 * - Parses incoming JSON request bodies.
 * - Stores the JWT secret in `app.locals` for use by middleware and controllers.
 * - Mounts **public** routes (login, register) without authentication.
 * - Applies {@link verifyAuthToken} middleware to all `/api` routes.
 * - Mounts **protected** routes for credentials, summaries, charges, and categories.
 * - Serves the React SPA `index.html` as a catch-all for client-side routing.
 *
 * The app is exported without calling `listen()` so it can be used by both
 * the production server ({@link module:index}) and integration tests.
 */

import path from "path";
import express, { Request, Response } from "express";
import { ValidStaticRoutes } from "./shared/staticRoutes.share";
import { verifyAuthToken } from "./middleware/auth.middleware";
import credentialRouter from "./routes/credential.route";
import summaryRouter from "./routes/summary.route";
import categoryRouter from "./routes/category.route";
import chargeRouter from "./routes/charge.route";
import netWorthRouter from "./routes/netWorth.route";


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
app.use(ValidStaticRoutes.NETWORTH, netWorthRouter);


// get static page
app.get(Object.values(ValidStaticRoutes), (_req: Request, res: Response) => {
    const frontendDistPath = path.join(__dirname, "../../frontend/dist");
    res.sendFile(path.join(frontendDistPath, "index.html"));
});

export default app;
