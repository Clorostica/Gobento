import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes/index.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

app.get("/", (_, res) => {
  res.send("Healthcheck");
});

app.use("/", routes);

export default app;


if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
  });
}

