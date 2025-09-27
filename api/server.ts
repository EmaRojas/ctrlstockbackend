import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import productsRouter from "./routes/products";
import cashRegisterRouter from "./routes/cashRegister";

dotenv.config();
const app = express();
const PORT = process.env;

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use("/products", productsRouter);
app.use("/cashRegister", cashRegisterRouter);

console.log(process.env.MONGODB_URI);
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("MongoDB Atlas conectado"))
    .catch(err => console.error("Error MongoDB Atlas:", err))

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
