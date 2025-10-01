"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server.ts
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const products_1 = __importDefault(require("./routes/products"));
const cashRegister_1 = __importDefault(require("./routes/cashRegister"));
dotenv_1.default.config();
const app = (0, express_1.default)();
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
    if (req.method === "OPTIONS")
        return res.sendStatus(200);
    next();
});
const PORT = process.env.PORT || 3000;
app.use(express_1.default.json());
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
// Rutas
app.use("/products", products_1.default);
app.use("/cashRegister", cashRegister_1.default);
// Conexión a MongoDB
const mongoUri = process.env.MONGODB_URI || "";
mongoose_1.default.connect(mongoUri)
    .then(() => console.log("MongoDB Atlas conectado"))
    .catch(err => console.error("Error MongoDB Atlas:", err));
exports.default = app;
