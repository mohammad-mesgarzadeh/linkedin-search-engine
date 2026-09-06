import "dotenv/config";
import cors from "cors";
import express, { ErrorRequestHandler } from "express";
import { profileRouter } from "./routes/profile.routes";

const app = express();
app.use(cors({ origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173" }));
app.use(express.json());
app.get("/health", (_request, response) => response.json({ status: "ok" }));
app.use("/api", profileRouter);
const errorHandler: ErrorRequestHandler = (_error, _request, response, _next) => {
  response.status(500).json({ message: "Internal server error" });
};
app.use(errorHandler);

const port = Number(process.env.PORT ?? 4000);
if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
}

export default app;
