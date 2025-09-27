"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const products_1 = __importDefault(require("./routes/products"));
const cashRegister_1 = __importDefault(require("./routes/cashRegister"));
const app = (0, express_1.default)();
const PORT = process.env;
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        const allowedOrigins = [
            "https://ctrolstockfront-git-caja-emarojas-projects.vercel.app",
            "http://localhost:5173"
        ];
        // permitir solicitudes sin origin (por ejemplo Postman)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = `El CORS para este origen no está permitido: ${origin}`;
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
}));
dotenv_1.default.config();
app.use(express_1.default.json());
// Rutas
app.use("/products", products_1.default);
app.use("/cashRegister", cashRegister_1.default);
console.log(process.env.MONGODB_URI);
mongoose_1.default.connect(process.env.MONGODB_URI || "")
    .then(() => console.log("MongoDB Atlas conectado"))
    .catch(err => console.error("Error MongoDB Atlas:", err));
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
