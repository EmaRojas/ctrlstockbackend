"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const CashRegister_1 = require("../models/CashRegister");
const Transaction_1 = require("../models/Transaction");
const Products_1 = require("../models/Products");
const router = (0, express_1.Router)();
// 🟢 Abrir caja
router.post("/open", async (req, res) => {
    const { initialAmount, openedBy } = req.body;
    const active = await CashRegister_1.CashRegister.findOne({ status: "abierta" });
    if (active)
        return res.status(400).json({ message: "Ya hay una caja abierta" });
    const cash = new CashRegister_1.CashRegister({ initialAmount, openedBy });
    await cash.save();
    res.status(201).json(cash);
});
// 📊 Obtener caja activa
router.get("/active", async (_req, res) => {
    var _a;
    try {
        // 1) Buscar caja abierta
        const cash = await CashRegister_1.CashRegister.findOne({ status: "abierta" }).exec();
        if (!cash)
            return res.status(404).json({ message: "No hay caja abierta" });
        // 2) Traer transacciones asociadas (más fiable que depender de populate en cash.movements)
        const transactions = await Transaction_1.Transaction.find({ cashRegister: cash._id }).lean().exec();
        // helper para leer monto (por si usás amount o total)
        const getAmount = (t) => { var _a, _b; return Number((_b = (_a = t === null || t === void 0 ? void 0 : t.amount) !== null && _a !== void 0 ? _a : t === null || t === void 0 ? void 0 : t.total) !== null && _b !== void 0 ? _b : 0); };
        // 3) Calcular totales
        const totalSales = transactions
            .filter(t => t.type === "ingreso")
            .reduce((acc, t) => acc + getAmount(t), 0);
        const totalExpenses = transactions
            .filter(t => t.type === "egreso")
            .reduce((acc, t) => acc + getAmount(t), 0);
        const cashBalance = ((_a = cash.initialAmount) !== null && _a !== void 0 ? _a : 0) + totalSales - totalExpenses;
        // 4) Formatear movimientos para el frontend (incluimos productos, fecha, etc.)
        const movements = transactions.map((t) => {
            var _a, _b, _c, _d;
            return ({
                _id: t._id,
                type: t.type,
                amount: getAmount(t),
                paymentMethod: t.paymentMethod,
                concept: t.concept || t.description || "",
                products: (_b = (_a = t.products) === null || _a === void 0 ? void 0 : _a.map((p) => {
                    var _a;
                    return ({
                        barcode: p.barcode,
                        name: p.name,
                        price: p.price,
                        quantity: (_a = p.quantity) !== null && _a !== void 0 ? _a : 1 // si no guardás quantity, asumimos 1
                    });
                })) !== null && _b !== void 0 ? _b : [],
                date: (_d = (_c = t.date) !== null && _c !== void 0 ? _c : t.createdAt) !== null && _d !== void 0 ? _d : null
            });
        });
        return res.json({
            cashId: cash._id,
            openedAt: cash.openDate,
            initialAmount: cash.initialAmount,
            totalSales,
            totalExpenses,
            cashBalance,
            movements
        });
    }
    catch (error) {
        console.error("❌ Error al obtener resumen de caja:", error);
        return res.status(500).json({ message: "Error al obtener resumen de caja" });
    }
});
// 💸 Registrar movimiento
router.post("/movement", async (req, res) => {
    try {
        const { type, amount, paymentMethod, concept, products, client, user } = req.body;
        console.log(req.body);
        // 1️⃣ Buscar caja abierta
        const cash = await CashRegister_1.CashRegister.findOne({ status: "abierta" });
        if (!cash) {
            return res.status(400).json({ message: "No hay caja abierta" });
        }
        // 2️⃣ Validar que products tenga quantity
        if ((products === null || products === void 0 ? void 0 : products.length) > 0) {
            for (const p of products) {
                if ((p.barcode != "0000" && p.barcode != "1111") || typeof p.quantity !== "number" || p.quantity <= 0) {
                    return res.status(400).json({ message: `Cantidad inválida para el producto ${p.name}` });
                }
            }
        }
        // 3️⃣ Crear la transacción asociada a la caja
        const transaction = new Transaction_1.Transaction({
            type,
            amount,
            paymentMethod,
            concept,
            products,
            client,
            user,
            date: new Date(),
            cashRegister: cash._id,
        });
        await transaction.save();
        // 4️⃣ Actualizar stock si es una venta (ingreso)
        if (type === "ingreso") {
            for (const prod of products) {
                await Products_1.Product.findOneAndUpdate({ barcode: prod.barcode }, { $inc: { stock: -prod.quantity } }, { new: true });
            }
        }
        // 5️⃣ Vincular transacción a la caja
        cash.movements.push(transaction._id);
        await cash.save();
        // 6️⃣ Responder con datos completos
        return res.status(201).json({
            message: "Movimiento registrado y stock actualizado correctamente",
            cash,
            transaction,
        });
    }
    catch (error) {
        console.error("❌ Error al registrar movimiento:", error);
        return res.status(500).json({ message: "Error al registrar movimiento" });
    }
});
// 🔒 Cerrar caja
router.post("/close", async (_req, res) => {
    try {
        // 🔎 Buscar caja abierta y poblar transacciones
        const cash = await CashRegister_1.CashRegister.findOne({ status: "abierta" }).populate("movements");
        if (!cash)
            return res.status(400).json({ message: "No hay caja abierta" });
        // 💰 Calcular ingresos y egresos desde las transacciones
        const ingresos = cash.movements
            .filter((t) => t.type === "ingreso")
            .reduce((acc, t) => acc + t.amount, 0);
        const egresos = cash.movements
            .filter((t) => t.type === "egreso")
            .reduce((acc, t) => acc + t.amount, 0);
        // 📊 Calcular monto final
        cash.finalAmount = cash.initialAmount + ingresos - egresos;
        cash.status = "cerrada";
        cash.closeDate = new Date();
        await cash.save();
        return res.json({
            message: "Caja cerrada correctamente ✅",
            caja: cash,
            resumen: {
                ingresos,
                egresos,
                saldoFinal: cash.finalAmount
            }
        });
    }
    catch (error) {
        console.error("❌ Error al cerrar caja:", error);
        return res.status(500).json({ message: "Error al cerrar caja" });
    }
});
// 📜 Historial
router.get("/history", async (_req, res) => {
    const history = await CashRegister_1.CashRegister.find().sort({ openDate: -1 });
    res.json(history);
});
// 💥 Eliminar movimiento por ID
router.delete("/movement/:id", async (req, res) => {
    var _a;
    try {
        const { id } = req.params;
        // 🔎 Buscar caja abierta
        const cash = await CashRegister_1.CashRegister.findOne({ status: "abierta" });
        if (!cash)
            return res.status(400).json({ message: "No hay caja abierta" });
        // 🔎 Buscar el movimiento en el array (movements son ObjectIds)
        const movementIndex = cash.movements.findIndex(m => m.toString() === id);
        if (movementIndex === -1)
            return res.status(404).json({ message: "Movimiento no encontrado" });
        const transactionId = cash.movements[movementIndex];
        // 🔄 Buscar la transacción asociada
        const transaction = await Transaction_1.Transaction.findById(transactionId);
        if (transaction) {
            // 🧮 Restaurar stock si era una venta
            if (transaction.type === "ingreso" && ((_a = transaction.products) === null || _a === void 0 ? void 0 : _a.length) > 0) {
                for (const prod of transaction.products) {
                    await Products_1.Product.findOneAndUpdate({ barcode: prod.barcode }, { $inc: { stock: prod.quantity } });
                }
            }
            // ❌ Eliminar la transacción
            await Transaction_1.Transaction.findByIdAndDelete(transactionId);
        }
        // 🗑️ Quitar el movimiento de la caja
        cash.movements.splice(movementIndex, 1);
        await cash.save();
        return res.json({ message: "Movimiento eliminado y stock restaurado", cash });
    }
    catch (error) {
        console.error("❌ Error al eliminar movimiento:", error);
        return res.status(500).json({ message: "Error al eliminar movimiento" });
    }
});
exports.default = router;
