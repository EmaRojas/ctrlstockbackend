import { Router, Request, Response } from "express";
import { CashRegister } from "../models/CashRegister";
import { Transaction } from "../models/Transaction";
import { Product } from "../models/Products";


const router = Router();

// 🟢 Abrir caja
router.post("/open", async (req: Request, res: Response) => {
  const { initialAmount, openedBy } = req.body;

  const active = await CashRegister.findOne({ status: "abierta" });
  if (active) return res.status(400).json({ message: "Ya hay una caja abierta" });

  const cash = new CashRegister({ initialAmount, openedBy });
  await cash.save();

  res.status(201).json(cash);
});

// 📊 Obtener caja activa
router.get("/active", async (_req: Request, res: Response) => {
  try {
    // 1) Buscar caja abierta
    const cash = await CashRegister.findOne({ status: "abierta" }).exec();
    if (!cash) return res.status(404).json({ message: "No hay caja abierta" });

    // 2) Traer transacciones asociadas (más fiable que depender de populate en cash.movements)
    const transactions = await Transaction.find({ cashRegister: cash._id }).lean().exec();

    // helper para leer monto (por si usás amount o total)
    const getAmount = (t: any) => Number(t?.amount ?? t?.total ?? 0);

    // 3) Calcular totales
    const totalSales = transactions
      .filter(t => t.type === "ingreso")
      .reduce((acc, t) => acc + getAmount(t), 0);

    const totalExpenses = transactions
      .filter(t => t.type === "egreso")
      .reduce((acc, t) => acc + getAmount(t), 0);

    const cashBalance = (cash.initialAmount ?? 0) + totalSales - totalExpenses;

    // 4) Formatear movimientos para el frontend (incluimos productos, fecha, etc.)
    const movements = transactions.map((t: any) => ({
      _id: t._id,
      type: t.type,
      amount: getAmount(t),
      paymentMethod: t.paymentMethod,
      concept: t.concept || t.description || "",
      products: t.products?.map((p: any) => ({
        barcode: p.barcode,
        name: p.name,
        price: p.price,
        quantity: p.quantity ?? 1 // si no guardás quantity, asumimos 1
      })) ?? [],
      date: t.date ?? t.createdAt ?? null
    }));

    return res.json({
      cashId: cash._id,
      openedAt: cash.openDate,
      initialAmount: cash.initialAmount,
      totalSales,
      totalExpenses,
      cashBalance,
      movements
    });
  } catch (error) {
    console.error("❌ Error al obtener resumen de caja:", error);
    return res.status(500).json({ message: "Error al obtener resumen de caja" });
  }
});

// 💸 Registrar movimiento
router.post("/movement", async (req: Request, res: Response) => {
  try {
    const { type, amount, paymentMethod, concept, products, client, user } = req.body;
    console.log(req.body);

    // 1️⃣ Buscar caja abierta
    const cash = await CashRegister.findOne({ status: "abierta" });
    if (!cash) {
      return res.status(400).json({ message: "No hay caja abierta" });
    }

    // 2️⃣ Validar que products tenga quantity
    if (products?.length > 0) {
      for (const p of products) {
        if ((p.barcode != "0000" && p.barcode != "1111") || typeof p.quantity !== "number" || p.quantity <= 0) {
          return res.status(400).json({ message: `Cantidad inválida para el producto ${p.name}` });
        }
      }
    }

    // 3️⃣ Crear la transacción asociada a la caja
    const transaction = new Transaction({
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
        await Product.findOneAndUpdate(
          { barcode: prod.barcode },
          { $inc: { stock: -prod.quantity } },
          { new: true }
        );
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
  } catch (error) {
    console.error("❌ Error al registrar movimiento:", error);
    return res.status(500).json({ message: "Error al registrar movimiento" });
  }
});


// 🔒 Cerrar caja
router.post("/close", async (_req, res) => {
  try {
    // 🔎 Buscar caja abierta y poblar transacciones
    const cash = await CashRegister.findOne({ status: "abierta" }).populate("movements");
    if (!cash) return res.status(400).json({ message: "No hay caja abierta" });

    // 💰 Calcular ingresos y egresos desde las transacciones
    const ingresos = cash.movements
      .filter((t: any) => t.type === "ingreso")
      .reduce((acc: number, t: any) => acc + t.amount, 0);

    const egresos = cash.movements
      .filter((t: any) => t.type === "egreso")
      .reduce((acc: number, t: any) => acc + t.amount, 0);

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
  } catch (error) {
    console.error("❌ Error al cerrar caja:", error);
    return res.status(500).json({ message: "Error al cerrar caja" });
  }
});


// 📜 Historial
router.get("/history", async (_req: Request, res: Response) => {
  const history = await CashRegister.find().sort({ openDate: -1 });
  res.json(history);
});

// 💥 Eliminar movimiento por ID
router.delete("/movement/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // 🔎 Buscar caja abierta
    const cash = await CashRegister.findOne({ status: "abierta" });
    if (!cash) return res.status(400).json({ message: "No hay caja abierta" });

    // 🔎 Buscar el movimiento en el array (movements son ObjectIds)
    const movementIndex = cash.movements.findIndex(m => m.toString() === id);
    if (movementIndex === -1) return res.status(404).json({ message: "Movimiento no encontrado" });

    const transactionId = cash.movements[movementIndex];

    // 🔄 Buscar la transacción asociada
    const transaction = await Transaction.findById(transactionId);
    if (transaction) {
      // 🧮 Restaurar stock si era una venta
      if (transaction.type === "ingreso" && transaction.products?.length > 0) {
        for (const prod of transaction.products) {
          await Product.findOneAndUpdate(
            { barcode: prod.barcode },
            { $inc: { stock: prod.quantity } }
          );
        }
      }

      // ❌ Eliminar la transacción
      await Transaction.findByIdAndDelete(transactionId);
    }

    // 🗑️ Quitar el movimiento de la caja
    cash.movements.splice(movementIndex, 1);
    await cash.save();

    return res.json({ message: "Movimiento eliminado y stock restaurado", cash });
  } catch (error) {
    console.error("❌ Error al eliminar movimiento:", error);
    return res.status(500).json({ message: "Error al eliminar movimiento" });
  }
});


export default router;
