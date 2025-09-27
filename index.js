const mongoose = require("mongoose");

async function main() {
  try {
    await mongoose.connect("mongodb+srv://emarojas710_db_user:prueba1234@ctrlstock.8fqs9xw.mongodb.net/libreria?retryWrites=true&w=majority&appName=ctrlstock");

    console.log("✅ Conexión exitosa a MongoDB Atlas");

    // acá ya podés definir esquemas y modelos
  } catch (err) {
    console.error("❌ Error de conexión:", err);
  }
}

main();
