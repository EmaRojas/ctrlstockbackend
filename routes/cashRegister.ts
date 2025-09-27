import { Router, Request, Response } from "express";
import { CashRegister, ICashRegister } from "../models/CashRegister";

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
  const cash = await CashRegister.findOne({ status: "abierta" });
  res.json(cash || null);
});

// 💸 Registrar movimiento
router.post("/movement", async (req: Request, res: Response) => {
    console.log(req);
  const { type, amount, paymentMethod, concept } = req.body;

  const cash = await CashRegister.findOne({ status: "abierta" });
  if (!cash) return res.status(400).json({ message: "No hay caja abierta" });

  cash.movements.push({ type, amount, paymentMethod, concept, date: new Date() });
  await cash.save();

  res.status(201).json(cash);
});

// 🔒 Cerrar caja
router.post("/close", async (_req: Request, res: Response) => {
  const cash = await CashRegister.findOne({ status: "abierta" });
  if (!cash) return res.status(400).json({ message: "No hay caja abierta" });

  const ingresos = cash.movements
    .filter((m) => m.type === "ingreso")
    .reduce((acc, m) => acc + m.amount, 0);

  const egresos = cash.movements
    .filter((m) => m.type === "egreso")
    .reduce((acc, m) => acc + m.amount, 0);

  cash.finalAmount = cash.initialAmount + ingresos - egresos;
  cash.status = "cerrada";
  cash.closeDate = new Date();

  await cash.save();
  res.json(cash);
});

// 📜 Historial
router.get("/history", async (_req: Request, res: Response) => {
  const history = await CashRegister.find().sort({ openDate: -1 });
  res.json(history);
});

// 💥 Eliminar movimiento por id
router.delete("/movement/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  const cash = await CashRegister.findOne({ status: "abierta" });
  if (!cash) return res.status(400).json({ message: "No hay caja abierta" });

  const index = cash.movements.findIndex((m) => m._id?.toString() === id);
  if (index === -1) return res.status(404).json({ message: "Movimiento no encontrado" });

  cash.movements.splice(index, 1);
  await cash.save();

  res.json(cash);
});

export default router;
