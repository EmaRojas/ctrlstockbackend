import mongoose, { Schema, Document, model } from "mongoose";

export interface IProduct extends Document {
  name: string;
  price: number;
  cost: number;
  stock: number;
  barcode: string;
}

const ProductSchema = new Schema<IProduct>({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  cost: { type: Number, required: true },
  stock: { type: Number, required: true },
  barcode: { type: String, required: true, unique: true },
});

export const Product = model<IProduct>("Product", ProductSchema);
