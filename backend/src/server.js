require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const authRoutes = require("./auth/authRoutes");
const walletRoutes = require("./wallets/walletRoutes");
const categoryRoutes = require("./categories/categoryRoutes");
const movementRoutes = require("./movements/movementRoutes");
const cardRoutes = require("./cards/cardRoutes");
const investmentRoutes = require("./investments/investmentRoutes");
const fixedBillRoutes = require("./fixedbills/fixedBillRoutes");
const dashboardRoutes = require("./dashboard/dashboardRoutes");
const searchRoutes = require("./search/searchRoutes");

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/auth", authRoutes);
app.use("/wallets", walletRoutes);
app.use("/categories", categoryRoutes);
app.use("/movements", movementRoutes);
app.use("/cards", cardRoutes);
app.use("/investments", investmentRoutes);
app.use("/fixed-bills", fixedBillRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/search", searchRoutes);

// Handler genérico de erros
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Erro interno do servidor." });
});

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
