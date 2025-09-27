"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CashRegister = void 0;
const mongoose_1 = require("mongoose");
const MovementSchema = new mongoose_1.Schema({
    type: { type: String, enum: ["ingreso", "egreso"], required: true },
    amount: { type: Number, required: true },
    paymentMethod: {
        type: String,
        enum: ["efectivo", "tarjeta", "mercadopago", "qr", "otros"],
        required: true,
    },
    concept: { type: String },
    date: { type: Date, default: Date.now },
});
const CashRegisterSchema = new mongoose_1.Schema({
    openDate: { type: Date, default: Date.now },
    closeDate: { type: Date },
    initialAmount: { type: Number, required: true },
    finalAmount: { type: Number },
    status: { type: String, enum: ["abierta", "cerrada"], default: "abierta" },
    openedBy: { type: String },
    movements: [MovementSchema],
});
exports.CashRegister = (0, mongoose_1.model)("CashRegister", CashRegisterSchema);
