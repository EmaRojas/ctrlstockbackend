import { Router } from "express";
import { Product } from "../models/Products";

const router = Router();

// Crear producto
router.post("/", async (req, res) => {
    try {
        console.log(req.body);
        const product = new Product(req.body);
        await product.save();
        res.status(201).json(product);
    } catch (error) {
        console.log(error);
        res.status(400).json({ error });
    }
});

// Listar productos
router.get("/", async (_req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error });
    }
});

// Obtener un producto
router.get("/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: "No encontrado" });
        res.json(product);
    } catch (error) {
        res.status(500).json({ error });
    }
});

// Actualizar producto
router.put("/:id", async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        });
        if (!product) return res.status(404).json({ error: "No encontrado" });
        res.json(product);
    } catch (error) {
        res.status(400).json({ error });
    }
});

// Eliminar producto
router.delete("/:id", async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ error: "No encontrado" });
        res.json({ message: "Producto eliminado" });
    } catch (error) {
        res.status(500).json({ error });
    }
});

export default router;
