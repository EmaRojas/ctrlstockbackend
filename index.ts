// server.ts
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

import productsRouter from "./routes/products";
import cashRegisterRouter from "./routes/cashRegister";

dotenv.config();

const app = express();

// --- CORS manual ---
app.use((req, res, next) => {
  const allowedOrigins = [
    "https://ctrolstockfront-git-caja-emarojas-projects.vercel.app",
    "http://localhost:5173"
  ];
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Rutas
app.use("/products", productsRouter);
app.use("/cashRegister", cashRegisterRouter);

// Conexión a MongoDB
const mongoUri = process.env.MONGODB_URI || "";
mongoose.connect(mongoUri)
  .then(() => console.log("MongoDB Atlas conectado"))
  .catch(err => console.error("Error MongoDB Atlas:", err));

export default app;
