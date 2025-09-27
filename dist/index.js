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
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env;
const allowedOrigins = [
    "https://ctrolstockfront-git-caja-emarojas-projects.vercel.app",
    "http://localhost:5173"
];
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));
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
