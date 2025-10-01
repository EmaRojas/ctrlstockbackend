// models/Transaction.ts
import mongoose, { Schema, Document, model, Types } from "mongoose";

interface IProductSold {
  barcode: string;
  name: string;
  price: number;
  quantity: number;
}

export interface ITransaction extends Document {
  type: string;
  amount: number;
  paymentMethod: string;
  quantity:number,
  concept?: string;
  products: IProductSold[];
  client?: string;
  user?: string;
  date: Date;
  cashRegister: mongoose.Types.ObjectId;
}

const ProductSoldSchema = new Schema<IProductSold>({
  barcode: String,
  name: String,
  price: Number,
  quantity: Number,
});

const TransactionSchema = new Schema<ITransaction>({
  type: { type: String, enum: ["ingreso", "egreso"], required: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  concept: { type: String },
  products: { type: [ProductSoldSchema], required: true },
  client: { type: String },
  user: { type: String },
  date: { type: Date, default: Date.now },
  cashRegister: { type: mongoose.Schema.Types.ObjectId, ref: "CashRegister", required: true },
});

export const Transaction = model<ITransaction>("Transaction", TransactionSchema);
