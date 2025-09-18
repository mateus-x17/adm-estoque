import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { prisma } from "./config/prismaClient.js";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import movementRoutes from "./routes/movementRoutes.js";

// configs
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
// middlewares
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads")); // servir imagens gravadas em /uploads


// Teste de conexão
app.get("/", (req, res) => res.send("🚀 Backend Estoque rodando"));
app.get("/test-db", async (req, res) => {
  try {
    const result = await prisma.$queryRaw`SELECT NOW()`;
    res.json({ message: "✅ Conexão com Neon/Postgres funcionando!", result });
  } catch (error) {
    res.status(500).json({ error: "Erro ao conectar no banco", details: error.message });
  }
});


// Rotas
app.use("/users", userRoutes);
app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/categories", categoryRoutes);
app.use("/suppliers", supplierRoutes);
app.use("/movements", movementRoutes);


app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});
