/**
 * @module app
 * @description Configures and exports the Express application.
 *
 * Responsibilities:
 * - Serves the frontend build from `STATIC_DIR` (default
 *   `packages/frontend/dist`).
 * - Parses incoming JSON request bodies.
 * - Stores the JWT secret in `app.locals` for use by middleware and controllers.
 * - Mounts **public** routes (login, register) without authentication.
 * - Applies {@link verifyAuthToken} middleware to all `/api` routes.
 * - Mounts **protected** routes for credentials, summaries, charges, and categories.
 * - Serves the SPA `index.html` for any non-`/api`, extensionless GET.
 *
 * The app is exported without calling `listen()` so it can be used by both
 * the production server ({@link module:index}) and integration tests.
 */

import path from "path";
import express from "express";
import { ValidStaticRoutes } from "./shared/staticRoutes.share";
import { readJwtSecret, readStaticDir } from "./config";
import { mapDbErrors } from "./middleware/dbError.middleware";
import { handleErrors } from "./middleware/error.middleware";
import { verifyAuthToken } from "./middleware/auth.middleware";
import { publicAuthRouter, authRouter } from "./routes/credential.route";
import summaryRouter from "./routes/summary.route";
import categoryRouter from "./routes/category.route";
import chargeRouter from "./routes/charge.route";
import netWorthRouter from "./routes/netWorth.route";


const STATIC_DIR = readStaticDir(process.env);

const app = express();
app.use(express.static(STATIC_DIR));
app.use(express.json());

// Prime JWT SECRET for app
app.locals.JWT_SECRET = readJwtSecret(process.env);

// Public
app.use(ValidStaticRoutes.PUBLIC, publicAuthRouter);

// Protects everything after this line
app.use("/api", verifyAuthToken);
app.use(ValidStaticRoutes.AUTH, authRouter);
app.use(ValidStaticRoutes.USER, summaryRouter);
app.use(ValidStaticRoutes.CHARGE, chargeRouter);
app.use(ValidStaticRoutes.CATEGORY, categoryRouter);
app.use(ValidStaticRoutes.NETWORTH, netWorthRouter);

// SPA deep links; unknown /api paths and missing assets stay 401/404
app.get("*", (req, res, next) => {
    if (/^\/api(\/|$)/i.test(req.path) || path.extname(req.path)) {
        next();
        return;
    }
    res.sendFile("index.html", { root: STATIC_DIR });
});

app.use(mapDbErrors);
app.use(handleErrors);

export default app;
