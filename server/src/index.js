import express from "express";
import cors from "cors";
import { config } from "./config.js";

import authRoutes from "./routes/auth.js";
import managerRoutes from "./routes/manager.js";
import receptionRoutes from "./routes/reception.js";
import chefRoutes from "./routes/chef.js";
import waiterRoutes from "./routes/waiter.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("Restaurant backend running"));

app.use("/api/auth", authRoutes);
app.use("/api/manager", managerRoutes);
app.use("/api/chef", chefRoutes);
app.use("/api/reception", receptionRoutes);
app.use("/api/waiter", waiterRoutes);

app.listen(config.port, () =>
  console.log(`Backend running on http://localhost:${config.port}`)
);
