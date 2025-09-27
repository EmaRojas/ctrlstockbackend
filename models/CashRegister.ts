import mongoose, { Schema, Document, model, Types } from "mongoose";

export interface IMovement {
  _id?: Types.ObjectId;
  type: "ingreso" | "egreso";
  amount: number;
  paymentMethod: "efectivo" | "tarjeta" | "mercadopago" | "qr" | "otros";
  concept?: string;
  date?: Date;
}

export interface ICashRegister extends Document {
  openDate: Date;
  closeDate?: Date;
  initialAmount: number;
  finalAmount?: number;
  status: "abierta" | "cerrada";
  openedBy?: string;
  movements: IMovement[];
}

const MovementSchema = new Schema<IMovement>({
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

const CashRegisterSchema = new Schema<ICashRegister>({
  openDate: { type: Date, default: Date.now },
  closeDate: { type: Date },
  initialAmount: { type: Number, required: true },
  finalAmount: { type: Number },
  status: { type: String, enum: ["abierta", "cerrada"], default: "abierta" },
  openedBy: { type: String },
  movements: [MovementSchema],
});

export const CashRegister = model<ICashRegister>("CashRegister", CashRegisterSchema);
