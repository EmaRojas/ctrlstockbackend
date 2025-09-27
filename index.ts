import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import productsRouter from "./routes/products";
import cashRegisterRouter from "./routes/cashRegister";
const app = express();
const PORT = process.env;
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      "https://ctrolstockfront-git-caja-emarojas-projects.vercel.app",
      "http://localhost:5173"
    ];
    // permitir solicitudes sin origin (por ejemplo Postman)
    if (!origin) return callback(null, true); 
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `El CORS para este origen no está permitido: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  credentials: true
}));

dotenv.config();


app.use(express.json());

// Rutas
app.use("/products", productsRouter);
app.use("/cashRegister", cashRegisterRouter);

console.log(process.env.MONGODB_URI);
mongoose.connect(process.env.MONGODB_URI || "")
    .then(() => console.log("MongoDB Atlas conectado"))
    .catch(err => console.error("Error MongoDB Atlas:", err))

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
