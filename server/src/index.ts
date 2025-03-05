import "dotenv/config";
import express from "express";
import cors from "cors";
import transcribeRoutes from "./routes/transcribeRoutes";

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use("/api", transcribeRoutes);

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
