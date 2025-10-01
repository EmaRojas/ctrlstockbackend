import mongoose, { Schema, Document, model } from "mongoose";

export interface ICashRegister extends Document {
  openDate: Date;
  closeDate?: Date;
  initialAmount: number;
  finalAmount?: number;
  status: "abierta" | "cerrada";
  openedBy?: string;
  movements: mongoose.Types.ObjectId[];
}

const CashRegisterSchema = new Schema<ICashRegister>({
  openDate: { type: Date, default: Date.now },
  closeDate: { type: Date },
  initialAmount: { type: Number, required: true },
  finalAmount: { type: Number },
  status: { type: String, enum: ["abierta", "cerrada"], default: "abierta" },
  openedBy: { type: String },
  movements: [{ type: mongoose.Schema.Types.ObjectId, ref: "Transaction" }], // ✅ corregido
});

export const CashRegister = model<ICashRegister>("CashRegister", CashRegisterSchema);
